import { observer } from 'mobx-react-lite';
import { formatDateTime } from '@shared/utils';
import { DocumentDetailPageController } from './DocumentDetailPage.controller';
import { StatusBadge } from '../../components/StatusBadge/StatusBadge';
import { VersionHistory } from '../../components/VersionHistory';
import { DocumentEditor } from '../../components/DocumentEditor';
import { DocumentVersionComparison } from '../../components/DocumentVersionComparison';
import { DocumentAttachments } from '../../components/DocumentAttachments';

interface DocumentDetailPageViewProps {
  controller: DocumentDetailPageController;
}

export const DocumentDetailPageView = observer(function DocumentDetailPageView({
  controller,
}: DocumentDetailPageViewProps) {
  if (controller.loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center rounded-3xl border border-slate-200 bg-white/85 px-6 py-12 text-center text-slate-600 shadow-lg backdrop-blur-sm">
        Загрузка документа...
      </div>
    );
  }

  if (controller.error || !controller.document) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center rounded-3xl border border-rose-200 bg-rose-50 px-6 py-12 text-center text-rose-700 shadow-lg">
        Ошибка: {controller.error ?? 'Документ не найден'}
      </div>
    );
  }

  const document = controller.document;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8 lg:py-8">
      <section className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-xl backdrop-blur-sm sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">
              Карточка документа
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              {document.title}
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              Полный просмотр документа с метаданными, историей версий, действиями для черновика и
              сравнением выбранной версии с текущим содержимым.
            </p>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-3 xl:max-w-2xl">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                Статус
              </div>
              <div className="mt-3 text-2xl font-semibold text-slate-900">{document.status}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                Версии
              </div>
              <div className="mt-3 text-2xl font-semibold text-slate-900">
                {controller.versions.length}
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                Автор
              </div>
              <div className="mt-3 text-2xl font-semibold text-slate-900">{document.authorName}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white/85 p-5 shadow-lg backdrop-blur-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            className="inline-flex items-center justify-center rounded-xl bg-slate-200 px-4 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-300"
            type="button"
            onClick={() => controller.navigateToList()}
          >
            Назад к списку
          </button>

          {controller.isDraft && (
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                className="inline-flex items-center justify-center rounded-xl bg-slate-200 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-300"
                type="button"
                onClick={() => controller.openEditDialog()}
              >
                Редактировать
              </button>
              <button
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-rose-600 to-red-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-red-950/20 transition hover:-translate-y-0.5"
                type="button"
                onClick={() => controller.deleteDocument()}
              >
                Удалить
              </button>
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="flex flex-col gap-6 xl:col-span-8">
          <section className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-lg backdrop-blur-sm">
            <div className="flex flex-col gap-5">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-xl font-semibold text-slate-900">Общие сведения</h2>
                <StatusBadge status={document.status} />
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <span className="block text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                    Автор
                  </span>
                  <strong className="mt-2 block text-slate-900">{document.authorName}</strong>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <span className="block text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                    Создан
                  </span>
                  <strong className="mt-2 block text-slate-900">{formatDateTime(document.createdAt)}</strong>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <span className="block text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                    Обновлён
                  </span>
                  <strong className="mt-2 block text-slate-900">{formatDateTime(document.updatedAt)}</strong>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <h3 className="text-lg font-semibold text-slate-900">Содержание</h3>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-7 text-slate-800 sm:text-base">
                  {document.content || 'Содержимое пока отсутствует.'}
                </pre>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-lg backdrop-blur-sm">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-slate-900">История версий</h2>
            </div>

            <VersionHistory
              versions={controller.versions}
              onVersionClick={(version) => controller.selectVersion(version)}
            />
          </section>

          <DocumentAttachments
            attachments={controller.attachments}
            canEdit={controller.isDraft}
            uploading={controller.uploadingAttachment}
            error={controller.attachmentError}
            onUpload={(file) => void controller.uploadAttachment(file)}
            onDownload={(attachmentId) => void controller.downloadAttachment(attachmentId)}
            onDelete={(attachmentId) => void controller.deleteAttachment(attachmentId)}
          />
        </div>

        <div className="xl:col-span-4">
          <DocumentVersionComparison
            currentDocument={controller.document}
            selectedVersion={controller.selectedVersion}
            onRestoreVersion={(versionNumber) => void controller.restoreDocumentVersion(versionNumber)}
          />
        </div>
      </div>

      {controller.isEditDialogOpen && (
        <div
          className="fixed inset-0 z-30 flex items-stretch justify-center bg-slate-950/55 p-4 backdrop-blur-sm sm:p-6 lg:p-8"
          role="presentation"
          onClick={() => controller.closeEditDialog()}
        >
          <div
            className="h-full w-full max-w-4xl overflow-auto rounded-3xl border border-slate-200 bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Редактирование документа"
            onClick={(event) => event.stopPropagation()}
          >
            <DocumentEditor
              document={controller.document}
              onSave={(dto) => controller.saveDocument(dto)}
              onCancel={() => controller.closeEditDialog()}
            />
          </div>
        </div>
      )}
    </div>
  );
});
