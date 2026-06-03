import type { StorageAdapter } from '../../../shared/types'

interface BetterSqlite3Database {
  exec(sql: string): void
  prepare(sql: string): BetterSqlite3Statement
  transaction<T>(fn: (...args: unknown[]) => T): (...args: unknown[]) => T
  close(): void
}

interface BetterSqlite3Statement {
  run(...params: unknown[]): { changes: number; lastInsertRowid: number | bigint }
  get<T>(...params: unknown[]): T | undefined
  all<T>(...params: unknown[]): T[]
}

export class ElectronSQLiteAdapter implements StorageAdapter {
  private _db: BetterSqlite3Database | null = null
  private _connected = false
  private _dbPath: string

  constructor(dbPath?: string) {
    this._dbPath = dbPath ?? 'kiro.db'
  }

  async connect(): Promise<void> {
    if (this._connected) return
    try {
      const Database = require('better-sqlite3')
      this._db = new Database(this._dbPath, {})
      this._db!.exec('PRAGMA journal_mode = WAL')
      this._db!.exec('PRAGMA foreign_keys = ON')
      this._db!.exec('PRAGMA busy_timeout = 5000')
      this._connected = true
    } catch (err) {
      throw new Error(`[ElectronSQLiteAdapter] Failed to connect: ${err}`)
    }
  }

  async disconnect(): Promise<void> {
    if (!this._connected || !this._db) return
    this._db.close()
    this._db = null
    this._connected = false
  }

  isConnected(): boolean {
    return this._connected
  }

  async get<T>(store: string, id: string): Promise<T | null> {
    this._ensureConnected()
    const stmt = this._db!.prepare(`SELECT * FROM ${store} WHERE id = ?`)
    const row = stmt.get<T>(id)
    return row ?? null
  }

  async getAll<T>(store: string): Promise<T[]> {
    this._ensureConnected()
    const stmt = this._db!.prepare(`SELECT * FROM ${store}`)
    return stmt.all<T>()
  }

  async put<T>(store: string, item: T): Promise<string> {
    this._ensureConnected()
    const id = String((item as Record<string, unknown>)['id'] ?? (item as Record<string, unknown>)['name'] ?? '')
    if (!id) throw new Error(`[ElectronSQLiteAdapter] put requires id or name field`)

    const obj = item as Record<string, unknown>
    const existing = await this.get<Record<string, unknown>>(store, id)
    if (existing) {
      const updates = Object.entries(obj)
        .filter(([k]) => k !== 'id')
        .map(([k]) => `${k} = ?`)
        .join(', ')
      const values = Object.entries(obj)
        .filter(([k]) => k !== 'id')
        .map(([, v]) => v)
      values.push(id)
      const stmt = this._db!.prepare(`UPDATE ${store} SET ${updates} WHERE id = ?`)
      stmt.run(...values)
    } else {
      const keys = Object.keys(obj)
      const placeholders = keys.map(() => '?').join(', ')
      const values = Object.values(obj)
      const stmt = this._db!.prepare(`INSERT INTO ${store} (${keys.join(', ')}) VALUES (${placeholders})`)
      stmt.run(...values)
    }
    return id
  }

  async delete(store: string, id: string): Promise<void> {
    this._ensureConnected()
    const stmt = this._db!.prepare(`DELETE FROM ${store} WHERE id = ?`)
    stmt.run(id)
  }

  async clear(store: string): Promise<void> {
    this._ensureConnected()
    this._db!.exec(`DELETE FROM ${store}`)
  }

  async queryByIndex<T>(store: string, index: string, value: unknown): Promise<T[]> {
    this._ensureConnected()
    const stmt = this._db!.prepare(`SELECT * FROM ${store} WHERE ${index} = ?`)
    return stmt.all<T>(value)
  }

  async query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]> {
    this._ensureConnected()
    const stmt = this._db!.prepare(sql)
    return stmt.all<T>(...(params ?? []))
  }

  async transaction<T = void>(fn: () => Promise<T>): Promise<T> {
    this._ensureConnected()
    const txn = this._db!.transaction(async () => {
      return fn()
    })
    return txn()
  }

  async execute(sql: string, params?: unknown[]): Promise<number> {
    this._ensureConnected()
    const stmt = this._db!.prepare(sql)
    const result = stmt.run(...(params ?? []))
    return result.changes
  }

  private _ensureConnected(): void {
    if (!this._connected || !this._db) {
      throw new Error('[ElectronSQLiteAdapter] Not connected. Call connect() first.')
    }
  }
}
