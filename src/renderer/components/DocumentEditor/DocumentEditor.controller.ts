import { makeAutoObservable } from 'mobx';
import { Document, CreateDocumentDto, UpdateDocumentDto } from '@shared/types';

export class DocumentEditorController {
  title: string;
  content: string;
  changeNote = '';
  saving = false;
  error: string | null = null;
  validationErrors: readonly string[] = [];

  private readonly document?: Document;

  constructor(document?: Document, initialTitle?: string, initialContent?: string) {
    this.document = document;
    this.title = document?.title ?? initialTitle ?? '';
    this.content = document?.content ?? initialContent ?? '';
    makeAutoObservable(this);
  }

  get isEditing(): boolean {
    return Boolean(this.document);
  }

  setTitle(value: string): void {
    this.title = value;
  }

  setContent(value: string): void {
    this.content = value;
  }

  setChangeNote(value: string): void {
    this.changeNote = value;
  }

  private buildValidationErrors(): string[] {
    const errors: string[] = [];
    if (!this.title.trim()) errors.push('Поле "Название" обязательно.');
    if (this.title.length > 255) errors.push('Название должно содержать не более 255 символов.');
    if (this.isEditing && !this.changeNote.trim()) errors.push('При редактировании нужно указать комментарий к изменению.');
    return errors;
  }

  async submit(
    onSave: (dto: CreateDocumentDto | UpdateDocumentDto) => Promise<void>,
  ): Promise<void> {
    const errors = this.buildValidationErrors();
    this.validationErrors = errors;
    if (errors.length > 0) return;

    this.saving = true;
    this.error = null;

    try {
      if (this.isEditing) {
        await onSave({ title: this.title, content: this.content, changeNote: this.changeNote });
      } else {
        await onSave({
          title: this.title,
          content: this.content,
          authorId: 'current-user',
          authorName: 'Текущий пользователь',
        });
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Не удалось сохранить документ';
    } finally {
      this.saving = false;
    }
  }
}
