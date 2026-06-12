import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '../src/shared/ipcChannels';
import {
  ApprovalActor,
  ApprovalResult,
  CreateDocumentDto,
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
    delete: (id: string) => ipcRenderer.invoke(IPC.DOCUMENTS.DELETE, id),
    getVersions: (id: string) =>
      ipcRenderer.invoke(IPC.DOCUMENTS.GET_VERSIONS, id),
  },
  approval: {
    submit: (id: string, actor: ApprovalActor, comment?: string): Promise<ApprovalResult> =>
      ipcRenderer.invoke(IPC.APPROVAL.SUBMIT, id, actor, comment),
    approve: (id: string, actor: ApprovalActor, comment?: string): Promise<ApprovalResult> =>
      ipcRenderer.invoke(IPC.APPROVAL.APPROVE, id, actor, comment),
    reject: (id: string, actor: ApprovalActor, comment?: string): Promise<ApprovalResult> =>
      ipcRenderer.invoke(IPC.APPROVAL.REJECT, id, actor, comment),
  },
});
