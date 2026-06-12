import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApprovalActor, ApprovalResult } from '@shared/types';
import { DocumentRepository } from './DocumentRepository';

const manager: ApprovalActor = {
  id: 'manager-1',
  name: 'Manager',
  role: 'MANAGER',
};

const rejectedResult: ApprovalResult = {
  action: 'REJECT',
  previousStatus: 'PENDING',
  nextStatus: 'REJECTED',
  document: {
    id: 'document-1',
    title: 'Approval document',
    content: 'Document content',
    status: 'REJECTED',
    authorId: 'author-1',
    authorName: 'Author',
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
  },
};

describe('renderer DocumentRepository approval actions', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls approval.reject for reject action', async () => {
    const reject = vi.fn<Window['electronAPI']['approval']['reject']>()
      .mockResolvedValue(rejectedResult);
    vi.stubGlobal('window', {
      electronAPI: {
        approval: {
          reject,
        },
      },
    });
    const repository = new DocumentRepository();

    const result = await repository.rejectDocument(
      'document-1',
      manager,
      'Needs revision',
    );

    expect(reject).toHaveBeenCalledWith('document-1', manager, 'Needs revision');
    expect(result.nextStatus).toBe('REJECTED');
  });
});
