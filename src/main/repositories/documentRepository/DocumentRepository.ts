import { Buffer } from 'node:buffer';
import { eq, and, desc, isNull } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { IDocumentRepository } from './IDocumentRepository';
import {
  AddDocumentAttachmentDto,
  Document,
  DocumentAttachment,
  DocumentAttachmentFile,
  DocumentVersion,
  CreateDocumentDto,
  UpdateDocumentDto,
} from '../../../shared/types';
import { documentAttachments, documents, documentVersions } from '../../db/schema';
import type { DbDocument, DbDocumentAttachment, DbDocumentVersion } from '../../db/schema';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '../../db/schema';

function toDocument(dbDoc: DbDocument): Document {
  return {
    id: dbDoc.id,
    title: dbDoc.title,
    content: dbDoc.content,
    status: dbDoc.status,
    authorId: dbDoc.authorId,
    authorName: dbDoc.authorName,
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
      tx.insert(documentVersions).values({
        id: versionId,
        documentId: id,
        versionNumber: nextVersion,
        content: existing.content,
        authorId: existing.authorId,
        authorName: existing.authorName,
        changeNote: dto.changeNote,
        createdAt: now,
      }).run();

      const updates: Partial<DbDocument> = {
        updatedAt: now,
        currentVersionId: versionId,
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
      tx.insert(documentVersions).values({
        id: versionId,
        documentId: id,
        versionNumber: nextVersion,
        content: existing.content,
        authorId: existing.authorId,
        authorName: existing.authorName,
        changeNote,
        createdAt: now,
      }).run();

      tx.update(documents)
        .set({ status, updatedAt: now, currentVersionId: versionId })
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
      tx.insert(documentVersions).values({
        id: versionId,
        documentId: id,
        versionNumber: nextVersion,
        content: existing.content,
        authorId: existing.authorId,
        authorName: existing.authorName,
        changeNote,
        createdAt: now,
      }).run();

      tx.update(documents)
        .set({
          content: version.content,
          updatedAt: now,
          currentVersionId: versionId,
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
