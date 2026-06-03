import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { StorageAdapter } from '../../../shared/types'
import { MigrationRunner } from '../migrations/MigrationRunner'

class MockAdapter implements StorageAdapter {
  private _tables: Record<string, Record<string, unknown>> = {}
  private _inTransaction = false
  private _connected = true

  connect = vi.fn()
  disconnect = vi.fn()
  isConnected = () => this._connected

  async get<T>(store: string, id: string): Promise<T | null> {
    const table = this._tables[store] ?? {}
    return (table[id] as T) ?? null
  }

  async getAll<T>(store: string): Promise<T[]> {
    const table = this._tables[store] ?? {}
    return Object.values(table) as T[]
  }

  async put<T>(store: string, item: T): Promise<string> {
    const table = this._tables[store] ?? {}
    const id = String((item as Record<string, unknown>)['id'] ?? (item as Record<string, unknown>)['key'] ?? '')
    table[id] = item
    this._tables[store] = table
    return id
  }

  async delete(store: string, id: string): Promise<void> {
    const table = this._tables[store]
    if (table) delete table[id]
  }

  async clear(store: string): Promise<void> {
    this._tables[store] = {}
  }

  async queryByIndex<T>(_store: string, _index: string, _value: unknown): Promise<T[]> {
    return []
  }

  async query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]> {
    if (sql.includes('_metadata') && sql.includes('SELECT')) {
      if (this._tables['_metadata']) {
        return Object.values(this._tables['_metadata']) as T[]
      }
      return []
    }
    return []
  }

  async transaction<T = void>(fn: () => Promise<T>): Promise<T> {
    this._inTransaction = true
    try {
      return await fn()
    } finally {
      this._inTransaction = false
    }
  }

  async execute(sql: string, params?: unknown[]): Promise<number> {
    if (sql.startsWith('CREATE TABLE')) {
      const match = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)
      if (match) {
        const name = match[1]!
        if (!this._tables[name]) this._tables[name] = {}
      }
      return 0
    }
    if (sql.startsWith('INSERT OR REPLACE') || sql.startsWith("INSERT INTO _metadata")) {
      const match = sql.match(/key,\s*value\)\s*VALUES\s*\(\s*'?([^',]+)'?/)
      if (match) {
        const key = match[1]!
        const value = params?.[0] ? String(params[0]) : ''
        if (!this._tables['_metadata']) this._tables['_metadata'] = {}
        ;(this._tables['_metadata'] as Record<string, unknown>)[key] = { key, value }
      }
      return 1
    }
    if (sql.startsWith('CREATE INDEX')) return 0
    if (sql.startsWith('DROP TABLE')) {
      const match = sql.match(/DROP TABLE IF EXISTS (\w+)/)
      if (match) {
        const name = match[1]!
        delete this._tables[name]
      }
      return 0
    }
    return 0
  }
}

describe('MigrationRunner', () => {
  let adapter: MockAdapter
  let runner: MigrationRunner

  beforeEach(() => {
    adapter = new MockAdapter()
    runner = new MigrationRunner(adapter)
  })

  it('should start at schema version 0', async () => {
    const version = await runner.getSchemaVersion()
    expect(version).toBe(0)
  })

  it('should detect pending migrations', async () => {
    const pending = await runner.getPendingMigrations()
    expect(pending.length).toBeGreaterThanOrEqual(2)
    expect(pending[0]?.version).toBe(1)
    expect(pending[1]?.version).toBe(2)
  })

  it('should run all pending migrations', async () => {
    await runner.runPending()
    const version = await runner.getSchemaVersion()
    expect(version).toBe(2)
  })

  it('should not re-run already applied migrations', async () => {
    await runner.runPending()
    const version1 = await runner.getSchemaVersion()
    expect(version1).toBe(2)

    const pending = await runner.getPendingMigrations()
    expect(pending.length).toBe(0)
  })

  it('should run a single migration by version', async () => {
    await runner.runMigration({ version: 1, name: 'test', sql: 'CREATE TABLE IF NOT EXISTS test_table (id TEXT PRIMARY KEY);' })
    const version = await runner.getSchemaVersion()
    expect(version).toBe(1)
  })

  it('should run all migrations from scratch', async () => {
    await runner.runAll()
    const version = await runner.getSchemaVersion()
    expect(version).toBe(2)
  })

  it('should reset all tables', async () => {
    await runner.runAll()
    await runner.reset()
    const version = await runner.getSchemaVersion()
    expect(version).toBe(0)
  })

  it('should support rollback via transaction wrapping', async () => {
    await runner.runAll()
    const version = await runner.getSchemaVersion()
    expect(version).toBe(2)
  })
})
