export const IPC = {
  DOCUMENTS: {
    GET_ALL: 'documents:getAll',
    GET_BY_ID: 'documents:getById',
    CREATE: 'documents:create',
    UPDATE: 'documents:update',
    RESTORE_VERSION: 'documents:restoreVersion',
    DELETE: 'documents:delete',
    GET_VERSIONS: 'documents:getVersions',
    GET_ATTACHMENTS: 'documents:getAttachments',
    ADD_ATTACHMENT: 'documents:addAttachment',
    GET_ATTACHMENT_FILE: 'documents:getAttachmentFile',
    DELETE_ATTACHMENT: 'documents:deleteAttachment',
  },
} as const;

export const AUTH_CHANNELS = {
  LOGIN: 'auth:login',
  REGISTER: 'auth:register',
  LOGOUT: 'auth:logout',
  GET_CURRENT_USER: 'auth:get-current-user',
} as const;
