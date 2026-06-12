import BetterSqlite3 from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import path from 'path'
import { app } from 'electron'
import * as schema from './schema'
import { seedDatabase } from './seed'

let db: ReturnType<typeof drizzle<typeof schema>> | null = null

export function initDatabase() {
  if (db) return db

  const dbPath = path.join(app.getPath('userData'), 'sed_documents3.db')
  const sqlite = new BetterSqlite3(dbPath)
  sqlite.pragma('foreign_keys = ON')
  sqlite.pragma('journal_mode = WAL')
  const migrationsFolder = path.join(process.cwd(), 'drizzle');

  db = drizzle(sqlite, { schema })

  migrate(db, { migrationsFolder: migrationsFolder })
  seedDatabase(db); 

  return db
}

export function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.')
  return db
}

export function closeDatabase() {
  if (db) {
    if (db.$client) {
      db.$client.close();
    }
    db = null;
  }
}