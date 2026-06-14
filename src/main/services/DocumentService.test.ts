import { describe, expect, it, vi, beforeEach } from 'vitest';
import { DocumentService } from './DocumentService';
import { IDocumentRepository } from '@main/repositories/documentRepository/IDocumentRepository';
import { Document, CreateDocumentDto, UpdateDocumentDto } from '@shared/types';

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

function createMockRepository(): IDocumentRepository {
  return {
    findAll: vi.fn().mockReturnValue([]),
    findById: vi.fn().mockReturnValue(makeDocument()),
    create: vi.fn().mockImplementation((dto) => makeDocument(dto)),
    createFromVersion: vi.fn().mockImplementation((dto) => makeDocument(dto)),
    update: vi.fn().mockImplementation((_id, dto) => makeDocument({ ...makeDocument(), ...dto })),
    updateStatus: vi.fn().mockImplementation((_id, status) => makeDocument({ status })),
    restoreVersion: vi.fn().mockImplementation((_id, _v, _note) => makeDocument()),
    delete: vi.fn(),
    findVersions: vi.fn().mockReturnValue([]),
    checkVersionHistoryIntegrity: vi.fn().mockReturnValue({ isValid: true, violations: [] }),
    findAttachments: vi.fn().mockReturnValue([]),
    addAttachment: vi.fn(),
    getAttachmentFile: vi.fn(),
    deleteAttachment: vi.fn(),
    getVersionByNumber: vi.fn().mockReturnValue({ id: 'v-1', versionNumber: 1 }),
  };
}

describe('DocumentService', () => {
  describe('getDocumentById', () => {
    it('returns a document when found', () => {
      const repo = createMockRepository();
      const service = new DocumentService(repo);

      const doc = service.getDocumentById('doc-1');
      expect(doc.id).toBe('doc-1');
    });

    it('throws when document not found', () => {
      const repo = createMockRepository();
      repo.findById.mockReturnValue(undefined);
      const service = new DocumentService(repo);

      expect(() => service.getDocumentById('missing')).toThrow('Document not found');
    });
  });

  describe('createDocument', () => {
    it('creates a document with valid title', () => {
      const repo = createMockRepository();
      const service = new DocumentService(repo);

      const dto: CreateDocumentDto = {
        title: 'New Document',
        content: 'Hello',
        authorId: 'u-1',
        authorName: 'User',
      };
      service.createDocument(dto);

      expect(repo.create).toHaveBeenCalledWith(dto);
    });

    it('throws on empty title', () => {
      const repo = createMockRepository();
      const service = new DocumentService(repo);

      expect(() =>
        service.createDocument({ title: '  ', content: '', authorId: 'u-1', authorName: 'User' }),
      ).toThrow('Title cannot be empty');
    });

    it('throws on title > 255 chars', () => {
      const repo = createMockRepository();
      const service = new DocumentService(repo);

      expect(() =>
        service.createDocument({
          title: 'x'.repeat(256),
          content: '',
          authorId: 'u-1',
          authorName: 'User',
        }),
      ).toThrow('255 characters or fewer');
    });
  });

  describe('updateDocument', () => {
    it('updates a DRAFT document', () => {
      const repo = createMockRepository();
      const service = new DocumentService(repo);

      const dto: UpdateDocumentDto = { title: 'Updated', content: 'new', changeNote: 'Fixed typo' };
      service.updateDocument('doc-1', dto);

      expect(repo.update).toHaveBeenCalledWith('doc-1', dto);
    });

    it('throws when status is not DRAFT', () => {
      const repo = createMockRepository();
      repo.findById.mockReturnValue(makeDocument({ status: 'APPROVED' }));
      const service = new DocumentService(repo);

      expect(() =>
        service.updateDocument('doc-1', { changeNote: 'edit' }),
      ).toThrow('Only DRAFT documents can be edited');
    });

    it('throws when changeNote is empty', () => {
      const repo = createMockRepository();
      const service = new DocumentService(repo);

      expect(() =>
        service.updateDocument('doc-1', { changeNote: '   ' }),
      ).toThrow('change note is required');
    });

    it('throws on empty title', () => {
      const repo = createMockRepository();
      const service = new DocumentService(repo);

      expect(() =>
        service.updateDocument('doc-1', { title: '', changeNote: 'edit' }),
      ).toThrow('Title cannot be empty');
    });
  });

  describe('deleteDocument', () => {
    it('deletes a DRAFT document', () => {
      const repo = createMockRepository();
      const service = new DocumentService(repo);

      service.deleteDocument('doc-1');
      expect(repo.delete).toHaveBeenCalledWith('doc-1');
    });

    it('throws when status is not DRAFT', () => {
      const repo = createMockRepository();
      repo.findById.mockReturnValue(makeDocument({ status: 'APPROVED' }));
      const service = new DocumentService(repo);

      expect(() => service.deleteDocument('doc-1')).toThrow('Only DRAFT documents can be deleted');
    });
  });

  describe('restoreDocumentVersion', () => {
    it('restores a version for DRAFT document', () => {
      const repo = createMockRepository();
      const service = new DocumentService(repo);

      service.restoreDocumentVersion('doc-1', 1);
      expect(repo.restoreVersion).toHaveBeenCalledWith('doc-1', 1, expect.any(String));
    });

    it('throws when status is not DRAFT', () => {
      const repo = createMockRepository();
      repo.findById.mockReturnValue(makeDocument({ status: 'APPROVED' }));
      const service = new DocumentService(repo);

      expect(() => service.restoreDocumentVersion('doc-1', 1)).toThrow(
        'Only DRAFT documents can be restored',
      );
    });

    it('throws when version not found', () => {
      const repo = createMockRepository();
      repo.getVersionByNumber.mockReturnValue(undefined);
      const service = new DocumentService(repo);

      expect(() => service.restoreDocumentVersion('doc-1', 999)).toThrow('Version not found');
    });
  });

  describe('getDocumentVersions', () => {
    it('returns versions for a document', () => {
      const repo = createMockRepository();
      const service = new DocumentService(repo);

      const versions = service.getDocumentVersions('doc-1');
      expect(repo.findVersions).toHaveBeenCalledWith('doc-1');
      expect(versions).toEqual([]);
    });
  });

  describe('checkVersionHistoryIntegrity', () => {
    it('returns integrity check result', () => {
      const repo = createMockRepository();
      const service = new DocumentService(repo);

      const result = service.checkVersionHistoryIntegrity('doc-1');
      expect(result.isValid).toBe(true);
    });
  });
});
