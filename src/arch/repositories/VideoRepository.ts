import type { Video, VideoRepository, StorageAdapter } from '../../shared/types'

export class VideoRepo implements VideoRepository {
  private _db: StorageAdapter
  private readonly _store = 'videos'

  constructor(db: StorageAdapter) {
    this._db = db
  }

  async getById(id: string): Promise<Video | null> {
    return this._db.get<Video>(this._store, id)
  }

  async getAll(): Promise<Video[]> {
    return this._db.getAll<Video>(this._store)
  }

  async save(video: Video): Promise<string> {
    return this._db.put(this._store, video)
  }

  async delete(id: string): Promise<void> {
    return this._db.delete(this._store, id)
  }

  async getByFolder(folder: string): Promise<Video[]> {
    return this._db.queryByIndex<Video>(this._store, 'folder', folder)
  }

  async search(query: string): Promise<Video[]> {
    const all = await this.getAll()
    const q = query.toLowerCase()
    return all.filter(
      (v) =>
        v.title.toLowerCase().includes(q) ||
        v.channel.toLowerCase().includes(q)
    )
  }
}
