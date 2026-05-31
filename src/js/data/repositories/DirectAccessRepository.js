import { BaseRepository } from './BaseRepository.js'

export class DirectAccessRepository extends BaseRepository {
  constructor() {
    super('directAccess')
  }

  async getRecent(limit = 20) {
    const all = await this.getAll()
    return all.sort((a, b) => (b.added || 0) - (a.added || 0)).slice(0, limit)
  }
}
