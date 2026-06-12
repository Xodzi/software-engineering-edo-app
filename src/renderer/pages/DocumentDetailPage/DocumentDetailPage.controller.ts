import { makeAutoObservable } from 'mobx';
import {
  Document,
  DocumentAttachment,
  DocumentAttachmentFile,
  DocumentVersion,
  DocumentVersionIntegrity,
  CreateDocumentDto,
  UpdateDocumentDto,
} from '@shared/types';
import { documentRepository } from '../../repositories/DocumentRepository';
import { routerController } from '../../controllers/RouterController';

export class DocumentDetailPageController {
  loading = false;
  error: string | null = null;

  document: Document | null = null;
  versions: readonly DocumentVersion[] = [];
  versionIntegrityWarning: string | null = null;
  attachments: readonly DocumentAttachment[] = [];
  selectedVersion: DocumentVersion | null = null;
  isEditDialogOpen = false;
  isCreateFromVersionDialogOpen = false;
  createFromVersionInitialTitle = '';
  createFromVersionInitialContent = '';
  createFromVersionSourceVersion: DocumentVersion | null = null;
  uploadingAttachment = false;
  attachmentError: string | null = null;

  private documentId: string;

  constructor(documentId: string) {
    this.documentId = documentId;
    makeAutoObservable(this);
  }

  get isDraft(): boolean {
    return this.document?.status === 'DRAFT';
  }

  async loadDocumentData(): Promise<void> {
    this.setLoading(true);
    this.setError(null);

    try {
      const loadedDocument = await documentRepository.getById(this.documentId);
      if (!loadedDocument) {
        throw new Error('Документ не найден');
      }
      const loadedVersions = await documentRepository.getVersions(this.documentId);
      const loadedAttachments = await documentRepository.getAttachments(this.documentId);
      const versionIntegrity = await documentRepository.checkVersionIntegrity(this.documentId);
      this.document = loadedDocument;
      this.versions = loadedVersions;
      this.versionIntegrityWarning = this.formatVersionIntegrityWarning(versionIntegrity);
      this.attachments = loadedAttachments;

      if (this.selectedVersion) {
        const stillExists = loadedVersions.find((v) => v.id === this.selectedVersion!.id);
        this.selectedVersion = stillExists ?? loadedVersions[0] ?? null;
      } else {
        this.selectedVersion = loadedVersions[0] ?? null;
      }
    } catch (err) {
      this.setError(this.extractErrorMessage(err));
    } finally {
      this.setLoading(false);
    }
  }

  async uploadAttachment(file: File | null): Promise<void> {
    if (!file) return;

    this.setUploadingAttachment(true);
    this.setAttachmentError(null);

    try {
      const data = await file.arrayBuffer();
      await documentRepository.addAttachment(this.documentId, {
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        data,
      });
      this.attachments = await documentRepository.getAttachments(this.documentId);
    } catch (err) {
      this.setAttachmentError(this.extractErrorMessage(err));
    } finally {
      this.setUploadingAttachment(false);
    }
  }

  async downloadAttachment(attachmentId: string): Promise<void> {
    this.setAttachmentError(null);

    try {
      const attachment = await documentRepository.getAttachmentFile(this.documentId, attachmentId);
      this.downloadFile(attachment);
    } catch (err) {
      this.setAttachmentError(this.extractErrorMessage(err));
    }
  }

  async deleteAttachment(attachmentId: string): Promise<void> {
    if (!window.confirm('Удалить файл из документа?')) return;

    this.setAttachmentError(null);

    try {
      await documentRepository.deleteAttachment(this.documentId, attachmentId);
      this.attachments = await documentRepository.getAttachments(this.documentId);
    } catch (err) {
      this.setAttachmentError(this.extractErrorMessage(err));
    }
  }

  async deleteDocument(): Promise<void> {
    if (!this.document) return;
    if (!window.confirm(`Удалить документ "${this.document.title}"?`)) return;

    try {
      await documentRepository.delete(this.documentId);
      routerController.navigateToList();
    } catch (err) {
      this.setError(this.extractErrorMessage(err));
    }
  }

  async saveDocument(dto: CreateDocumentDto | UpdateDocumentDto): Promise<void> {
    if (!('changeNote' in dto)) return;
    await documentRepository.update(this.documentId, dto);
    this.closeEditDialog();
    await this.loadDocumentData();
  }

  openCreateFromVersionDialog(version: DocumentVersion): void {
    if (!this.document) return;

    this.createFromVersionInitialTitle = `${this.document.title} (копия v${version.versionNumber})`;
    this.createFromVersionInitialContent = version.content;
    this.createFromVersionSourceVersion = version;
    this.isCreateFromVersionDialogOpen = true;
  }

  async createDocumentFromVersion(dto: CreateDocumentDto): Promise<void> {
    if (!this.createFromVersionSourceVersion) return;

    const createdDocument = await documentRepository.createFromVersion({
      ...dto,
      sourceDocumentId: this.documentId,
      sourceVersionId: this.createFromVersionSourceVersion.id,
    });
    this.closeCreateFromVersionDialog();
    routerController.navigateToDetail(createdDocument.id);
  }

  closeCreateFromVersionDialog(): void {
    this.isCreateFromVersionDialogOpen = false;
    this.createFromVersionSourceVersion = null;
  }

  async restoreDocumentVersion(versionNumber: number): Promise<void> {
    if (!this.document) return;
    if (!window.confirm(`Восстановить версию v${versionNumber} для документа "${this.document.title}"?`)) {
      return;
    }

    try {
      await documentRepository.restoreVersion(this.documentId, versionNumber);
      await this.loadDocumentData();
    } catch (err) {
      this.setError(this.extractErrorMessage(err));
    }
  }

  openEditDialog(): void {
    this.isEditDialogOpen = true;
  }

  closeEditDialog(): void {
    this.isEditDialogOpen = false;
  }

  selectVersion(version: DocumentVersion): void {
    this.selectedVersion = version;
  }

  navigateToList(): void {
    routerController.navigateToList();
  }

  private setLoading(value: boolean): void {
    this.loading = value;
  }

  private setError(error: string | null): void {
    this.error = error;
  }

  private setAttachmentError(error: string | null): void {
    this.attachmentError = error;
  }

  private setUploadingAttachment(value: boolean): void {
    this.uploadingAttachment = value;
  }

  private downloadFile(attachment: DocumentAttachmentFile): void {
    const blob = new Blob([this.toBlobPart(attachment.data)], {
      type: attachment.mimeType || 'application/octet-stream',
    });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');

    link.href = url;
    link.download = attachment.fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  private toBlobPart(data: ArrayBuffer | Uint8Array): BlobPart {
    if (data instanceof ArrayBuffer) return data;
    const copy = data.slice();
    return copy.buffer as ArrayBuffer;
  }

  private extractErrorMessage(err: unknown): string {
    return err instanceof Error ? err.message : 'Неизвестная ошибка';
  }

  private formatVersionIntegrityWarning(
    integrity: DocumentVersionIntegrity,
  ): string | null {
    if (integrity.isValid) return null;

    const [first] = integrity.violations;
    if (!first) return 'Предупреждение: история версий могла быть изменена.';
    if (integrity.violations.length === 1) return `Предупреждение: ${first.message}`;

    return `Предупреждение: история версий могла быть изменена (${integrity.violations.length}). ${first.message}`;
  }
}
