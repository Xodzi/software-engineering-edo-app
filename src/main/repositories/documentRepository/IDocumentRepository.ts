import {
  AddDocumentAttachmentDto,
  Document,
  DocumentAttachment,
  DocumentAttachmentFile,
  DocumentVersion,
  CreateDocumentDto,
  UpdateDocumentDto,
} from '../../../shared/types';

export interface IDocumentRepository {
  findAll(): Document[];
  findById(id: string): Document | undefined;
  create(dto: CreateDocumentDto): Document;
  update(id: string, dto: UpdateDocumentDto): Document;
  updateStatus(id: string, status: Document['status'], changeNote: string): Document;
  restoreVersion(id: string, versionNumber: number, changeNote: string): Document;
  delete(id: string): void;
  findVersions(documentId: string): DocumentVersion[];
  findAttachments(documentId: string): DocumentAttachment[];
  addAttachment(documentId: string, dto: AddDocumentAttachmentDto): DocumentAttachment;
  getAttachmentFile(documentId: string, attachmentId: string): DocumentAttachmentFile | undefined;
  deleteAttachment(documentId: string, attachmentId: string): void;
  getVersionByNumber(
    documentId: string,
    version: number,
  ): DocumentVersion | undefined;
}
