import { BaseRepository } from './BaseRepository.js'

export class BookmarkRepository extends BaseRepository {
  constructor() {
    super('bookmarks')
  }

  async getRecent(limit = 20) {
    const all = await this.getAll()
    return all.sort((a, b) => (b.added || 0) - (a.added || 0)).slice(0, limit)
  }

  async search(query) {
    const all = await this.getAll()
    const lower = query.toLowerCase()
    return all.filter(b =>
      (b.title && b.title.toLowerCase().includes(lower)) ||
      (b.url && b.url.toLowerCase().includes(lower))
    )
  }
}
