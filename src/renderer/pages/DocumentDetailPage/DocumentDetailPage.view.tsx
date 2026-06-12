import { observer } from 'mobx-react-lite';
import { formatDateTime } from '@shared/utils';
import { DocumentDetailPageController } from './DocumentDetailPage.controller';
import { StatusBadge } from '../../components/StatusBadge/StatusBadge';
import { VersionHistory } from '../../components/VersionHistory';
import { DocumentEditor } from '../../components/DocumentEditor';

interface DocumentDetailPageViewProps {
  controller: DocumentDetailPageController;
}

export const DocumentDetailPageView = observer(function DocumentDetailPageView({
  controller,
}: DocumentDetailPageViewProps) {
  if (controller.loading) {
    return <div className="page-state">Загрузка документа...</div>;
  }

  if (controller.error || !controller.document) {
    return (
      <div className="page-state page-state--error">
        Ошибка: {controller.error ?? 'Документ не найден'}
      </div>
    );
  }

  const document = controller.document;

  return (
    <div className="page-shell">
      <section className="page-hero">
        <div>
          <p className="page-hero__eyebrow">Карточка документа</p>
          <h1>{document.title}</h1>
          <p className="page-hero__subtitle">
            Полный просмотр документа с метаданными, историей версий и действиями для черновика.
          </p>
        </div>

        <div className="hero-metrics">
          <div className="hero-metric">
            <div className="hero-metric__label">Статус</div>
            <div className="hero-metric__value">{document.status}</div>
          </div>
          <div className="hero-metric">
            <div className="hero-metric__label">Версии</div>
            <div className="hero-metric__value">{controller.versions.length}</div>
          </div>
          <div className="hero-metric">
            <div className="hero-metric__label">Автор</div>
            <div className="hero-metric__value">{document.authorName}</div>
          </div>
        </div>
      </section>

      <section className="surface-panel">
        <div className="toolbar-row">
          <button
            className="ghost-button"
            type="button"
            onClick={() => controller.navigateToList()}
          >
            Назад к списку
          </button>

          {(controller.isDraft || controller.isPending) && (
            <div className="document-actions">
              <label className="form-field">
                <span>Роль для согласования</span>
                <select
                  value={controller.approvalRole}
                  onChange={(event) =>
                    controller.setApprovalRole(event.target.value as typeof controller.approvalRole)
                  }
                  disabled={controller.approvalInProgress}
                >
                  <option value="EMPLOYEE">Сотрудник</option>
                  <option value="MANAGER">Руководитель</option>
                  <option value="ADMINISTRATOR">Администратор</option>
                </select>
              </label>

              {controller.isDraft && (
                <button
                  className="primary-button"
                  type="button"
                  disabled={controller.approvalInProgress}
                  onClick={() => void controller.submitForApproval()}
                >
                  Отправить на согласование
                </button>
              )}

              {controller.isPending && (
                <>
                  <button
                    className="primary-button"
                    type="button"
                    disabled={controller.approvalInProgress}
                    onClick={() => void controller.approveDocument()}
                  >
                    Утвердить
                  </button>
                  <button
                    className="danger-button"
                    type="button"
                    disabled={controller.approvalInProgress}
                    onClick={() => controller.rejectDocument()}
                  >
                    Отклонить
                  </button>
                </>
              )}
            </div>
          )}

          {controller.isDraft && (
            <div className="document-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={() => controller.openEditDialog()}
              >
                Редактировать
              </button>
              <button className="danger-button" type="button" onClick={() => controller.deleteDocument()}>
                Удалить
              </button>
            </div>
          )}
        </div>

        {controller.approvalError && (
          <div className="page-state page-state--error">
            Ошибка согласования: {controller.approvalError}
          </div>
        )}

        {controller.isRejectDialogOpen && (
          <div className="surface-panel">
            <label className="form-field">
              <span>Причина отклонения</span>
              <textarea
                value={controller.rejectComment}
                onChange={(event) => controller.setRejectComment(event.target.value)}
                disabled={controller.approvalInProgress}
                placeholder="Комментарий можно оставить пустым"
              />
            </label>
            <div className="document-actions">
              <button
                className="secondary-button"
                type="button"
                disabled={controller.approvalInProgress}
                onClick={() => controller.cancelRejectDocument()}
              >
                Отмена
              </button>
              <button
                className="danger-button"
                type="button"
                disabled={controller.approvalInProgress}
                onClick={() => void controller.confirmRejectDocument()}
              >
                Подтвердить отклонение
              </button>
            </div>
          </div>
        )}
      </section>

      <div className="detail-grid">
        <div className="detail-stack">
          <section className="surface-panel detail-card">
            <div className="detail-card__header">
              <div className="detail-card__title">
                <h2>Общие сведения</h2>
                <StatusBadge status={document.status} />
              </div>
              <div className="detail-meta-grid">
                <div>
                  <span className="detail-meta-grid__label">Автор</span>
                  <strong>{document.authorName}</strong>
                </div>
                <div>
                  <span className="detail-meta-grid__label">Создан</span>
                  <strong>{formatDateTime(document.createdAt)}</strong>
                </div>
                <div>
                  <span className="detail-meta-grid__label">Обновлён</span>
                  <strong>{formatDateTime(document.updatedAt)}</strong>
                </div>
              </div>
            </div>

            <div className="detail-card__body">
              <h3>Содержание</h3>
              <div className="document-content-block">
                <pre>{document.content || 'Содержимое пока отсутствует.'}</pre>
              </div>
            </div>
          </section>

          <section className="surface-panel detail-card">
            <div className="detail-card__header">
              <div className="detail-card__title">
                <h2>История версий</h2>
              </div>
            </div>

            <div className="detail-card__body">
              <VersionHistory
                versions={controller.versions}
                onVersionClick={(version) => controller.selectVersion(version)}
              />
            </div>
          </section>
        </div>

        <aside className="surface-panel detail-card version-preview">
          <div className="detail-card__header">
            <div className="detail-card__title">
              <h2>Просмотр версии</h2>
            </div>
          </div>

          <div className="detail-card__body">
            {controller.selectedVersion ? (
              <>
                <div className="version-preview__meta">
                  <strong>v{controller.selectedVersion.versionNumber}</strong>
                  <span>{controller.selectedVersion.authorName}</span>
                  <span>{formatDateTime(controller.selectedVersion.createdAt)}</span>
                </div>
                <div className="version-preview__note">
                  {controller.selectedVersion.changeNote || 'Комментарий к изменениям отсутствует.'}
                </div>
                <div className="document-content-block">
                  <pre>{controller.selectedVersion.content}</pre>
                </div>
              </>
            ) : (
              <div className="page-state">Выберите строку версии, чтобы посмотреть её содержимое.</div>
            )}
          </div>
        </aside>
      </div>

      {controller.isEditDialogOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => controller.closeEditDialog()}
        >
          <div
            className="modal-panel"
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
