import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import { eq, and, desc, isNull } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { IDocumentRepository } from './IDocumentRepository';
import {
  AddDocumentAttachmentDto,
  Document,
  DocumentAttachment,
  DocumentAttachmentFile,
  DocumentVersion,
  DocumentVersionIntegrity,
  DocumentVersionIntegrityViolation,
  CreateDocumentDto,
  CreateDocumentFromVersionDto,
  UpdateDocumentDto,
} from '../../../shared/types';
import { documentAttachments, documents, documentVersions } from '../../db/schema';
import type { DbDocument, DbDocumentAttachment, DbDocumentVersion } from '../../db/schema';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '../../db/schema';

const HASH_VERSION = 'v1';

function sha256(value: string): string {
  return createHash('sha256').update(`${HASH_VERSION}:${value}`, 'utf8').digest('hex');
}

function hashVersionContent(content: string): string {
  return sha256(`content:${content}`);
}

function hashVersionHistory(
  row: Pick<
    DbDocumentVersion,
    | 'id'
    | 'documentId'
    | 'versionNumber'
    | 'authorId'
    | 'authorName'
    | 'changeNote'
    | 'createdAt'
  > & { contentHash: string },
  previousHistoryHash: string | null,
): string {
  return sha256(
    JSON.stringify({
      version: HASH_VERSION,
      id: row.id,
      documentId: row.documentId,
      versionNumber: row.versionNumber,
      contentHash: row.contentHash,
      authorId: row.authorId,
      authorName: row.authorName,
      changeNote: row.changeNote,
      createdAt: row.createdAt,
      previousHistoryHash,
    }),
  );
}

function toDocument(dbDoc: DbDocument): Document {
  return {
    id: dbDoc.id,
    title: dbDoc.title,
    content: dbDoc.content,
    status: dbDoc.status,
    authorId: dbDoc.authorId,
    authorName: dbDoc.authorName,
    sourceVersionId: dbDoc.sourceVersionId,
    createdAt: dbDoc.createdAt,
    updatedAt: dbDoc.updatedAt,
  };
}

function toVersion(dbVer: DbDocumentVersion): DocumentVersion {
  return {
    id: dbVer.id,
    documentId: dbVer.documentId,
    versionNumber: dbVer.versionNumber,
    content: dbVer.content,
    authorId: dbVer.authorId,
    authorName: dbVer.authorName,
    createdAt: dbVer.createdAt,
    changeNote: dbVer.changeNote,
    contentHash: dbVer.contentHash,
    historyHash: dbVer.historyHash,
  };
}

function toAttachment(dbAttachment: DbDocumentAttachment): DocumentAttachment {
  return {
    id: dbAttachment.id,
    documentId: dbAttachment.documentId,
    fileName: dbAttachment.fileName,
    mimeType: dbAttachment.mimeType,
    size: dbAttachment.size,
    createdAt: dbAttachment.createdAt,
  };
}

function toAttachmentFile(dbAttachment: DbDocumentAttachment): DocumentAttachmentFile {
  return {
    ...toAttachment(dbAttachment),
    data: new Uint8Array(dbAttachment.data),
  };
}

export class DocumentRepository implements IDocumentRepository {
  constructor(
    private readonly db: BetterSQLite3Database<typeof schema>
  ) {}

  checkVersionHistoryIntegrity(documentId: string): DocumentVersionIntegrity {
    const rows = this.selectVersionsOrderedAsc(documentId);
    if (rows.length === 0) {
      return { isValid: true, violations: [] };
    }

    const violations: DocumentVersionIntegrityViolation[] = [];
    const storedHead = this.getCurrentVersionHistoryHash(documentId);
    let expectedPreviousHistoryHash: string | null = null;

    for (const row of rows) {
      const expectedContentHash = hashVersionContent(row.content);
      const expectedHistoryHash = hashVersionHistory(
        {
          ...row,
          contentHash: expectedContentHash,
        },
        expectedPreviousHistoryHash,
      );

      if (!row.contentHash || !row.historyHash) {
        violations.push({
          versionNumber: row.versionNumber,
          reason: 'missing_hash',
          message: `Версия v${row.versionNumber} не имеет контрольной суммы.`,
        });
      } else {
        if (row.contentHash !== expectedContentHash) {
          violations.push({
            versionNumber: row.versionNumber,
            reason: 'content_hash_mismatch',
            message: `Версия v${row.versionNumber}: содержимое не совпадает с контрольной суммой.`,
          });
        }

        if (row.historyHash !== expectedHistoryHash) {
          violations.push({
            versionNumber: row.versionNumber,
            reason: 'history_hash_mismatch',
            message: `Версия v${row.versionNumber}: цепочка истории изменена.`,
          });
        }
      }

      expectedPreviousHistoryHash = expectedHistoryHash;
    }

    if (storedHead === null) {
      violations.push({
        versionNumber: rows[rows.length - 1].versionNumber,
        reason: 'history_chain_mismatch',
        message: 'Документ не хранит контрольную сумму последней версии истории.',
      });
    } else if (storedHead !== expectedPreviousHistoryHash) {
      violations.push({
        versionNumber: rows[rows.length - 1].versionNumber,
        reason: 'history_chain_mismatch',
        message: 'Последняя контрольная сумма истории не совпадает с записью документа.',
      });
    }

    return {
      isValid: violations.length === 0,
      violations,
    };
  }

  private createVersionValues(params: {
    id: string;
    documentId: string;
    versionNumber: number;
    content: string;
    authorId: string;
    authorName: string;
    changeNote: string;
    createdAt: string;
  }) {
    const contentHash = hashVersionContent(params.content);
    const previousHistoryHash = this.getCurrentVersionHistoryHash(params.documentId);
    const historyHash = hashVersionHistory(
      {
        id: params.id,
        documentId: params.documentId,
        versionNumber: params.versionNumber,
        authorId: params.authorId,
        authorName: params.authorName,
        changeNote: params.changeNote,
        createdAt: params.createdAt,
        contentHash,
      },
      previousHistoryHash,
    );

    return {
      ...params,
      contentHash,
      historyHash,
    };
  }

  private getCurrentVersionHistoryHash(documentId: string): string | null {
    const row = this.db
      .select({ versionHistoryHash: documents.versionHistoryHash })
      .from(documents)
      .where(eq(documents.id, documentId))
      .get();

    return row?.versionHistoryHash ?? null;
  }

  private selectVersionsOrderedAsc(documentId: string): DbDocumentVersion[] {
    return this.db
      .select()
      .from(documentVersions)
      .where(eq(documentVersions.documentId, documentId))
      .orderBy(documentVersions.versionNumber)
      .all();
  }

  private getSourceVersion(
    documentId: string,
    versionId: string,
  ): DbDocumentVersion | undefined {
    return this.db
      .select()
      .from(documentVersions)
      .where(
        and(
          eq(documentVersions.documentId, documentId),
          eq(documentVersions.id, versionId),
        ),
      )
      .get();
  }

  findAll(): Document[] {
    const rows = this.db
      .select()
      .from(documents)
      .where(isNull(documents.deletedAt))
      .orderBy(desc(documents.updatedAt))
      .all();

    return rows.map(toDocument);
  }

  findById(id: string): Document | undefined {
    const row = this.db
      .select()
      .from(documents)
      .where(and(eq(documents.id, id), isNull(documents.deletedAt)))
      .get();

    return row ? toDocument(row) : undefined;
  }

  create(dto: CreateDocumentDto): Document {
    const now = new Date().toISOString();
    const newDoc: DbDocument = {
      id: uuidv4(),
      title: dto.title,
      content: dto.content,
      status: 'DRAFT',
      authorId: dto.authorId,
      authorName: dto.authorName,
      currentVersionId: null,
      sourceVersionId: null,
      versionHistoryHash: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    this.db.insert(documents).values(newDoc).run();
    return toDocument(newDoc);
  }

  createFromVersion(dto: CreateDocumentFromVersionDto): Document {
    const sourceVersion = this.getSourceVersion(dto.sourceDocumentId, dto.sourceVersionId);
    if (!sourceVersion) {
      throw new Error(`Source version not found: ${dto.sourceVersionId}`);
    }

    const now = new Date().toISOString();
    const newDoc: DbDocument = {
      id: uuidv4(),
      title: dto.title,
      content: dto.content,
      status: 'DRAFT',
      authorId: dto.authorId,
      authorName: dto.authorName,
      currentVersionId: null,
      sourceVersionId: sourceVersion.id,
      versionHistoryHash: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    this.db.insert(documents).values(newDoc).run();
    return toDocument(newDoc);
  }

  update(id: string, dto: UpdateDocumentDto): Document {
    const existing = this.findById(id);
    if (!existing) throw new Error(`Document not found: ${id}`);

    const now = new Date().toISOString();
    const nextVersion = this.getNextVersionNumber(id);

    this.db.transaction((tx) => {
      const versionId = uuidv4();
      const versionValues = this.createVersionValues({
        id: versionId,
        documentId: id,
        versionNumber: nextVersion,
        content: existing.content,
        authorId: existing.authorId,
        authorName: existing.authorName,
        changeNote: dto.changeNote,
        createdAt: now,
      });
      tx.insert(documentVersions).values(versionValues).run();
      const historyHash = versionValues.historyHash;

      const updates: Partial<DbDocument> = {
        updatedAt: now,
        currentVersionId: versionId,
        versionHistoryHash: historyHash,
      };
      if (dto.title !== undefined) updates.title = dto.title;
      if (dto.content !== undefined) updates.content = dto.content;

      tx.update(documents).set(updates).where(eq(documents.id, id)).run();
    });

    return this.findById(id)!;
  }

  updateStatus(
    id: string,
    status: Document['status'],
    changeNote: string,
  ): Document {
    const existing = this.findById(id);
    if (!existing) throw new Error(`Document not found: ${id}`);

    const now = new Date().toISOString();
    const nextVersion = this.getNextVersionNumber(id);

    this.db.transaction((tx) => {
      const versionId = uuidv4();
      const versionValues = this.createVersionValues({
        id: versionId,
        documentId: id,
        versionNumber: nextVersion,
        content: existing.content,
        authorId: existing.authorId,
        authorName: existing.authorName,
        changeNote,
        createdAt: now,
      });
      tx.insert(documentVersions).values(versionValues).run();

      tx.update(documents)
        .set({ status, updatedAt: now, currentVersionId: versionId, versionHistoryHash: versionValues.historyHash })
        .where(eq(documents.id, id))
        .run();
    });

    return this.findById(id)!;
  }

  restoreVersion(id: string, versionNumber: number, changeNote: string): Document {
    const existing = this.findById(id);
    if (!existing) throw new Error(`Document not found: ${id}`);

    const version = this.getVersionByNumber(id, versionNumber);
    if (!version) {
      throw new Error(`Version not found: ${versionNumber} for document ${id}`);
    }

    const now = new Date().toISOString();
    const nextVersion = this.getNextVersionNumber(id);

    this.db.transaction((tx) => {
      const versionId = uuidv4();
      const versionValues = this.createVersionValues({
        id: versionId,
        documentId: id,
        versionNumber: nextVersion,
        content: existing.content,
        authorId: existing.authorId,
        authorName: existing.authorName,
        changeNote,
        createdAt: now,
      });
      tx.insert(documentVersions).values(versionValues).run();

      tx.update(documents)
        .set({
          content: version.content,
          updatedAt: now,
          currentVersionId: versionId,
          versionHistoryHash: versionValues.historyHash,
        })
        .where(eq(documents.id, id))
        .run();
    });

    return this.findById(id)!;
  }

  delete(id: string): void {
    const now = new Date().toISOString();
    this.db
      .update(documents)
      .set({ deletedAt: now })
      .where(eq(documents.id, id))
      .run();
  }

  findVersions(documentId: string): DocumentVersion[] {
    const rows = this.db
      .select()
      .from(documentVersions)
      .where(eq(documentVersions.documentId, documentId))
      .orderBy(desc(documentVersions.versionNumber))
      .all();

    return rows.map(toVersion);
  }

  findAttachments(documentId: string): DocumentAttachment[] {
    const rows = this.db
      .select()
      .from(documentAttachments)
      .where(eq(documentAttachments.documentId, documentId))
      .orderBy(desc(documentAttachments.createdAt))
      .all();

    return rows.map(toAttachment);
  }

  addAttachment(documentId: string, dto: AddDocumentAttachmentDto): DocumentAttachment {
    const now = new Date().toISOString();
    const newAttachment: DbDocumentAttachment = {
      id: uuidv4(),
      documentId,
      fileName: dto.fileName,
      mimeType: dto.mimeType || 'application/octet-stream',
      size: dto.size,
      data: Buffer.from(dto.data),
      createdAt: now,
    };

    this.db.insert(documentAttachments).values(newAttachment).run();
    return toAttachment(newAttachment);
  }

  getAttachmentFile(
    documentId: string,
    attachmentId: string,
  ): DocumentAttachmentFile | undefined {
    const row = this.db
      .select()
      .from(documentAttachments)
      .where(
        and(
          eq(documentAttachments.documentId, documentId),
          eq(documentAttachments.id, attachmentId),
        ),
      )
      .get();

    return row ? toAttachmentFile(row) : undefined;
  }

  deleteAttachment(documentId: string, attachmentId: string): void {
    this.db
      .delete(documentAttachments)
      .where(
        and(
          eq(documentAttachments.documentId, documentId),
          eq(documentAttachments.id, attachmentId),
        ),
      )
      .run();
  }

  getVersionByNumber(
    documentId: string,
    version: number,
  ): DocumentVersion | undefined {
    const row = this.db
      .select()
      .from(documentVersions)
      .where(
        and(
          eq(documentVersions.documentId, documentId),
          eq(documentVersions.versionNumber, version),
        ),
      )
      .get();

    return row ? toVersion(row) : undefined;
  }

  private getNextVersionNumber(documentId: string): number {
    const result = this.db
      .select({ max: documentVersions.versionNumber })
      .from(documentVersions)
      .where(eq(documentVersions.documentId, documentId))
      .get();

    return (result?.max ?? 0) + 1;
  }
}
