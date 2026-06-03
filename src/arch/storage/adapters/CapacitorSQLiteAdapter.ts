import type { StorageAdapter } from '../../../shared/types'

interface CapacitorSQLitePlugin {
  createConnection(dbName: string, encrypted: boolean, mode: string, version: number): Promise<{ result: boolean }>
  openConnection(dbName: string, readonly: boolean): Promise<{ result: boolean }>
  closeConnection(dbName: string): Promise<{ result: boolean }>
  execute(dbName: string, statements: string): Promise<{ changes: { changes: number }[] }>
  executeSet(dbName: string, set: { statement: string; values: string[] }[]): Promise<{ changes: { changes: number }[] }>
  run(dbName: string, statement: string, values: string[]): Promise<{ changes: { changes: number } }>
  query(dbName: string, statement: string, values: string[]): Promise<{ values: Record<string, unknown>[] }>
  isDBOpen(dbName: string): Promise<{ result: boolean }>
  isDBExists(dbName: string): Promise<{ result: boolean }>
  deleteDatabase(dbName: string): Promise<{ result: boolean }>
}

export class CapacitorSQLiteAdapter implements StorageAdapter {
  private _dbName: string
  private _connected = false
  private _plugin: CapacitorSQLitePlugin | null = null

  constructor(dbName?: string) {
    this._dbName = dbName ?? 'kiro.db'
  }

  async connect(): Promise<void> {
    if (this._connected) return
    try {
      const Capacitor = (window as unknown as Record<string, unknown>)['Capacitor'] as Record<string, unknown> | undefined
      const plugin = (Capacitor?.['Plugins'] as Record<string, unknown> | undefined)?.['CapacitorSQLite'] as CapacitorSQLitePlugin | undefined
      if (!plugin) {
        throw new Error('CapacitorSQLite plugin not available')
      }
      this._plugin = plugin

      const exists = await plugin.isDBExists(this._dbName)
      if (!exists.result) {
        await plugin.createConnection(this._dbName, false, 'no-encryption', 1)
      }
      await plugin.openConnection(this._dbName, false)
      this._connected = true
    } catch (err) {
      throw new Error(`[CapacitorSQLiteAdapter] Failed to connect: ${err}`)
    }
  }

  async disconnect(): Promise<void> {
    if (!this._connected || !this._plugin) return
    await this._plugin.closeConnection(this._dbName)
    this._connected = false
    this._plugin = null
  }

  isConnected(): boolean {
    return this._connected
  }

  async get<T>(store: string, id: string): Promise<T | null> {
    this._ensureConnected()
    const result = await this._plugin!.query(
      this._dbName,
      `SELECT * FROM ${store} WHERE id = ?`,
      [id]
    )
    const rows = result.values as T[] | undefined
    return rows && rows.length > 0 ? (rows[0] ?? null) : null
  }

  async getAll<T>(store: string): Promise<T[]> {
    this._ensureConnected()
    const result = await this._plugin!.query(
      this._dbName,
      `SELECT * FROM ${store}`,
      []
    )
    return result.values as T[]
  }

  async put<T>(store: string, item: T): Promise<string> {
    this._ensureConnected()
    const id = String((item as Record<string, unknown>)['id'] ?? (item as Record<string, unknown>)['name'] ?? '')
    if (!id) throw new Error('[CapacitorSQLiteAdapter] put requires id or name field')

    const obj = item as Record<string, unknown>
    const keys = Object.keys(obj)
    const values = Object.values(obj).map((v) =>
      v === null || v === undefined ? null : String(v)
    )
    const placeholders = keys.map(() => '?').join(', ')
    const updateClause = keys
      .filter((k) => k !== 'id')
      .map((k) => `${k} = ?`)
      .join(', ')

    await this._plugin!.execute(
      this._dbName,
      `INSERT OR REPLACE INTO ${store} (${keys.join(', ')}) VALUES (${placeholders})`
    )
    return id
  }

  async delete(store: string, id: string): Promise<void> {
    this._ensureConnected()
    await this._plugin!.execute(
      this._dbName,
      `DELETE FROM ${store} WHERE id = ?`
    )
  }

  async clear(store: string): Promise<void> {
    this._ensureConnected()
    await this._plugin!.execute(this._dbName, `DELETE FROM ${store}`)
  }

  async queryByIndex<T>(store: string, index: string, value: unknown): Promise<T[]> {
    this._ensureConnected()
    const result = await this._plugin!.query(
      this._dbName,
      `SELECT * FROM ${store} WHERE ${index} = ?`,
      [value !== null && value !== undefined ? String(value) : '']
    )
    return result.values as T[]
  }

  async query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]> {
    this._ensureConnected()
    const result = await this._plugin!.query(
      this._dbName,
      sql,
      (params ?? []).map((p) => (p === null || p === undefined ? '' : String(p)))
    )
    return result.values as T[]
  }

  async transaction<T = void>(fn: () => Promise<T>): Promise<T> {
    this._ensureConnected()
    await this._plugin!.execute(this._dbName, 'BEGIN TRANSACTION')
    try {
      const result = await fn()
      await this._plugin!.execute(this._dbName, 'COMMIT')
      return result
    } catch (err) {
      await this._plugin!.execute(this._dbName, 'ROLLBACK')
      throw err
    }
  }

  async execute(sql: string, params?: unknown[]): Promise<number> {
    this._ensureConnected()
    if (params && params.length > 0) {
      const result = await this._plugin!.run(
        this._dbName,
        sql,
        params.map((p) => (p === null || p === undefined ? '' : String(p)))
      )
      return result.changes.changes
    }
    const result = await this._plugin!.execute(this._dbName, sql)
    return result.changes.reduce((sum, c) => sum + c.changes, 0)
  }

  private _ensureConnected(): void {
    if (!this._connected || !this._plugin) {
      throw new Error('[CapacitorSQLiteAdapter] Not connected. Call connect() first.')
    }
  }
}
