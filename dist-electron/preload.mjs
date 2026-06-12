"use strict";
const electron = require("electron");
const IPC = {
  DOCUMENTS: {
    GET_ALL: "documents:getAll",
    GET_BY_ID: "documents:getById",
    CREATE: "documents:create",
    UPDATE: "documents:update",
    RESTORE_VERSION: "documents:restoreVersion",
    DELETE: "documents:delete",
    GET_VERSIONS: "documents:getVersions",
    GET_ATTACHMENTS: "documents:getAttachments",
    ADD_ATTACHMENT: "documents:addAttachment",
    GET_ATTACHMENT_FILE: "documents:getAttachmentFile",
    DELETE_ATTACHMENT: "documents:deleteAttachment"
  }
};
const AUTH_CHANNELS = {
  LOGIN: "auth:login",
  REGISTER: "auth:register",
  LOGOUT: "auth:logout",
  GET_CURRENT_USER: "auth:get-current-user"
};
electron.contextBridge.exposeInMainWorld("electronAPI", {
  documents: {
    getAll: () => electron.ipcRenderer.invoke(IPC.DOCUMENTS.GET_ALL),
    getById: (id) => electron.ipcRenderer.invoke(IPC.DOCUMENTS.GET_BY_ID, id),
    create: (dto) => electron.ipcRenderer.invoke(IPC.DOCUMENTS.CREATE, dto),
    update: (id, dto) => electron.ipcRenderer.invoke(IPC.DOCUMENTS.UPDATE, id, dto),
    restoreVersion: (id, versionNumber) => electron.ipcRenderer.invoke(IPC.DOCUMENTS.RESTORE_VERSION, id, versionNumber),
    delete: (id) => electron.ipcRenderer.invoke(IPC.DOCUMENTS.DELETE, id),
    getVersions: (id) => electron.ipcRenderer.invoke(IPC.DOCUMENTS.GET_VERSIONS, id),
    getAttachments: (id) => electron.ipcRenderer.invoke(IPC.DOCUMENTS.GET_ATTACHMENTS, id),
    addAttachment: (id, dto) => electron.ipcRenderer.invoke(IPC.DOCUMENTS.ADD_ATTACHMENT, id, dto),
    getAttachmentFile: (id, attachmentId) => electron.ipcRenderer.invoke(IPC.DOCUMENTS.GET_ATTACHMENT_FILE, id, attachmentId),
    deleteAttachment: (id, attachmentId) => electron.ipcRenderer.invoke(IPC.DOCUMENTS.DELETE_ATTACHMENT, id, attachmentId)
  },
  auth: {
    login: (dto) => electron.ipcRenderer.invoke(AUTH_CHANNELS.LOGIN, dto),
    register: (dto) => electron.ipcRenderer.invoke(AUTH_CHANNELS.REGISTER, dto),
    logout: () => electron.ipcRenderer.invoke(AUTH_CHANNELS.LOGOUT),
    getCurrentUser: () => electron.ipcRenderer.invoke(AUTH_CHANNELS.GET_CURRENT_USER)
  }
});
