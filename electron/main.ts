import { app, BrowserWindow, ipcMain } from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { IPC } from '../src/shared/ipcChannels';
import { DocumentService } from '../src/main/services/DocumentService';
import { AddDocumentAttachmentDto, CreateDocumentDto, UpdateDocumentDto } from '../src/shared/types';
import { initDatabase, closeDatabase } from '../src/main/db';
import { DocumentRepository } from '@main/repositories/documentRepository/DocumentRepository';
import { registerAuthHandlers } from '../src/main/ipc/handlers/authHandlers';
import { FileStorageService } from '../src/main/services/FileStorageService';

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
    autoHideMenuBar: true,
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }
}

async function registerIpcHandlers(): Promise<void> {
  const db = await initDatabase();
  const repository = new DocumentRepository(db);
  const service = new DocumentService(repository);
  const fileStorageService = new FileStorageService(repository);

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
  ipcMain.handle(IPC.DOCUMENTS.RESTORE_VERSION, (_, id: string, versionNumber: number) =>
    service.restoreDocumentVersion(id, versionNumber),
  );
  ipcMain.handle(IPC.DOCUMENTS.DELETE, (_, id: string) =>
    service.deleteDocument(id),
  );
  ipcMain.handle(IPC.DOCUMENTS.GET_VERSIONS, (_, id: string) =>
    service.getDocumentVersions(id),
  );
  ipcMain.handle(IPC.DOCUMENTS.GET_ATTACHMENTS, (_, id: string) =>
    fileStorageService.getAttachments(id),
  );
  ipcMain.handle(
    IPC.DOCUMENTS.ADD_ATTACHMENT,
    (_, id: string, dto: AddDocumentAttachmentDto) =>
      fileStorageService.addAttachment(id, dto),
  );
  ipcMain.handle(
    IPC.DOCUMENTS.GET_ATTACHMENT_FILE,
    (_, id: string, attachmentId: string) =>
      fileStorageService.getAttachmentFile(id, attachmentId),
  );
  ipcMain.handle(
    IPC.DOCUMENTS.DELETE_ATTACHMENT,
    (_, id: string, attachmentId: string) =>
      fileStorageService.deleteAttachment(id, attachmentId),
  );
  registerAuthHandlers(db);
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
    try {
        await registerIpcHandlers();
        createWindow();
    } catch (e) {
        console.error(e);
    }
});

app.on('will-quit', () => closeDatabase());
