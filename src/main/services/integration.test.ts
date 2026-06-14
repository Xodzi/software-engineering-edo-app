import { describe, expect, it, vi } from 'vitest';
import { DocumentService } from './DocumentService';
import { ApprovalService } from './ApprovalService';
import { FileStorageService } from './FileStorageService';
import { IDocumentRepository } from '@main/repositories/documentRepository/IDocumentRepository';
import {
  Document,
  DocumentVersion,
  DocStatus,
  CreateDocumentDto,
  UpdateDocumentDto,
} from '@shared/types';

function createInMemoryRepository(): IDocumentRepository {
  const documents = new Map<string, Document>();
  const versions = new Map<string, DocumentVersion[]>();
  const attachments = new Map<string, unknown[]>();
  let docCounter = 0;
  let versionCounter = 0;

  return {
    findAll() {
      return Array.from(documents.values());
    },
    findById(id) {
      return documents.get(id);
    },
    create(dto) {
      docCounter += 1;
      const id = `doc-${docCounter}`;
      const now = new Date().toISOString();
      const doc: Document = {
        id,
        title: dto.title,
        content: dto.content,
        status: 'DRAFT',
        authorId: dto.authorId,
        authorName: dto.authorName,
        sourceVersionId: null,
        createdAt: now,
        updatedAt: now,
      };
      documents.set(id, doc);
      versions.set(id, []);
      return doc;
    },
    createFromVersion(dto) {
      return this.create(dto);
    },
    update(id, dto) {
      const doc = documents.get(id)!;
      if (dto.title) doc.title = dto.title;
      if (dto.content !== undefined) doc.content = dto.content;
      doc.updatedAt = new Date().toISOString();

      versionCounter += 1;
      const vers: DocumentVersion = {
        id: `v-${versionCounter}`,
        documentId: id,
        versionNumber: (versions.get(id)?.length ?? 0) + 1,
        content: doc.content,
        authorId: doc.authorId,
        authorName: doc.authorName,
        createdAt: new Date().toISOString(),
        changeNote: dto.changeNote,
        contentHash: '',
        historyHash: '',
      };
      versions.get(id)!.push(vers);

      return doc;
    },
    updateStatus(id, status, changeNote) {
      const doc = documents.get(id)!;
      const updated: Document = { ...doc, status, updatedAt: new Date().toISOString() };
      documents.set(id, updated);

      versionCounter += 1;
      const vers: DocumentVersion = {
        id: `v-${versionCounter}`,
        documentId: id,
        versionNumber: (versions.get(id)?.length ?? 0) + 1,
        content: updated.content,
        authorId: updated.authorId,
        authorName: updated.authorName,
        createdAt: new Date().toISOString(),
        changeNote,
        contentHash: '',
        historyHash: '',
      };
      versions.get(id)!.push(vers);

      return updated;
    },
    restoreVersion(id, versionNumber, changeNote) {
      const doc = documents.get(id)!;
      const versionList = versions.get(id)!;
      const targetVersion = versionList.find((v) => v.versionNumber === versionNumber);
      if (targetVersion) {
        doc.content = targetVersion.content;
        doc.updatedAt = new Date().toISOString();
      }
      versionCounter += 1;
      const vers: DocumentVersion = {
        id: `v-${versionCounter}`,
        documentId: id,
        versionNumber: versionList.length + 1,
        content: doc.content,
        authorId: doc.authorId,
        authorName: doc.authorName,
        createdAt: new Date().toISOString(),
        changeNote,
        contentHash: '',
        historyHash: '',
      };
      versionList.push(vers);
      return doc;
    },
    delete(id) {
      documents.delete(id);
      versions.delete(id);
      attachments.delete(id);
    },
    findVersions(id) {
      return versions.get(id) ?? [];
    },
    checkVersionHistoryIntegrity(id) {
      return { isValid: true, violations: [] };
    },
    findAttachments(id) {
      return (attachments.get(id) ?? []) as any;
    },
    addAttachment(id, dto) {
      const att = {
        id: `att-${Date.now()}`,
        documentId: id,
        fileName: dto.fileName,
        mimeType: dto.mimeType,
        size: dto.size,
        createdAt: new Date().toISOString(),
      };
      if (!attachments.has(id)) attachments.set(id, []);
      attachments.get(id)!.push(att);
      return att as any;
    },
    getAttachmentFile(id, attachmentId) {
      const att = (attachments.get(id) ?? []) as any[];
      const found = att.find((a) => a.id === attachmentId);
      return found ? { ...found, data: new ArrayBuffer(100) } : undefined;
    },
    deleteAttachment(id, attachmentId) {
      const att = (attachments.get(id) ?? []) as any[];
      const index = att.findIndex((a) => a.id === attachmentId);
      if (index >= 0) att.splice(index, 1);
    },
    getVersionByNumber(id, version) {
      const versionList = versions.get(id) ?? [];
      return versionList.find((v) => v.versionNumber === version);
    },
  };
}

describe('Integration: Document Workflow', () => {
  it('full lifecycle: create → edit → submit → approve', () => {
    const repo = createInMemoryRepository();
    const docService = new DocumentService(repo);
    const approvalService = new ApprovalService(repo);

    const employee = { id: 'emp-1', name: 'Employee', role: 'EMPLOYEE' as const };
    const manager = { id: 'mgr-1', name: 'Manager', role: 'MANAGER' as const };

    const createDto: CreateDocumentDto = {
      title: 'Project Proposal',
      content: 'Draft content',
      authorId: 'emp-1',
      authorName: 'Employee',
    };

    const doc = docService.createDocument(createDto);
    expect(doc.status).toBe('DRAFT');
    expect(doc.title).toBe('Project Proposal');

    const updated = docService.updateDocument(doc.id, {
      title: 'Project Proposal v2',
      content: 'Updated content',
      changeNote: 'Improved the proposal',
    });
    expect(updated.title).toBe('Project Proposal v2');
    expect(updated.content).toBe('Updated content');

    const submitted = approvalService.submitForApproval(doc.id, employee, 'Ready for review');
    expect(submitted.nextStatus).toBe('PENDING');

    const approved = approvalService.approveDocument(doc.id, manager, 'Looks good!');
    expect(approved.nextStatus).toBe('APPROVED');
    expect(approved.previousStatus).toBe('PENDING');

    const allVersions = docService.getDocumentVersions(doc.id);
    expect(allVersions.length).toBeGreaterThanOrEqual(3);
  });

  it('create → submit → reject → cannot resubmit from REJECTED', () => {
    const repo = createInMemoryRepository();
    const docService = new DocumentService(repo);
    const approvalService = new ApprovalService(repo);

    const employee = { id: 'emp-1', name: 'Employee', role: 'EMPLOYEE' as const };
    const manager = { id: 'mgr-1', name: 'Manager', role: 'MANAGER' as const };

    const doc = docService.createDocument({
      title: 'Budget Report',
      content: 'Initial budget',
      authorId: 'emp-1',
      authorName: 'Employee',
    });

    approvalService.submitForApproval(doc.id, employee);
    approvalService.rejectDocument(doc.id, manager, 'Missing Q3 data');

    const currentDoc = docService.getDocumentById(doc.id);
    expect(currentDoc.status).toBe('REJECTED');

    expect(() => approvalService.submitForApproval(doc.id, employee, 'Added Q3 data')).toThrow(
      'not allowed',
    );
  });

  it('attachment workflow on DRAFT document', () => {
    const repo = createInMemoryRepository();
    const docService = new DocumentService(repo);
    const fileService = new FileStorageService(repo);

    const doc = docService.createDocument({
      title: 'Report with attachments',
      content: 'Main content',
      authorId: 'emp-1',
      authorName: 'Employee',
    });

    const attachment = fileService.addAttachment(doc.id, {
      fileName: 'data.csv',
      mimeType: 'text/csv',
      size: 1024,
      data: new ArrayBuffer(1024),
    });
    expect(attachment.fileName).toBe('data.csv');

    const attachments = fileService.getAttachments(doc.id);
    expect(attachments.length).toBe(1);

    const fileData = fileService.getAttachmentFile(doc.id, attachment.id);
    expect(fileData.data).toBeInstanceOf(ArrayBuffer);

    fileService.deleteAttachment(doc.id, attachment.id);
    expect(fileService.getAttachments(doc.id).length).toBe(0);
  });

  it('cannot edit or attach files after approval', () => {
    const repo = createInMemoryRepository();
    const docService = new DocumentService(repo);
    const approvalService = new ApprovalService(repo);
    const fileService = new FileStorageService(repo);

    const employee = { id: 'emp-1', name: 'Employee', role: 'EMPLOYEE' as const };
    const manager = { id: 'mgr-1', name: 'Manager', role: 'MANAGER' as const };

    const doc = docService.createDocument({
      title: 'Locked Document',
      content: 'Final',
      authorId: 'emp-1',
      authorName: 'Employee',
    });

    approvalService.submitForApproval(doc.id, employee);
    approvalService.approveDocument(doc.id, manager);

    expect(() => docService.updateDocument(doc.id, { changeNote: 'edit' })).toThrow(
      'Only DRAFT documents can be edited',
    );

    expect(() =>
      fileService.addAttachment(doc.id, {
        fileName: 'new.txt',
        mimeType: 'text/plain',
        size: 10,
        data: new ArrayBuffer(10),
      }),
    ).toThrow('DRAFT documents');
  });

  it('version history integrity check', () => {
    const repo = createInMemoryRepository();
    const docService = new DocumentService(repo);

    const doc = docService.createDocument({
      title: 'Versioned Doc',
      content: 'v1',
      authorId: 'emp-1',
      authorName: 'Employee',
    });

    docService.updateDocument(doc.id, { content: 'v2', changeNote: 'Version 2' });
    docService.updateDocument(doc.id, { content: 'v3', changeNote: 'Version 3' });

    const integrity = docService.checkVersionHistoryIntegrity(doc.id);
    expect(integrity.isValid).toBe(true);
  });
});
