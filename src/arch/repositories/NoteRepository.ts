import type { Note, NoteRepository, StorageAdapter } from '../../shared/types'

export class NoteRepo implements NoteRepository {
  private _db: StorageAdapter
  private readonly _store = 'notes'

  constructor(db: StorageAdapter) {
    this._db = db
  }

  async getById(id: string): Promise<Note | null> {
    return this._db.get<Note>(this._store, id)
  }

  async getAll(): Promise<Note[]> {
    return this._db.getAll<Note>(this._store)
  }

  async save(note: Note): Promise<string> {
    return this._db.put(this._store, note)
  }

  async delete(id: string): Promise<void> {
    return this._db.delete(this._store, id)
  }

  async getByFolder(folder: string): Promise<Note[]> {
    return this._db.queryByIndex<Note>(this._store, 'folder', folder)
  }
}
