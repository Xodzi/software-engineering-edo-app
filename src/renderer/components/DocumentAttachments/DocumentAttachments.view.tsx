import { DocumentAttachment } from '@shared/types';
import { formatDateTime, formatFileSize } from '@shared/utils';

interface DocumentAttachmentsViewProps {
  attachments: readonly DocumentAttachment[];
  canEdit: boolean;
  uploading: boolean;
  error: string | null;
  onUpload: (file: File | null) => void;
  onDownload: (attachmentId: string) => void;
  onDelete: (attachmentId: string) => void;
}

export function DocumentAttachmentsView({
  attachments,
  canEdit,
  uploading,
  error,
  onUpload,
  onDownload,
  onDelete,
}: DocumentAttachmentsViewProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-lg backdrop-blur-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Файлы документа</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Вложения хранятся вместе с карточкой документа и доступны для скачивания.
          </p>
        </div>

        {canEdit && (
          <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-950/20 transition hover:-translate-y-0.5 hover:bg-teal-800">
            {uploading ? 'Сохранение...' : 'Добавить файл'}
            <input
              className="sr-only"
              type="file"
              disabled={uploading}
              onChange={(event) => {
                onUpload(event.target.files?.[0] ?? null);
                event.target.value = '';
              }}
            />
          </label>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {attachments.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          Файлы пока не добавлены.
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          {attachments.map((attachment) => (
            <div
              className="flex flex-col gap-3 border-t border-slate-200 bg-white px-4 py-4 first:border-t-0 sm:flex-row sm:items-center sm:justify-between"
              key={attachment.id}
            >
              <div className="min-w-0">
                <div className="truncate font-semibold text-slate-900">{attachment.fileName}</div>
                <div className="mt-1 text-sm text-slate-500">
                  {formatFileSize(attachment.size)} · {formatDateTime(attachment.createdAt)}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  className="inline-flex items-center justify-center rounded-lg bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-300"
                  type="button"
                  onClick={() => onDownload(attachment.id)}
                >
                  Скачать
                </button>
                {canEdit && (
                  <button
                    className="inline-flex items-center justify-center rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
                    type="button"
                    onClick={() => onDelete(attachment.id)}
                  >
                    Удалить
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
