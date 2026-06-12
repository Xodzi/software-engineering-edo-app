import { IDocumentRepository } from '../repositories/IDocumentRepository';
import {
  ApprovalAction,
  ApprovalActor,
  ApprovalComment,
  ApprovalResult,
  DocStatus,
  Document,
  UserRole,
} from '../../shared/types';

const APPROVAL_TRANSITIONS: Record<ApprovalAction, {
  from: readonly DocStatus[];
  to: DocStatus;
}> = {
  SUBMIT: { from: ['DRAFT'], to: 'PENDING' },
  APPROVE: { from: ['PENDING'], to: 'APPROVED' },
  REJECT: { from: ['PENDING'], to: 'REJECTED' },
};

const REVIEW_ROLES: readonly UserRole[] = ['MANAGER', 'ADMINISTRATOR'];

export class ApprovalService {
  constructor(private readonly repository: IDocumentRepository) {}

  submitForApproval(
    documentId: string,
    actor: ApprovalActor,
    commentText?: string,
  ): ApprovalResult {
    return this.performTransition(documentId, actor, 'SUBMIT', commentText);
  }

  approveDocument(
    documentId: string,
    actor: ApprovalActor,
    commentText?: string,
  ): ApprovalResult {
    this.ensureReviewerRole(actor);
    return this.performTransition(documentId, actor, 'APPROVE', commentText);
  }

  rejectDocument(
    documentId: string,
    actor: ApprovalActor,
    commentText?: string,
  ): ApprovalResult {
    this.ensureReviewerRole(actor);
    return this.performTransition(documentId, actor, 'REJECT', commentText);
  }

  private performTransition(
    documentId: string,
    actor: ApprovalActor,
    action: ApprovalAction,
    commentText?: string,
  ): ApprovalResult {
    const document = this.getExistingDocument(documentId);
    const transition = APPROVAL_TRANSITIONS[action];

    this.ensureTransitionAllowed(document.status, action);

    const comment = this.buildComment(actor, commentText);
    const changeNote = this.buildChangeNote(action, actor, comment);
    const updatedDocument = this.repository.updateStatus(
      documentId,
      transition.to,
      changeNote,
    );

    return {
      document: updatedDocument,
      action,
      previousStatus: document.status,
      nextStatus: transition.to,
      comment,
    };
  }

  private getExistingDocument(documentId: string): Document {
    const document = this.repository.findById(documentId);
    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
    }
    return document;
  }

  private ensureTransitionAllowed(
    currentStatus: DocStatus,
    action: ApprovalAction,
  ): void {
    const transition = APPROVAL_TRANSITIONS[action];
    if (!transition.from.includes(currentStatus)) {
      throw new Error(
        `Approval action ${action} is not allowed for document status ${currentStatus}`,
      );
    }
  }

  private ensureReviewerRole(actor: ApprovalActor): void {
    if (!REVIEW_ROLES.includes(actor.role)) {
      throw new Error('Only MANAGER or ADMINISTRATOR can approve or reject documents');
    }
  }

  private buildComment(
    actor: ApprovalActor,
    commentText?: string,
  ): ApprovalComment | undefined {
    const text = commentText?.trim();
    if (!text) return undefined;

    return {
      text,
      authorId: actor.id,
      authorName: actor.name,
      createdAt: new Date().toISOString(),
    };
  }

  private buildChangeNote(
    action: ApprovalAction,
    actor: ApprovalActor,
    comment?: ApprovalComment,
  ): string {
    const transition = APPROVAL_TRANSITIONS[action];
    const actionLabel = this.getActionLabel(action);
    const baseNote = `${actionLabel}: ${transition.to}. Пользователь: ${actor.name}`;

    return comment ? `${baseNote}. Комментарий: ${comment.text}` : baseNote;
  }

  private getActionLabel(action: ApprovalAction): string {
    const labels: Record<ApprovalAction, string> = {
      SUBMIT: 'Документ отправлен на согласование',
      APPROVE: 'Документ утвержден',
      REJECT: 'Документ отклонен',
    };
    return labels[action];
  }
}
