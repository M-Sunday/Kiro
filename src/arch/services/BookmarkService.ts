import type { Bookmark, Repository } from '../../shared/types'
import { EventBus } from '../core/EventBus'
import { AppStateManager } from '../core/AppState'

export class BookmarkService {
  private _repo: Repository<Bookmark>
  private _bus: EventBus
  private _state: AppStateManager

  constructor(
    repo: Repository<Bookmark>,
    bus: EventBus,
    state: AppStateManager
  ) {
    this._repo = repo
    this._bus = bus
    this._state = state
  }

  async getAll(): Promise<Bookmark[]> {
    return this._repo.getAll()
  }

  async getById(id: string): Promise<Bookmark | null> {
    return this._repo.getById(id)
  }

  async create(data: Partial<Bookmark>): Promise<Bookmark> {
    const bookmark: Bookmark = {
      id: data.id ?? '_bm_' + Date.now(),
      url: data.url ?? '',
      title: data.title ?? '',
      image: data.image,
      added: data.added ?? Date.now(),
      blurred: data.blurred ?? false,
    }
    await this._repo.save(bookmark)
    this._state.set(`bookmarks.${bookmark.id}`, bookmark)
    this._bus.emit('data:bookmark:created', { bookmark })
    return bookmark
  }

  async update(
    id: string,
    changes: Partial<Bookmark>
  ): Promise<Bookmark | undefined> {
    const bookmark = await this._repo.getById(id)
    if (!bookmark) return
    const updated = { ...bookmark, ...changes }
    await this._repo.save(updated)
    this._state.set(`bookmarks.${id}`, updated)
    this._bus.emit('data:bookmark:updated', { id, changes })
    return updated
  }

  async delete(id: string): Promise<void> {
    await this._repo.delete(id)
    this._state.set(`bookmarks.${id}`, undefined)
    this._bus.emit('data:bookmark:deleted', { id })
  }

  async toggleBlur(id: string): Promise<boolean | undefined> {
    const bookmark = await this._repo.getById(id)
    if (!bookmark) return
    bookmark.blurred = !bookmark.blurred
    await this._repo.save(bookmark)
    this._state.set(`bookmarks.${id}.blurred`, bookmark.blurred)
    return bookmark.blurred
  }
}
