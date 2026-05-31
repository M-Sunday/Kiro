import { Api } from '../core/Api.js'

export class BookmarkService {
  constructor() {
    this.api = Api.getInstance()
    this.repo = this.api.getRepository('bookmarks')
    this.bus = this.api.bus
    this.state = this.api.state
    this._bindEvents()
  }

  _bindEvents() {
    this.bus.on('ui:bookmark:create', (e) => this.createBookmark(e.data))
    this.bus.on('ui:bookmark:delete', (e) => this.deleteBookmark(e.id))
    this.bus.on('ui:bookmark:blur', (e) => this.toggleBlur(e.id))
  }

  async createBookmark(data) {
    const bookmark = {
      ...data,
      id: data.id || Date.now(),
      added: data.added || Date.now(),
      blurred: data.blurred || false,
    }
    await this.repo.save(bookmark)
    this.state.setState(`bookmarks.${bookmark.id}`, bookmark)
    this.bus.emit('data:bookmark:created', { bookmark })
    return bookmark
  }

  async deleteBookmark(id) {
    await this.repo.delete(id)
    this.state.setState(`bookmarks.${id}`, null)
    this.bus.emit('data:bookmark:deleted', { id })
  }

  async toggleBlur(id) {
    const bookmark = await this.repo.getById(id)
    if (!bookmark) return
    bookmark.blurred = !bookmark.blurred
    await this.repo.save(bookmark)
    this.state.setState(`bookmarks.${id}.blurred`, bookmark.blurred)
    this.bus.emit('data:bookmark:blur-toggled', { id, blurred: bookmark.blurred })
    return bookmark.blurred
  }

  async getAllBookmarks() {
    return this.repo.getAll()
  }

  async getBookmark(id) {
    return this.repo.getById(id)
  }
}
