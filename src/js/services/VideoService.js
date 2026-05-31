import { Api } from '../core/Api.js'

export class VideoService {
  constructor() {
    this.api = Api.getInstance()
    this.repo = this.api.getRepository('videos')
    this.folderRepo = this.api.getRepository('folders')
    this.bus = this.api.bus
    this.state = this.api.state
    this._bindEvents()
  }

  _bindEvents() {
    this.bus.on('ui:video:create', (e) => this.createVideo(e.data))
    this.bus.on('ui:video:delete', (e) => this.deleteVideo(e.id, e.folder))
    this.bus.on('ui:video:move', (e) => this.moveVideo(e.id, e.from, e.to))
    this.bus.on('ui:video:pin', (e) => this.togglePin(e.id))
    this.bus.on('ui:video:archive', (e) => this.toggleArchive(e.id))
    this.bus.on('ui:video:blur', (e) => this.toggleBlur(e.id))
  }

  async createVideo(data) {
    const video = {
      ...data,
      added: data.added || Date.now(),
      blurred: data.blurred || false,
      archived: data.archived || false,
    }
    const id = await this.repo.save(video)
    this.state.setState(`videos.${video.videoId}`, video)
    this.bus.emit('data:video:created', { video })
    return video
  }

  async deleteVideo(videoId, folderName) {
    const video = await this.repo.getById(videoId)
    if (!video) return
    await this.repo.delete(videoId)
    if (folderName) {
      await this.folderRepo.removeVideo(folderName, videoId)
    }
    this.state.setState(`videos.${videoId}`, null)
    this.bus.emit('data:video:deleted', { videoId })
  }

  async moveVideo(videoId, fromFolder, toFolder) {
    if (fromFolder) await this.folderRepo.removeVideo(fromFolder, videoId)
    if (toFolder) await this.folderRepo.addVideo(toFolder, videoId)
    this.bus.emit('data:video:moved', { videoId, fromFolder, toFolder })
  }

  async togglePin(videoId) {
    const current = this.state.getState('pins') || []
    const exists = current.includes(videoId)
    const pins = exists ? current.filter(id => id !== videoId) : [...current, videoId]
    this.state.setState('pins', pins)
    this.bus.emit('data:video:pin-toggled', { videoId, pinned: !exists })
    return !exists
  }

  async toggleArchive(videoId) {
    const video = await this.repo.getById(videoId)
    if (!video) return
    video.archived = !video.archived
    await this.repo.save(video)
    this.state.setState(`videos.${videoId}.archived`, video.archived)
    this.bus.emit('data:video:archive-toggled', { videoId, archived: video.archived })
    return video.archived
  }

  async toggleBlur(videoId) {
    const video = await this.repo.getById(videoId)
    if (!video) return
    video.blurred = !video.blurred
    await this.repo.save(video)
    this.state.setState(`videos.${videoId}.blurred`, video.blurred)
    this.bus.emit('data:video:blur-toggled', { videoId, blurred: video.blurred })
    return video.blurred
  }

  async getVideo(videoId) {
    return this.repo.getById(videoId)
  }

  async getAllVideos() {
    return this.repo.getAll()
  }

  async searchVideos(query) {
    return this.repo.search(query)
  }
}
