import { observer } from 'mobx-react-lite';
import { DocumentsPageController } from './DocumentsPage.controller';
import { DocumentList } from '../../components/DocumentList';
import { DocumentEditor } from '../../components/DocumentEditor';

interface DocumentsPageViewProps {
  controller: DocumentsPageController;
}

export const DocumentsPageView = observer(function DocumentsPageView({
  controller,
}: DocumentsPageViewProps) {
  return (
    <div className="page-shell">
      <section className="page-hero">
        <div>
          <p className="page-hero__eyebrow">Рабочая область СЭД</p>
          <h1>Реестр документов</h1>
          <p className="page-hero__subtitle">
            Просматривайте документы, фильтруйте их по статусу и открывайте карточку
            документа, не теряя контекст основной страницы.
          </p>
        </div>

        <div className="hero-metrics">
          <div className="hero-metric">
            <div className="hero-metric__label">Всего</div>
            <div className="hero-metric__value">{controller.documents.length}</div>
          </div>
          <div className="hero-metric">
            <div className="hero-metric__label">Черновики</div>
            <div className="hero-metric__value">{controller.draftCount}</div>
          </div>
          <div className="hero-metric">
            <div className="hero-metric__label">Состояние</div>
            <div className="hero-metric__value">{controller.loading ? '...' : 'Актуально'}</div>
          </div>
        </div>
      </section>

      <section className="surface-panel">
        <div className="toolbar-row">
          <div className="toolbar-row__meta">
            Список документов, фильтр по статусу и создание нового документа через диалоговое окно.
          </div>
          <button
            className="primary-button"
            type="button"
            onClick={() => controller.openCreateDialog()}
          >
            Создать документ
          </button>
        </div>

        <DocumentList
          documents={controller.documents}
          loading={controller.loading}
          error={controller.error}
          onDocumentClick={(id) => controller.navigateToDetail(id)}
        />
      </section>

      {controller.isCreateDialogOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => controller.closeCreateDialog()}
        >
          <div
            className="modal-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Создание документа"
            onClick={(event) => event.stopPropagation()}
          >
            <DocumentEditor
              onSave={(dto) => controller.createDocument(dto)}
              onCancel={() => controller.closeCreateDialog()}
            />
          </div>
        </div>
      )}
    </div>
  );
});
