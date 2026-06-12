import { beforeEach, describe, expect, it } from 'vitest';
import { IDocumentRepository } from '../../repositories/documentRepository/IDocumentRepository';
import { ApprovalService } from '../ApprovalService';
import {
  AddDocumentAttachmentDto,
  ApprovalActor,
  CreateDocumentDto,
  DocStatus,
  Document,
  DocumentAttachment,
  DocumentAttachmentFile,
  DocumentVersion,
  UpdateDocumentDto,
} from '../../../shared/types';

class FakeDocumentRepository implements IDocumentRepository {
  private documents = new Map<string, Document>();
  private versions = new Map<string, DocumentVersion[]>();

  seed(document: Document): void {
    this.documents.set(document.id, document);
    this.versions.set(document.id, []);
  }

  findAll(): Document[] {
    return Array.from(this.documents.values());
  }

  findById(id: string): Document | undefined {
    return this.documents.get(id);
  }

  create(dto: CreateDocumentDto): Document {
    const now = new Date().toISOString();
    const document: Document = {
      id: `doc-${this.documents.size + 1}`,
      title: dto.title,
      content: dto.content,
      status: 'DRAFT',
      authorId: dto.authorId,
      authorName: dto.authorName,
      createdAt: now,
      updatedAt: now,
    };
    this.seed(document);
    return document;
  }

  update(id: string, dto: UpdateDocumentDto): Document {
    const document = this.requireDocument(id);
    const updatedDocument = {
      ...document,
      title: dto.title ?? document.title,
      content: dto.content ?? document.content,
      updatedAt: new Date().toISOString(),
    };
    this.documents.set(id, updatedDocument);
    return updatedDocument;
  }

  updateStatus(id: string, status: DocStatus, changeNote: string): Document {
    const document = this.requireDocument(id);
    const updatedDocument = {
      ...document,
      status,
      updatedAt: new Date().toISOString(),
    };
    const documentVersions = this.versions.get(id) ?? [];
    documentVersions.push({
      id: `version-${documentVersions.length + 1}`,
      documentId: id,
      versionNumber: documentVersions.length + 1,
      content: document.content,
      authorId: document.authorId,
      authorName: document.authorName,
      createdAt: updatedDocument.updatedAt,
      changeNote,
    });
    this.versions.set(id, documentVersions);
    this.documents.set(id, updatedDocument);
    return updatedDocument;
  }

  restoreVersion(id: string): Document {
    return this.requireDocument(id);
  }

  delete(id: string): void {
    this.documents.delete(id);
    this.versions.delete(id);
  }

  findVersions(documentId: string): DocumentVersion[] {
    return this.versions.get(documentId) ?? [];
  }

  findAttachments(): DocumentAttachment[] {
    return [];
  }

  addAttachment(_documentId: string, dto: AddDocumentAttachmentDto): DocumentAttachment {
    return {
      id: 'attachment-1',
      documentId: _documentId,
      fileName: dto.fileName,
      mimeType: dto.mimeType,
      size: dto.size,
      createdAt: new Date().toISOString(),
    };
  }

  getAttachmentFile(): DocumentAttachmentFile | undefined {
    return undefined;
  }

  deleteAttachment(): void {}

  getVersionByNumber(
    documentId: string,
    version: number,
  ): DocumentVersion | undefined {
    return this.findVersions(documentId).find(
      (documentVersion) => documentVersion.versionNumber === version,
    );
  }

  private requireDocument(id: string): Document {
    const document = this.documents.get(id);
    if (!document) throw new Error(`Document not found: ${id}`);
    return document;
  }
}

const employee: ApprovalActor = {
  id: 'user-employee',
  name: 'Employee',
  role: 'EMPLOYEE',
};

const manager: ApprovalActor = {
  id: 'user-manager',
  name: 'Manager',
  role: 'MANAGER',
};

function createDocument(status: DocStatus): Document {
  return {
    id: 'document-1',
    title: 'Approval regulation',
    content: 'Document content',
    status,
    authorId: 'author-1',
    authorName: 'Author',
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
  };
}

describe('ApprovalService', () => {
  let repository: FakeDocumentRepository;
  let service: ApprovalService;

  beforeEach(() => {
    repository = new FakeDocumentRepository();
    service = new ApprovalService(repository);
  });

  it('submits a draft document for approval', () => {
    repository.seed(createDocument('DRAFT'));

    const result = service.submitForApproval('document-1', employee);

    expect(result.previousStatus).toBe('DRAFT');
    expect(result.nextStatus).toBe('PENDING');
    expect(result.document.status).toBe('PENDING');
  });

  it('approves a pending document', () => {
    repository.seed(createDocument('PENDING'));

    const result = service.approveDocument('document-1', manager);

    expect(result.previousStatus).toBe('PENDING');
    expect(result.nextStatus).toBe('APPROVED');
    expect(result.document.status).toBe('APPROVED');
  });

  it('rejects a pending document', () => {
    repository.seed(createDocument('PENDING'));

    const result = service.rejectDocument('document-1', manager);

    expect(result.previousStatus).toBe('PENDING');
    expect(result.nextStatus).toBe('REJECTED');
    expect(result.document.status).toBe('REJECTED');
  });

  it('does not approve a draft document', () => {
    repository.seed(createDocument('DRAFT'));

    expect(() => service.approveDocument('document-1', manager)).toThrow(
      'Approval action APPROVE is not allowed for document status DRAFT',
    );
  });

  it('does not reject a draft document', () => {
    repository.seed(createDocument('DRAFT'));

    expect(() => service.rejectDocument('document-1', manager)).toThrow(
      'Approval action REJECT is not allowed for document status DRAFT',
    );
  });

  it('does not resubmit an approved document', () => {
    repository.seed(createDocument('APPROVED'));

    expect(() => service.submitForApproval('document-1', employee)).toThrow(
      'Approval action SUBMIT is not allowed for document status APPROVED',
    );
  });

  it('does not allow an employee to approve a document', () => {
    repository.seed(createDocument('PENDING'));

    expect(() => service.approveDocument('document-1', employee)).toThrow(
      'Only MANAGER or ADMINISTRATOR can approve or reject documents',
    );
  });

  it('returns the approval comment and saves it in the change history', () => {
    repository.seed(createDocument('PENDING'));

    const result = service.approveDocument('document-1', manager, 'Approved');
    const [version] = repository.findVersions('document-1');

    expect(result.comment?.text).toBe('Approved');
    expect(version.changeNote).toContain('Комментарий: Approved');
  });

  it('supports the full approval scenario from draft to approved', () => {
    repository.seed(createDocument('DRAFT'));

    const submitResult = service.submitForApproval(
      'document-1',
      employee,
      'Ready for review',
    );
    const approveResult = service.approveDocument(
      'document-1',
      manager,
      'Approved after review',
    );
    const versions = repository.findVersions('document-1');

    expect(submitResult.document.status).toBe('PENDING');
    expect(approveResult.document.status).toBe('APPROVED');
    expect(versions).toHaveLength(2);
    expect(versions[0].changeNote).toContain('Документ отправлен на согласование');
    expect(versions[1].changeNote).toContain('Документ утвержден');
  });
});
