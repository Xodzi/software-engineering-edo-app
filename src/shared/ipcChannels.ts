export const IPC = {
  DOCUMENTS: {
    GET_ALL: 'documents:getAll',
    GET_BY_ID: 'documents:getById',
    CREATE: 'documents:create',
    UPDATE: 'documents:update',
    DELETE: 'documents:delete',
    GET_VERSIONS: 'documents:getVersions',
  },
  APPROVAL: {
    SUBMIT: 'approval:submit',
    APPROVE: 'approval:approve',
    REJECT: 'approval:reject',
  },
} as const;
