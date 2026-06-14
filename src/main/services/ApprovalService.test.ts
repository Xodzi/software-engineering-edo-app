import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ApprovalService } from './ApprovalService';
import { IDocumentRepository } from '@main/repositories/documentRepository/IDocumentRepository';
import { Document, ApprovalActor, DocStatus } from '@shared/types';

function makeDocument(overrides: Partial<Document> = {}): Document {
  return {
    id: 'doc-1',
    title: 'Test Document',
    content: 'Content',
    status: 'DRAFT',
    authorId: 'author-1',
    authorName: 'Author',
    sourceVersionId: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function createMockRepository(doc: Document | undefined = undefined): IDocumentRepository {
  return {
    findAll: vi.fn(),
    findById: vi.fn().mockReturnValue(doc),
    create: vi.fn(),
    createFromVersion: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn().mockImplementation((_id: string, status: DocStatus, _note: string) => {
      return makeDocument({ status });
    }),
    restoreVersion: vi.fn(),
    delete: vi.fn(),
    findVersions: vi.fn(),
    checkVersionHistoryIntegrity: vi.fn(),
    findAttachments: vi.fn(),
    addAttachment: vi.fn(),
    getAttachmentFile: vi.fn(),
    deleteAttachment: vi.fn(),
    getVersionByNumber: vi.fn(),
  };
}

const employee: ApprovalActor = { id: 'emp-1', name: 'Employee', role: 'EMPLOYEE' };
const manager: ApprovalActor = { id: 'mgr-1', name: 'Manager', role: 'MANAGER' };
const admin: ApprovalActor = { id: 'adm-1', name: 'Admin', role: 'ADMINISTRATOR' };

describe('ApprovalService', () => {
  describe('submitForApproval', () => {
    it('transitions DRAFT to PENDING', () => {
      const repo = createMockRepository(makeDocument({ status: 'DRAFT' }));
      const service = new ApprovalService(repo);

      const result = service.submitForApproval('doc-1', employee);

      expect(result.previousStatus).toBe('DRAFT');
      expect(result.nextStatus).toBe('PENDING');
      expect(result.action).toBe('SUBMIT');
      expect(repo.updateStatus).toHaveBeenCalledWith('doc-1', 'PENDING', expect.any(String));
    });

    it('throws when document not found', () => {
      const repo = createMockRepository(undefined);
      const service = new ApprovalService(repo);

      expect(() => service.submitForApproval('missing', employee)).toThrow('Document not found');
    });

    it('throws when status is not DRAFT', () => {
      const repo = createMockRepository(makeDocument({ status: 'PENDING' }));
      const service = new ApprovalService(repo);

      expect(() => service.submitForApproval('doc-1', employee)).toThrow('not allowed');
    });

    it('includes comment when provided', () => {
      const repo = createMockRepository(makeDocument({ status: 'DRAFT' }));
      const service = new ApprovalService(repo);

      const result = service.submitForApproval('doc-1', employee, 'Ready for review');

      expect(result.comment).toBeDefined();
      expect(result.comment!.text).toBe('Ready for review');
      expect(result.comment!.authorId).toBe('emp-1');
    });

    it('returns undefined comment when empty string', () => {
      const repo = createMockRepository(makeDocument({ status: 'DRAFT' }));
      const service = new ApprovalService(repo);

      const result = service.submitForApproval('doc-1', employee, '   ');

      expect(result.comment).toBeUndefined();
    });
  });

  describe('approveDocument', () => {
    it('transitions PENDING to APPROVED with MANAGER role', () => {
      const repo = createMockRepository(makeDocument({ status: 'PENDING' }));
      const service = new ApprovalService(repo);

      const result = service.approveDocument('doc-1', manager);

      expect(result.previousStatus).toBe('PENDING');
      expect(result.nextStatus).toBe('APPROVED');
      expect(result.action).toBe('APPROVE');
    });

    it('transitions PENDING to APPROVED with ADMINISTRATOR role', () => {
      const repo = createMockRepository(makeDocument({ status: 'PENDING' }));
      const service = new ApprovalService(repo);

      const result = service.approveDocument('doc-1', admin);

      expect(result.nextStatus).toBe('APPROVED');
    });

    it('rejects EMPLOYEE role', () => {
      const repo = createMockRepository(makeDocument({ status: 'PENDING' }));
      const service = new ApprovalService(repo);

      expect(() => service.approveDocument('doc-1', employee)).toThrow(
        'Only MANAGER or ADMINISTRATOR',
      );
    });

    it('throws when status is not PENDING', () => {
      const repo = createMockRepository(makeDocument({ status: 'DRAFT' }));
      const service = new ApprovalService(repo);

      expect(() => service.approveDocument('doc-1', manager)).toThrow('not allowed');
    });
  });

  describe('rejectDocument', () => {
    it('transitions PENDING to REJECTED', () => {
      const repo = createMockRepository(makeDocument({ status: 'PENDING' }));
      const service = new ApprovalService(repo);

      const result = service.rejectDocument('doc-1', manager, 'Needs revision');

      expect(result.previousStatus).toBe('PENDING');
      expect(result.nextStatus).toBe('REJECTED');
      expect(result.action).toBe('REJECT');
      expect(result.comment!.text).toBe('Needs revision');
    });

    it('rejects EMPLOYEE role', () => {
      const repo = createMockRepository(makeDocument({ status: 'PENDING' }));
      const service = new ApprovalService(repo);

      expect(() => service.rejectDocument('doc-1', employee)).toThrow(
        'Only MANAGER or ADMINISTRATOR',
      );
    });
  });
});
