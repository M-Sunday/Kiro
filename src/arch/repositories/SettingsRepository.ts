import type { SettingsRepository, StorageAdapter } from '../../shared/types'

export class SettingsRepo implements SettingsRepository {
  private _db: StorageAdapter
  private readonly _store = 'settings'

  constructor(db: StorageAdapter) {
    this._db = db
  }

  async get(key: string): Promise<unknown> {
    const entry = await this._db.get<{ name: string; value: unknown }>(
      this._store,
      key
    )
    return entry?.value ?? null
  }

  async set(key: string, value: unknown): Promise<void> {
    await this._db.put(this._store, { name: key, value })
  }

  async getAllSettings(): Promise<Record<string, unknown>> {
    const entries = await this._db.getAll<{ name: string; value: unknown }>(
      this._store
    )
    const result: Record<string, unknown> = {}
    for (const entry of entries) {
      result[entry.name] = entry.value
    }
    return result
  }
}
