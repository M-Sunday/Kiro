import type { Bookmark, Repository, StorageAdapter } from '../../shared/types'

export class BookmarkRepo implements Repository<Bookmark> {
  private _db: StorageAdapter
  private readonly _store = 'bookmarks'

  constructor(db: StorageAdapter) {
    this._db = db
  }

  async getById(id: string): Promise<Bookmark | null> {
    return this._db.get<Bookmark>(this._store, id)
  }

  async getAll(): Promise<Bookmark[]> {
    return this._db.getAll<Bookmark>(this._store)
  }

  async save(bookmark: Bookmark): Promise<string> {
    return this._db.put(this._store, bookmark)
  }

  async delete(id: string): Promise<void> {
    return this._db.delete(this._store, id)
  }
}
