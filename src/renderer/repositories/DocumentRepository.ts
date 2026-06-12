import { BaseRepository } from '../bases/BaseRepository';
import {
  AddDocumentAttachmentDto,
  Document,
  DocumentAttachment,
  DocumentAttachmentFile,
  DocumentVersion,
  CreateDocumentDto,
  UpdateDocumentDto,
} from '@shared/types';

export class DocumentRepository extends BaseRepository<Document> {
  async getAll(): Promise<readonly Document[]> {
    return window.electronAPI.documents.getAll();
  }

  async getById(id: string): Promise<Document | undefined> {
    return window.electronAPI.documents.getById(id);
  }

  async create(dto: CreateDocumentDto): Promise<Document> {
    return window.electronAPI.documents.create(dto);
  }

  async update(id: string, dto: UpdateDocumentDto): Promise<Document> {
    return window.electronAPI.documents.update(id, dto);
  }

  async restoreVersion(id: string, versionNumber: number): Promise<Document> {
    return window.electronAPI.documents.restoreVersion(id, versionNumber);
  }

  async delete(id: string): Promise<void> {
    return window.electronAPI.documents.delete(id);
  }

  async getVersions(documentId: string): Promise<readonly DocumentVersion[]> {
    return window.electronAPI.documents.getVersions(documentId);
  }

  async getAttachments(documentId: string): Promise<readonly DocumentAttachment[]> {
    return window.electronAPI.documents.getAttachments(documentId);
  }

  async addAttachment(
    documentId: string,
    dto: AddDocumentAttachmentDto,
  ): Promise<DocumentAttachment> {
    return window.electronAPI.documents.addAttachment(documentId, dto);
  }

  async getAttachmentFile(
    documentId: string,
    attachmentId: string,
  ): Promise<DocumentAttachmentFile> {
    return window.electronAPI.documents.getAttachmentFile(documentId, attachmentId);
  }

  async deleteAttachment(documentId: string, attachmentId: string): Promise<void> {
    return window.electronAPI.documents.deleteAttachment(documentId, attachmentId);
  }
}

export const documentRepository = new DocumentRepository();
