import type { Folder, FolderRepository, StorageAdapter } from '../../shared/types'

export class FolderRepo implements FolderRepository {
  private _db: StorageAdapter
  private readonly _store = 'folders'
  private readonly _metaStore = 'folderMeta'

  constructor(db: StorageAdapter) {
    this._db = db
  }

  async create(name: string, options?: { color?: string }): Promise<Folder> {
    const folder: Folder = { name, videoIds: [], color: options?.color }
    await this._db.put(this._store, folder)
    if (options?.color) {
      await this._db.put(this._metaStore, { name, color: options.color })
    }
    return folder
  }

  async getByName(name: string): Promise<Folder | null> {
    return this._db.get<Folder>(this._store, name)
  }

  async getAllSorted(): Promise<Folder[]> {
    return this._db.getAll<Folder>(this._store)
  }

  async save(folder: Folder): Promise<string> {
    return this._db.put(this._store, folder)
  }

  async delete(name: string): Promise<void> {
    await this._db.delete(this._store, name)
    await this._db.delete(this._metaStore, name)
  }

  async reorder(name: string, videoIds: string[]): Promise<void> {
    const folder = await this.getByName(name)
    if (folder) {
      folder.videoIds = videoIds
      await this.save(folder)
    }
  }

  async addVideo(name: string, videoId: string): Promise<void> {
    const folder = await this.getByName(name)
    if (folder && !folder.videoIds.includes(videoId)) {
      folder.videoIds.push(videoId)
      await this.save(folder)
    }
  }

  async removeVideo(name: string, videoId: string): Promise<void> {
    const folder = await this.getByName(name)
    if (folder) {
      folder.videoIds = folder.videoIds.filter((id) => id !== videoId)
      await this.save(folder)
    }
  }
}
