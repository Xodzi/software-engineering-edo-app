import { describe, expect, it, vi } from 'vitest';
import { FileStorageService } from './FileStorageService';
import { IDocumentRepository } from '@main/repositories/documentRepository/IDocumentRepository';
import { Document, AddDocumentAttachmentDto } from '@shared/types';

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
    findAll: vi.fn(),
    findById: vi.fn().mockReturnValue(makeDocument()),
    create: vi.fn(),
    createFromVersion: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
    restoreVersion: vi.fn(),
    delete: vi.fn(),
    findVersions: vi.fn(),
    checkVersionHistoryIntegrity: vi.fn(),
    findAttachments: vi.fn().mockReturnValue([]),
    addAttachment: vi.fn().mockImplementation((_id, dto) => ({
      id: 'att-1',
      documentId: 'doc-1',
      ...dto,
      createdAt: '2026-01-01T00:00:00.000Z',
    })),
    getAttachmentFile: vi.fn().mockReturnValue({
      id: 'att-1',
      documentId: 'doc-1',
      fileName: 'file.txt',
      mimeType: 'text/plain',
      size: 100,
      data: new ArrayBuffer(100),
      createdAt: '2026-01-01T00:00:00.000Z',
    }),
    deleteAttachment: vi.fn(),
    getVersionByNumber: vi.fn(),
  };
}

describe('FileStorageService', () => {
  describe('getAttachments', () => {
    it('returns attachments for a document', () => {
      const repo = createMockRepository();
      const service = new FileStorageService(repo);

      const attachments = service.getAttachments('doc-1');
      expect(repo.findAttachments).toHaveBeenCalledWith('doc-1');
      expect(attachments).toEqual([]);
    });

    it('throws when document not found', () => {
      const repo = createMockRepository();
      repo.findById.mockReturnValue(undefined);
      const service = new FileStorageService(repo);

      expect(() => service.getAttachments('missing')).toThrow('Document not found');
    });
  });

  describe('addAttachment', () => {
    it('adds an attachment to a DRAFT document', () => {
      const repo = createMockRepository();
      const service = new FileStorageService(repo);

      const dto: AddDocumentAttachmentDto = {
        fileName: 'report.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        data: new ArrayBuffer(1024),
      };

      const result = service.addAttachment('doc-1', dto);
      expect(repo.addAttachment).toHaveBeenCalledWith('doc-1', dto);
      expect(result.fileName).toBe('report.pdf');
    });

    it('throws when document is not DRAFT', () => {
      const repo = createMockRepository();
      repo.findById.mockReturnValue(makeDocument({ status: 'APPROVED' }));
      const service = new FileStorageService(repo);

      const dto: AddDocumentAttachmentDto = {
        fileName: 'file.txt',
        mimeType: 'text/plain',
        size: 10,
        data: new ArrayBuffer(10),
      };

      expect(() => service.addAttachment('doc-1', dto)).toThrow('DRAFT documents');
    });

    it('throws on empty file name', () => {
      const repo = createMockRepository();
      const service = new FileStorageService(repo);

      const dto: AddDocumentAttachmentDto = {
        fileName: '  ',
        mimeType: 'text/plain',
        size: 10,
        data: new ArrayBuffer(10),
      };

      expect(() => service.addAttachment('doc-1', dto)).toThrow('File name cannot be empty');
    });

    it('throws on empty file data', () => {
      const repo = createMockRepository();
      const service = new FileStorageService(repo);

      const dto: AddDocumentAttachmentDto = {
        fileName: 'file.txt',
        mimeType: 'text/plain',
        size: 0,
        data: new ArrayBuffer(0),
      };

      expect(() => service.addAttachment('doc-1', dto)).toThrow('File cannot be empty');
    });

    it('throws when file exceeds 10 MB', () => {
      const repo = createMockRepository();
      const service = new FileStorageService(repo);

      const dto: AddDocumentAttachmentDto = {
        fileName: 'huge.bin',
        mimeType: 'application/octet-stream',
        size: 11 * 1024 * 1024,
        data: new ArrayBuffer(11 * 1024 * 1024),
      };

      expect(() => service.addAttachment('doc-1', dto)).toThrow('10 MB or less');
    });
  });

  describe('getAttachmentFile', () => {
    it('returns attachment file data', () => {
      const repo = createMockRepository();
      const service = new FileStorageService(repo);

      const file = service.getAttachmentFile('doc-1', 'att-1');
      expect(file.fileName).toBe('file.txt');
      expect(file.data).toBeInstanceOf(ArrayBuffer);
    });

    it('throws when attachment not found', () => {
      const repo = createMockRepository();
      repo.getAttachmentFile.mockReturnValue(undefined);
      const service = new FileStorageService(repo);

      expect(() => service.getAttachmentFile('doc-1', 'missing')).toThrow('Attachment not found');
    });
  });

  describe('deleteAttachment', () => {
    it('deletes an attachment from a DRAFT document', () => {
      const repo = createMockRepository();
      const service = new FileStorageService(repo);

      service.deleteAttachment('doc-1', 'att-1');
      expect(repo.deleteAttachment).toHaveBeenCalledWith('doc-1', 'att-1');
    });

    it('throws when document is not DRAFT', () => {
      const repo = createMockRepository();
      repo.findById.mockReturnValue(makeDocument({ status: 'APPROVED' }));
      const service = new FileStorageService(repo);

      expect(() => service.deleteAttachment('doc-1', 'att-1')).toThrow('DRAFT documents');
    });
  });
});
