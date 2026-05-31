import { BaseRepository } from './BaseRepository.js'

export class VideoRepository extends BaseRepository {
  constructor() {
    super('videos')
  }

  async getByFolder(folderName) {
    return this.queryByIndex('folder', folderName)
  }

  async getByAddedRange(since) {
    const all = await this.getAll()
    return all.filter(v => v.added && v.added >= since)
      .sort((a, b) => (b.added || 0) - (a.added || 0))
  }

  async search(query) {
    const all = await this.getAll()
    const lower = query.toLowerCase()
    return all.filter(v =>
      (v.title && v.title.toLowerCase().includes(lower)) ||
      (v.channel && v.channel.toLowerCase().includes(lower))
    )
  }

  async bulkSave(videos) {
    return this.saveAll(videos)
  }
}
