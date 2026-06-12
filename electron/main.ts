import { app, BrowserWindow, ipcMain } from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { IPC } from '../src/shared/ipcChannels';
import { initDatabase, closeDatabase } from '../src/main/db/database';
import { DocumentRepository } from '../src/main/repositories/DocumentRepository';
import { DocumentService } from '../src/main/services/DocumentService';
import { ApprovalActor, CreateDocumentDto, UpdateDocumentDto } from '../src/shared/types';
import { ApprovalService } from '../src/main/services/ApprovalService';

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

process.env.APP_ROOT = path.join(__dirname, '..');

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST;

let win: BrowserWindow | null;

function createWindow(): void {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.mjs'),
    },
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }
}

async function registerIpcHandlers(): Promise<void> {
  const db = await initDatabase();
  const repository = new DocumentRepository(db);
  const service = new DocumentService(repository);
  const approvalService = new ApprovalService(repository);

  ipcMain.handle(IPC.DOCUMENTS.GET_ALL, () => service.getAllDocuments());
  ipcMain.handle(IPC.DOCUMENTS.GET_BY_ID, (_, id: string) =>
    service.getDocumentById(id),
  );
  ipcMain.handle(IPC.DOCUMENTS.CREATE, (_, dto: CreateDocumentDto) =>
    service.createDocument(dto),
  );
  ipcMain.handle(
    IPC.DOCUMENTS.UPDATE,
    (_, id: string, dto: UpdateDocumentDto) => service.updateDocument(id, dto),
  );
  ipcMain.handle(IPC.DOCUMENTS.DELETE, (_, id: string) =>
    service.deleteDocument(id),
  );
  ipcMain.handle(IPC.DOCUMENTS.GET_VERSIONS, (_, id: string) =>
    service.getDocumentVersions(id),
  );
  ipcMain.handle(
    IPC.APPROVAL.SUBMIT,
    (_, id: string, actor: ApprovalActor, comment?: string) =>
      approvalService.submitForApproval(id, actor, comment),
  );
  ipcMain.handle(
    IPC.APPROVAL.APPROVE,
    (_, id: string, actor: ApprovalActor, comment?: string) =>
      approvalService.approveDocument(id, actor, comment),
  );
  ipcMain.handle(
    IPC.APPROVAL.REJECT,
    (_, id: string, actor: ApprovalActor, comment?: string) =>
      approvalService.rejectDocument(id, actor, comment),
  );
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    win = null;
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(async () => {
  await registerIpcHandlers();
  createWindow();
});

app.on('will-quit', () => closeDatabase());
