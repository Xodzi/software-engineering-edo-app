import { documents } from './schema';
import { v4 as uuidv4 } from 'uuid';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { InferInsertModel } from 'drizzle-orm';
import * as schema from './schema';

type NewDocument = InferInsertModel<typeof documents>;

export function seedDatabase(db: BetterSQLite3Database<typeof schema>) {
  const existing = db.select().from(documents).all();

  if (existing.length > 0) return;

  const now = new Date().toISOString();

  const seed: NewDocument[] = [
    {
      id: uuidv4(),
      title: 'Test document',
      content: 'Mock content',
      status: 'DRAFT',
      authorId: 'seed',
      authorName: 'System',
      currentVersionId: null,
      sourceVersionId: null,
      versionHistoryHash: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    },
    {
      id: uuidv4(),
      title: 'Second document',
      content: 'Another mock',
      status: 'APPROVED', // FIX
      authorId: 'seed',
      authorName: 'System',
      currentVersionId: null,
      sourceVersionId: null,
      versionHistoryHash: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    },
  ];

  db.insert(documents).values(seed).run();
}