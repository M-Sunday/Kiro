import { BaseRepository } from './BaseRepository.js'

export class NoteRepository extends BaseRepository {
  constructor() {
    super('notes')
  }

  async getByFolder(folderName) {
    return this.queryByIndex('folder', folderName)
  }

  async getRecent(limit = 20) {
    const all = await this.getAll()
    return all.sort((a, b) => (b.updated || 0) - (a.updated || 0)).slice(0, limit)
  }

  async getUnassigned() {
    const all = await this.getAll()
    return all.filter(n => !n.folder)
  }
}
