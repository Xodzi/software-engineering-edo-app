import {
  AddDocumentAttachmentDto,
  AuthResponse,
  CurrentUser,
  Document,
  DocumentAttachment,
  DocumentAttachmentFile,
  DocumentVersion,
  CreateDocumentDto,
  LoginDTO,
  RegisterDTO,
  UpdateDocumentDto,
} from '../shared/types';

type ApiErrorResponse = {
  error: {
    message: string;
    code: string;
    statusCode: number;
  };
};

declare global {
  interface Window {
    electronAPI: {
      documents: {
        getAll(): Promise<Document[]>;
        getById(id: string): Promise<Document | undefined>;
        create(dto: CreateDocumentDto): Promise<Document>;
        update(id: string, dto: UpdateDocumentDto): Promise<Document>;
        restoreVersion(id: string, versionNumber: number): Promise<Document>;
        delete(id: string): Promise<void>;
        getVersions(id: string): Promise<DocumentVersion[]>;
        getAttachments(id: string): Promise<DocumentAttachment[]>;
        addAttachment(id: string, dto: AddDocumentAttachmentDto): Promise<DocumentAttachment>;
        getAttachmentFile(id: string, attachmentId: string): Promise<DocumentAttachmentFile>;
        deleteAttachment(id: string, attachmentId: string): Promise<void>;
      };
      auth: {
        login: (dto: LoginDTO) => Promise<AuthResponse | ApiErrorResponse>;
        register: (dto: RegisterDTO) => Promise<AuthResponse | ApiErrorResponse>;
        logout: () => Promise<void>;
        getCurrentUser: () => Promise<CurrentUser | null | ApiErrorResponse>;
      };
    };
  }
}
