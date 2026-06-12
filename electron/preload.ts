import { contextBridge, ipcRenderer } from 'electron';
import { AUTH_CHANNELS, IPC } from '../src/shared/ipcChannels';
import {
  AddDocumentAttachmentDto,
  CreateDocumentDto,
  LoginDTO,
  RegisterDTO,
  UpdateDocumentDto,
} from '../src/shared/types';

contextBridge.exposeInMainWorld('electronAPI', {
  documents: {
    getAll: () => ipcRenderer.invoke(IPC.DOCUMENTS.GET_ALL),
    getById: (id: string) => ipcRenderer.invoke(IPC.DOCUMENTS.GET_BY_ID, id),
    create: (dto: CreateDocumentDto) =>
      ipcRenderer.invoke(IPC.DOCUMENTS.CREATE, dto),
    update: (id: string, dto: UpdateDocumentDto) =>
      ipcRenderer.invoke(IPC.DOCUMENTS.UPDATE, id, dto),
    restoreVersion: (id: string, versionNumber: number) =>
      ipcRenderer.invoke(IPC.DOCUMENTS.RESTORE_VERSION, id, versionNumber),
    delete: (id: string) => ipcRenderer.invoke(IPC.DOCUMENTS.DELETE, id),
    getVersions: (id: string) =>
      ipcRenderer.invoke(IPC.DOCUMENTS.GET_VERSIONS, id),
    getAttachments: (id: string) =>
      ipcRenderer.invoke(IPC.DOCUMENTS.GET_ATTACHMENTS, id),
    addAttachment: (id: string, dto: AddDocumentAttachmentDto) =>
      ipcRenderer.invoke(IPC.DOCUMENTS.ADD_ATTACHMENT, id, dto),
    getAttachmentFile: (id: string, attachmentId: string) =>
      ipcRenderer.invoke(IPC.DOCUMENTS.GET_ATTACHMENT_FILE, id, attachmentId),
    deleteAttachment: (id: string, attachmentId: string) =>
      ipcRenderer.invoke(IPC.DOCUMENTS.DELETE_ATTACHMENT, id, attachmentId),
  },
  auth: {
    login: (dto: LoginDTO) => ipcRenderer.invoke(AUTH_CHANNELS.LOGIN, dto),
    register: (dto: RegisterDTO) => ipcRenderer.invoke(AUTH_CHANNELS.REGISTER, dto),
    logout: () => ipcRenderer.invoke(AUTH_CHANNELS.LOGOUT),
    getCurrentUser: () => ipcRenderer.invoke(AUTH_CHANNELS.GET_CURRENT_USER),
  },
});
