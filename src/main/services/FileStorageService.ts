import { IDocumentRepository } from '@main/repositories/documentRepository/IDocumentRepository';
import {
  AddDocumentAttachmentDto,
  DocumentAttachment,
  DocumentAttachmentFile,
} from '../../shared/types';

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;

export class FileStorageService {
  constructor(private readonly repository: IDocumentRepository) {}

  getAttachments(documentId: string): DocumentAttachment[] {
    this.ensureDocumentExists(documentId);
    return this.repository.findAttachments(documentId);
  }

  addAttachment(documentId: string, dto: AddDocumentAttachmentDto): DocumentAttachment {
    const document = this.ensureDocumentExists(documentId);
    if (document.status !== 'DRAFT') {
      throw new Error('Files can be changed only for DRAFT documents');
    }

    this.validateAttachment(dto);
    return this.repository.addAttachment(documentId, dto);
  }

  getAttachmentFile(documentId: string, attachmentId: string): DocumentAttachmentFile {
    this.ensureDocumentExists(documentId);

    const attachment = this.repository.getAttachmentFile(documentId, attachmentId);
    if (!attachment) {
      throw new Error(`Attachment not found: ${attachmentId}`);
    }

    return attachment;
  }

  deleteAttachment(documentId: string, attachmentId: string): void {
    const document = this.ensureDocumentExists(documentId);
    if (document.status !== 'DRAFT') {
      throw new Error('Files can be changed only for DRAFT documents');
    }

    this.repository.deleteAttachment(documentId, attachmentId);
  }

  private ensureDocumentExists(documentId: string) {
    const document = this.repository.findById(documentId);
    if (!document) throw new Error(`Document not found: ${documentId}`);
    return document;
  }

  private validateAttachment(dto: AddDocumentAttachmentDto): void {
    if (!dto.fileName.trim()) {
      throw new Error('File name cannot be empty');
    }
    if (dto.size <= 0 || dto.data.byteLength <= 0) {
      throw new Error('File cannot be empty');
    }
    if (dto.size > MAX_ATTACHMENT_SIZE || dto.data.byteLength > MAX_ATTACHMENT_SIZE) {
      throw new Error('File size must be 10 MB or less');
    }
  }
}
