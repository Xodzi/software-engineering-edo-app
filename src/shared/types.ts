export type DocStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';
export type UserRole = 'EMPLOYEE' | 'MANAGER' | 'ADMINISTRATOR';
export type ApprovalAction = 'SUBMIT' | 'APPROVE' | 'REJECT';

export interface Document {
  id: string;
  title: string;
  content: string;
  status: DocStatus;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  changeNote: string;
}

export interface DocumentAttachment {
  id: string;
  documentId: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export interface DocumentAttachmentFile extends DocumentAttachment {
  data: ArrayBuffer | Uint8Array;
}

export interface CreateDocumentDto {
  title: string;
  content: string;
  authorId: string;
  authorName: string;
}

export interface UpdateDocumentDto {
  title?: string;
  content?: string;
  changeNote: string;
}

export interface AddDocumentAttachmentDto {
  fileName: string;
  mimeType: string;
  size: number;
  data: ArrayBuffer;
}

export interface ApprovalActor {
  id: string;
  name: string;
  role: UserRole;
}

export interface ApprovalComment {
  text: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface ApprovalResult {
  document: Document;
  action: ApprovalAction;
  previousStatus: DocStatus;
  nextStatus: DocStatus;
  comment?: ApprovalComment;
}

export interface User {
  id: number;
  email: string,
  name: string,
  password: string // hashed
  createdAt: string;
}

export interface LoginDTO {
  email: string,
  password: string;
}

export interface RegisterDTO {
  email: string,
  password: string,
  name: string;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  token: string;
}

export interface CurrentUser {
  id: number;
  email: string;
  name: string;
}
