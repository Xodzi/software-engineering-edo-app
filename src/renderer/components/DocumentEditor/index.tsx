import { useLocalObservable } from 'mobx-react-lite';
import { Document, CreateDocumentDto, UpdateDocumentDto } from '@shared/types';
import { DocumentEditorController } from './DocumentEditor.controller';
import { DocumentEditorView } from './DocumentEditor.view';

interface DocumentEditorProps {
  document?: Document;
  initialTitle?: string;
  initialContent?: string;
  onSave: (dto: CreateDocumentDto | UpdateDocumentDto) => Promise<void>;
  onCancel: () => void;
}

export function DocumentEditor({
  document,
  initialTitle,
  initialContent,
  onSave,
  onCancel,
}: DocumentEditorProps) {
  const controller = useLocalObservable(() => new DocumentEditorController(document, initialTitle, initialContent));

  return <DocumentEditorView controller={controller} onSave={onSave} onCancel={onCancel} />;
}
