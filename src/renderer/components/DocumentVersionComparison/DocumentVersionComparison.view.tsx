import { observer } from 'mobx-react-lite';
import { formatDateTime } from '@shared/utils';
import { DocumentVersion } from '@shared/types';
import { DocumentVersionComparisonController } from './DocumentVersionComparison.controller';

interface DocumentVersionComparisonViewProps {
  controller: DocumentVersionComparisonController;
  onRestoreVersion: (versionNumber: number) => Promise<void> | void;
  onCreateVersionDraft: (version: DocumentVersion) => void;
}

function renderLineText(text: string): string {
  return text.length > 0 ? text : '\u00A0';
}

function renderPane(
  title: string,
  side: 'left' | 'right',
  rows: readonly {
    kind: string;
    leftLineNumber: number | null;
    rightLineNumber: number | null;
    leftText: string;
    rightText: string;
  }[],
) {
  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-700">
        {title}
      </div>
      <div className="flex-1 overflow-auto">
        {rows.map((row, index) => {
          const lineNumber = side === 'left' ? row.leftLineNumber : row.rightLineNumber;
          const text = side === 'left' ? row.leftText : row.rightText;
          const rowTone =
            row.kind === 'added'
              ? 'bg-emerald-50'
              : row.kind === 'removed'
                ? 'bg-rose-50'
                : row.kind === 'modified'
                  ? 'bg-amber-50'
                  : 'bg-white';

          return (
            <div
              key={`${side}-${row.kind}-${index}`}
              className={`flex gap-3 border-t border-slate-200 px-4 py-3 ${rowTone}`}
            >
              <span className="w-10 shrink-0 text-right text-xs font-semibold text-slate-500">
                {lineNumber ?? ' '}
              </span>
              <span className="min-w-0 flex-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">
                {renderLineText(text)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export const DocumentVersionComparisonView = observer(
  function DocumentVersionComparisonView({
    controller,
    onRestoreVersion,
    onCreateVersionDraft,
  }: DocumentVersionComparisonViewProps) {
    if (!controller.currentDocument || !controller.selectedVersion) {
      return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-slate-500">
          Выберите версию, чтобы сравнить её с текущим документом.
        </div>
      );
    }

    const { currentDocument, selectedVersion, rows, summary, hasDifferences } = controller;
    const canRestore = currentDocument.status === 'DRAFT';

    return (
      <>
        <section className="mt-6 rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-lg backdrop-blur-sm">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-xl font-semibold text-slate-900">Сравнение версий</h2>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-xl bg-slate-200 px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-300"
                onClick={() => controller.openDetails()}
              >
                Просмотр деталей
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
                Совпало: {summary.equalLines}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-800">
                Добавлено: {summary.addedLines}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-2 text-sm font-semibold text-rose-800">
                Удалено: {summary.removedLines}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-900">
                Изменено: {summary.modifiedLines}
              </span>
            </div>

            {!hasDifferences && (
              <div className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
                Содержимое версии и текущего документа совпадает.
              </div>
            )}
          </div>
        </section>

        {controller.isDetailsOpen && (
          <div
            className="fixed inset-0 z-30 flex items-stretch justify-center bg-slate-950/55 p-4 backdrop-blur-sm sm:p-6 lg:p-8"
            role="presentation"
            onClick={() => controller.closeDetails()}
          >
            <div
              className="h-full w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl sm:p-6"
              role="dialog"
              aria-modal="true"
              aria-label="Подробное сравнение версий"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">
                      Side-by-side просмотр
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 sm:text-base">
                      {selectedVersion.authorName} · {formatDateTime(selectedVersion.createdAt)}
                    </p>
                  </div>

                    <div className="flex flex-wrap gap-2">
                      {canRestore && (
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-teal-700 to-sky-800 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-900/20 transition hover:-translate-y-0.5"
                          onClick={() => void onRestoreVersion(selectedVersion.versionNumber)}
                        >
                          Восстановить версию
                        </button>
                      )}
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-700 to-teal-800 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-teal-900/20 transition hover:-translate-y-0.5"
                        onClick={() => onCreateVersionDraft(selectedVersion)}
                      >
                        Создать черновик на основе версии
                      </button>
                      <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-xl bg-slate-200 px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-300"
                      onClick={() => controller.closeDetails()}
                    >
                      Закрыть
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  {selectedVersion.changeNote || 'Комментарий к изменениям отсутствует.'}
                </div>

                {!canRestore && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Восстановление доступно только для черновика.
                  </div>
                )}

                <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
                  {renderPane('Выбранная версия', 'left', rows)}
                  {renderPane('Текущий документ', 'right', rows)}
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  },
);
