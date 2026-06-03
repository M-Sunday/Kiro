import type { DirectAccess, Repository, StorageAdapter } from '../../shared/types'

export class DirectAccessRepo implements Repository<DirectAccess> {
  private _db: StorageAdapter
  private readonly _store = 'directAccess'

  constructor(db: StorageAdapter) {
    this._db = db
  }

  async getById(id: string): Promise<DirectAccess | null> {
    return this._db.get<DirectAccess>(this._store, id)
  }

  async getAll(): Promise<DirectAccess[]> {
    return this._db.getAll<DirectAccess>(this._store)
  }

  async save(item: DirectAccess): Promise<string> {
    return this._db.put(this._store, item)
  }

  async delete(id: string): Promise<void> {
    return this._db.delete(this._store, id)
  }
}
