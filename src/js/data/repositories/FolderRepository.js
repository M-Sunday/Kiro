import { BaseRepository } from './BaseRepository.js'

export class FolderRepository extends BaseRepository {
  constructor() {
    super('folders')
  }

  async getByName(name) {
    return this.getById(name)
  }

  async create(name, options = {}) {
    return this.save({
      name,
      videoIds: options.videoIds || [],
      color: options.color || null,
      order: options.order || 0,
      created: Date.now(),
    })
  }

  async addVideo(folderName, videoId) {
    const folder = await this.getByName(folderName)
    if (!folder) return null
    if (!folder.videoIds.includes(videoId)) {
      folder.videoIds.push(videoId)
    }
    return this.save(folder)
  }

  async removeVideo(folderName, videoId) {
    const folder = await this.getByName(folderName)
    if (!folder) return null
    folder.videoIds = folder.videoIds.filter(id => id !== videoId)
    return this.save(folder)
  }

  async reorder(folderName, videoIds) {
    const folder = await this.getByName(folderName)
    if (!folder) return null
    folder.videoIds = videoIds
    return this.save(folder)
  }

  async getAllSorted() {
    const all = await this.getAll()
    return all.sort((a, b) => (a.order || 0) - (b.order || 0))
  }
}
