import { Api } from '../core/Api.js'

export class FolderService {
  constructor() {
    this.api = Api.getInstance()
    this.repo = this.api.getRepository('folders')
    this.videoRepo = this.api.getRepository('videos')
    this.bus = this.api.bus
    this.state = this.api.state
    this._bindEvents()
  }

  _bindEvents() {
    this.bus.on('ui:folder:create', (e) => this.createFolder(e.name, e.options))
    this.bus.on('ui:folder:rename', (e) => this.renameFolder(e.oldName, e.newName))
    this.bus.on('ui:folder:delete', (e) => this.deleteFolder(e.name))
    this.bus.on('ui:folder:reorder', (e) => this.reorderFolder(e.name, e.videoIds))
    this.bus.on('ui:folder:set-color', (e) => this.setColor(e.name, e.color))
  }

  async createFolder(name, options = {}) {
    const folder = await this.repo.create(name, options)
    this.state.setState(`folders.${name}`, folder)
    this.bus.emit('data:folder:created', { name, folder })
    return folder
  }

  async renameFolder(oldName, newName) {
    const folder = await this.repo.getByName(oldName)
    if (!folder) return

    const videos = await this.videoRepo.getByFolder(oldName)
    for (const video of videos) {
      video.folder = newName
      await this.videoRepo.save(video)
    }

    await this.repo.delete(oldName)
    folder.name = newName
    await this.repo.save(folder)

    this.state.setState(`folders.${newName}`, folder)
    this.state.setState(`folders.${oldName}`, null)
    this.bus.emit('data:folder:renamed', { oldName, newName })
  }

  async deleteFolder(name) {
    if (name === 'Videos' || name === 'Archived') return

    const videos = await this.videoRepo.getByFolder(name)
    for (const video of videos) {
      video.folder = null
      await this.videoRepo.save(video)
    }

    await this.repo.delete(name)
    this.state.setState(`folders.${name}`, null)
    this.bus.emit('data:folder:deleted', { name })
  }

  async reorderFolder(name, videoIds) {
    await this.repo.reorder(name, videoIds)
    this.bus.emit('data:folder:reordered', { name, videoIds })
  }

  async setColor(name, color) {
    const folder = await this.repo.getByName(name)
    if (!folder) return
    folder.color = color
    await this.repo.save(folder)
    this.state.setState(`folders.${name}.color`, color)
    this.bus.emit('data:folder:color-changed', { name, color })
  }

  async getAllFolders() {
    return this.repo.getAllSorted()
  }

  async getFolder(name) {
    return this.repo.getByName(name)
  }
}
