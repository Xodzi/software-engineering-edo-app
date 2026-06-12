import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Document } from '@shared/types';

function createDocument(status: Document['status']): Document {
  return {
    id: 'document-1',
    title: 'Approval document',
    content: 'Document content',
    status,
    authorId: 'author-1',
    authorName: 'Author',
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
  };
}

describe('DocumentDetailPageController reject action', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      location: {
        hash: '',
      },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('opens reject dialog for pending document', async () => {
    const { DocumentDetailPageController } = await import('./DocumentDetailPage.controller');
    const controller = new DocumentDetailPageController('document-1');
    controller.document = createDocument('PENDING');

    controller.rejectDocument();

    expect(controller.isRejectDialogOpen).toBe(true);
    expect(controller.approvalError).toBeNull();
  });

  it('shows approval error instead of silently returning for non-pending document', async () => {
    const { DocumentDetailPageController } = await import('./DocumentDetailPage.controller');
    const controller = new DocumentDetailPageController('document-1');
    controller.document = createDocument('DRAFT');

    controller.rejectDocument();

    expect(controller.isRejectDialogOpen).toBe(false);
    expect(controller.approvalError).toContain('Отклонение доступно');
  });
});
