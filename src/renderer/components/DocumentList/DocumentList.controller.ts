import { makeAutoObservable } from 'mobx';
import { Document, DocStatus } from '@shared/types';

export class DocumentListController {
  statusFilter: DocStatus | 'ALL' = 'ALL';
  searchQuery = '';
  allDocuments: readonly Document[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  setDocuments(documents: readonly Document[]): void {
    this.allDocuments = documents;
  }

  get filteredDocuments(): readonly Document[] {
    const query = this.searchQuery.trim().toLowerCase();

    return this.allDocuments.filter((doc) => {
      const matchesStatus = this.statusFilter === 'ALL' || doc.status === this.statusFilter;
      if (!matchesStatus) return false;
      if (!query) return true;

      return [
        doc.title,
        doc.content,
        doc.authorName,
        doc.status,
      ].some((value) => value.toLowerCase().includes(query));
    });
  }

  setStatusFilter(value: DocStatus | 'ALL'): void {
    this.statusFilter = value;
  }

  setSearchQuery(value: string): void {
    this.searchQuery = value;
  }
}
