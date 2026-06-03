import type { StorageAdapter } from '../../../shared/types'

export interface Migration {
  version: number
  name: string
  sql: string
}

const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'initial_schema',
    sql: `CREATE TABLE IF NOT EXISTS _metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY, title TEXT NOT NULL DEFAULT '', channel TEXT NOT NULL DEFAULT '',
  duration TEXT NOT NULL DEFAULT '', thumbnail TEXT NOT NULL DEFAULT '', url TEXT NOT NULL DEFAULT '',
  folder_id TEXT, added INTEGER NOT NULL DEFAULT 0, updated INTEGER NOT NULL DEFAULT 0,
  blurred INTEGER NOT NULL DEFAULT 0, archived INTEGER NOT NULL DEFAULT 0, pub_date TEXT, privacy TEXT
);
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY, title TEXT NOT NULL DEFAULT '', content TEXT NOT NULL DEFAULT '',
  folder_id TEXT, todos TEXT NOT NULL DEFAULT '[]', added INTEGER NOT NULL DEFAULT 0, updated INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS folders (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, color TEXT, created_at INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS bookmarks (
  id TEXT PRIMARY KEY, url TEXT NOT NULL DEFAULT '', title TEXT NOT NULL DEFAULT '',
  image TEXT, added INTEGER NOT NULL DEFAULT 0, blurred INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS direct_access (
  id TEXT PRIMARY KEY, url TEXT NOT NULL DEFAULT '', title TEXT NOT NULL DEFAULT '',
  image TEXT, added INTEGER NOT NULL DEFAULT 0, blurred INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS external_files (
  id TEXT PRIMARY KEY, name TEXT NOT NULL DEFAULT '', path TEXT NOT NULL DEFAULT '',
  size INTEGER NOT NULL DEFAULT 0, mime_type TEXT NOT NULL DEFAULT '', added INTEGER NOT NULL DEFAULT 0,
  blurred INTEGER NOT NULL DEFAULT 0, folder_id TEXT, thumbnail TEXT
);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY, type TEXT NOT NULL DEFAULT '', value TEXT NOT NULL DEFAULT '',
  scope TEXT NOT NULL DEFAULT '', updated_at INTEGER NOT NULL DEFAULT 0
);`,
  },
  {
    version: 2,
    name: 'indexes',
    sql: `CREATE INDEX IF NOT EXISTS idx_videos_folder_id ON videos(folder_id);
CREATE INDEX IF NOT EXISTS idx_videos_added ON videos(added);
CREATE INDEX IF NOT EXISTS idx_videos_updated ON videos(updated);
CREATE INDEX IF NOT EXISTS idx_videos_title ON videos(title);
CREATE INDEX IF NOT EXISTS idx_notes_folder_id ON notes(folder_id);
CREATE INDEX IF NOT EXISTS idx_notes_updated ON notes(updated);
CREATE INDEX IF NOT EXISTS idx_notes_added ON notes(added);
CREATE INDEX IF NOT EXISTS idx_bookmarks_added ON bookmarks(added);
CREATE INDEX IF NOT EXISTS idx_direct_access_added ON direct_access(added);
CREATE INDEX IF NOT EXISTS idx_external_files_added ON external_files(added);
CREATE INDEX IF NOT EXISTS idx_permissions_type ON permissions(type);`,
  },
]

export class MigrationRunner {
  constructor(private adapter: StorageAdapter) {}

  async getSchemaVersion(): Promise<number> {
    try {
      const rows = await this.adapter.query<{ value: string }>(
        "SELECT value FROM _metadata WHERE key = 'schema_version'"
      )
      if (rows.length > 0) {
        return parseInt(rows[0]?.value ?? '0', 10) || 0
      }
    } catch {
      // _metadata table may not exist yet
    }
    return 0
  }

  async setSchemaVersion(version: number): Promise<void> {
    await this.adapter.execute(
      "INSERT OR REPLACE INTO _metadata (key, value) VALUES ('schema_version', ?)",
      [String(version)]
    )
  }

  async getPendingMigrations(): Promise<Migration[]> {
    const current = await this.getSchemaVersion()
    return MIGRATIONS.filter((m) => m.version > current)
  }

  async runPending(): Promise<void> {
    const pending = await this.getPendingMigrations()
    if (pending.length === 0) return

    for (const migration of pending) {
      await this.runMigration(migration)
    }
  }

  async runMigration(migration: Migration): Promise<void> {
    const statements = migration.sql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    await this.adapter.transaction(async () => {
      for (const stmt of statements) {
        await this.adapter.execute(stmt)
      }
      await this.setSchemaVersion(migration.version)
    })
  }

  async runAll(): Promise<void> {
    for (const migration of MIGRATIONS) {
      await this.runMigration(migration)
    }
  }

  async reset(): Promise<void> {
    const tables = [
      'videos', 'notes', 'folders', 'bookmarks',
      'direct_access', 'external_files', 'settings', 'permissions', '_metadata',
    ]
    await this.adapter.transaction(async () => {
      for (const table of tables) {
        await this.adapter.execute(`DROP TABLE IF EXISTS ${table}`)
      }
    })
  }
}
