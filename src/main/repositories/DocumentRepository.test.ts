import { describe, expect, it } from 'vitest';
import { DocStatus } from '../../shared/types';
import { SqliteDatabase } from '../db/types';
import { DocumentRepository } from './DocumentRepository';

type DocumentRow = {
  id: string;
  title: string;
  content: string;
  status: DocStatus;
  author_id: string;
  author_name: string;
  created_at: string;
  updated_at: string;
};

type VersionRow = {
  id: string;
  document_id: string;
  version_number: number;
  content: string;
  author_id: string;
  author_name: string;
  created_at: string;
  change_note: string;
};

class FakeSqliteDatabase {
  readonly document: DocumentRow;
  readonly versions: VersionRow[];

  constructor(status: DocStatus, versionNumbers: number[]) {
    this.document = {
      id: 'document-1',
      title: 'Approval document',
      content: 'Current content',
      status,
      author_id: 'author-1',
      author_name: 'Author',
      created_at: '2026-06-01T00:00:00.000Z',
      updated_at: '2026-06-01T00:00:00.000Z',
    };
    this.versions = versionNumbers.map((versionNumber) => ({
      id: `version-${versionNumber}`,
      document_id: this.document.id,
      version_number: versionNumber,
      content: `Version ${versionNumber} content`,
      author_id: this.document.author_id,
      author_name: this.document.author_name,
      created_at: this.document.created_at,
      change_note: `Version ${versionNumber}`,
    }));
  }

  prepare(sql: string) {
    return {
      all: (...args: unknown[]) => this.all(sql, args),
      get: (...args: unknown[]) => this.get(sql, args),
      run: (...args: unknown[]) => this.run(sql, args),
    };
  }

  transaction<TArgs extends unknown[], TResult>(
    callback: (...args: TArgs) => TResult,
  ): (...args: TArgs) => TResult {
    return (...args: TArgs) => callback(...args);
  }

  private all(sql: string, args: unknown[]): unknown[] {
    if (sql.includes('FROM documents')) return [this.document];
    if (sql.includes('FROM document_versions')) {
      const [documentId] = args;
      return this.versions
        .filter((version) => version.document_id === documentId)
        .sort((a, b) => b.version_number - a.version_number);
    }
    return [];
  }

  private get(sql: string, args: unknown[]): unknown {
    if (sql.includes('SELECT * FROM documents WHERE id = ?')) {
      return args[0] === this.document.id ? this.document : undefined;
    }

    if (sql.includes('COALESCE(MAX(version_number), 0) + 1')) {
      const [documentId] = args;
      const maxVersion = this.versions
        .filter((version) => version.document_id === documentId)
        .reduce((max, version) => Math.max(max, version.version_number), 0);
      return { next: maxVersion + 1 };
    }

    if (sql.includes('WHERE document_id = ? AND version_number = ?')) {
      const [documentId, versionNumber] = args;
      return this.versions.find(
        (version) =>
          version.document_id === documentId &&
          version.version_number === versionNumber,
      );
    }

    return undefined;
  }

  private run(sql: string, args: unknown[]): void {
    if (sql.includes('INSERT INTO document_versions')) {
      const [
        id,
        documentId,
        versionNumber,
        content,
        authorId,
        authorName,
        changeNote,
        createdAt,
      ] = args as [string, string, number, string, string, string, string, string];

      const alreadyExists = this.versions.some(
        (version) =>
          version.document_id === documentId &&
          version.version_number === versionNumber,
      );
      if (alreadyExists) {
        throw new Error(
          'UNIQUE constraint failed: document_versions.document_id, document_versions.version_number',
        );
      }

      this.versions.push({
        id,
        document_id: documentId,
        version_number: versionNumber,
        content,
        author_id: authorId,
        author_name: authorName,
        change_note: changeNote,
        created_at: createdAt,
      });
      return;
    }

    if (sql.includes('UPDATE documents SET status = ?')) {
      const [status, updatedAt, id] = args as [DocStatus, string, string];
      if (id === this.document.id) {
        this.document.status = status;
        this.document.updated_at = updatedAt;
      }
    }
  }
}

function createRepository(db: FakeSqliteDatabase): DocumentRepository {
  return new DocumentRepository(db as unknown as SqliteDatabase);
}

describe('DocumentRepository version history', () => {
  it('uses max version number plus one when approving a document with existing history', () => {
    const db = new FakeSqliteDatabase('PENDING', [1, 2]);
    const repository = createRepository(db);

    const result = repository.updateStatus('document-1', 'APPROVED', 'Approved in workflow');

    expect(result.status).toBe('APPROVED');
    expect(db.versions.map((version) => version.version_number)).toEqual([1, 2, 3]);
    expect(db.versions.at(-1)?.change_note).toBe('Approved in workflow');
  });

  it('uses max version number plus one when rejecting a document with existing history', () => {
    const db = new FakeSqliteDatabase('PENDING', [1, 2]);
    const repository = createRepository(db);

    const result = repository.updateStatus('document-1', 'REJECTED', 'Rejected in workflow');

    expect(result.status).toBe('REJECTED');
    expect(db.versions.map((version) => version.version_number)).toEqual([1, 2, 3]);
    expect(db.versions.at(-1)?.change_note).toBe('Rejected in workflow');
  });
});
