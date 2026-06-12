import { makeAutoObservable } from 'mobx';
import {
  Document,
  DocumentVersion,
  CreateDocumentDto,
  UpdateDocumentDto,
  UserRole,
} from '@shared/types';
import { documentRepository } from '../../repositories/DocumentRepository';
import { routerController } from '../../controllers/RouterController';

export class DocumentDetailPageController {
  loading = false;
  error: string | null = null;

  document: Document | null = null;
  versions: readonly DocumentVersion[] = [];
  selectedVersion: DocumentVersion | null = null;
  isEditDialogOpen = false;
  approvalRole: UserRole = 'MANAGER';
  approvalInProgress = false;
  approvalError: string | null = null;
  isRejectDialogOpen = false;
  rejectComment = '';

  private documentId: string;

  constructor(documentId: string) {
    this.documentId = documentId;
    makeAutoObservable(this);
  }

  get isDraft(): boolean {
    return this.document?.status === 'DRAFT';
  }

  get isPending(): boolean {
    return this.document?.status === 'PENDING';
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
      this.document = loadedDocument;
      this.versions = loadedVersions;

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

  async submitForApproval(): Promise<void> {
    await this.runApprovalAction((comment) =>
      documentRepository.submitForApproval(
        this.documentId,
        this.buildApprovalActor(),
        comment,
      ),
    );
  }

  async approveDocument(): Promise<void> {
    await this.runApprovalAction((comment) =>
      documentRepository.approveDocument(
        this.documentId,
        this.buildApprovalActor(),
        comment,
      ),
    );
  }

  rejectDocument(): void {
    if (!this.isPending) {
      this.setApprovalError('Отклонение доступно только для документа на согласовании.');
      return;
    }

    this.setApprovalError(null);
    this.rejectComment = '';
    this.isRejectDialogOpen = true;
  }

  async confirmRejectDocument(): Promise<void> {
    await this.runApprovalAction(() =>
      documentRepository.rejectDocument(
        this.documentId,
        this.buildApprovalActor(),
        this.rejectComment.trim() || undefined,
      ),
    );
  }

  setApprovalRole(role: UserRole): void {
    this.approvalRole = role;
    this.setApprovalError(null);
  }

  setRejectComment(comment: string): void {
    this.rejectComment = comment;
  }

  cancelRejectDocument(): void {
    this.isRejectDialogOpen = false;
    this.rejectComment = '';
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

  private setApprovalError(error: string | null): void {
    this.approvalError = error;
  }

  private setApprovalInProgress(value: boolean): void {
    this.approvalInProgress = value;
  }

  private async runApprovalAction(
    action: (comment?: string) => Promise<unknown>,
  ): Promise<void> {
    this.setApprovalInProgress(true);
    this.setApprovalError(null);

    try {
      await action();
      this.cancelRejectDocument();
      await this.loadDocumentData();
    } catch (err) {
      this.setApprovalError(this.extractErrorMessage(err));
    } finally {
      this.setApprovalInProgress(false);
    }
  }

  private buildApprovalActor() {
    return {
      id: 'current-user',
      name: 'Текущий пользователь',
      role: this.approvalRole,
    };
  }

  private extractErrorMessage(err: unknown): string {
    if (!(err instanceof Error)) return 'Неизвестная ошибка';

    const message = err.message.replace(/^Error invoking remote method '[^']+':\s*/, '');
    if (
      message.includes(
        'UNIQUE constraint failed: document_versions.document_id, document_versions.version_number',
      )
    ) {
      return 'Не удалось записать историю изменения статуса: номер версии уже существует.';
    }

    return message;
  }
}
