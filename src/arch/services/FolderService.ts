import type { FolderRepository, Folder } from '../../shared/types'
import { EventBus } from '../core/EventBus'
import { AppStateManager } from '../core/AppState'

export class FolderService {
  private _repo: FolderRepository
  private _bus: EventBus
  private _state: AppStateManager

  constructor(repo: FolderRepository, bus: EventBus, state: AppStateManager) {
    this._repo = repo
    this._bus = bus
    this._state = state
    this._bindEvents()
  }

  private _bindEvents(): void {
    this._bus.on(
      'ui:folder:create',
      (payload: { name: string; options?: { color?: string } }) => {
        void this.createFolder(payload.name, payload.options)
      }
    )
    this._bus.on(
      'ui:folder:rename',
      (payload: { oldName: string; newName: string }) => {
        void this.renameFolder(payload.oldName, payload.newName)
      }
    )
    this._bus.on('ui:folder:delete', (payload: { name: string }) => {
      void this.deleteFolder(payload.name)
    })
    this._bus.on(
      'ui:folder:reorder',
      (payload: { name: string; videoIds: string[] }) => {
        void this.reorderFolder(payload.name, payload.videoIds)
      }
    )
    this._bus.on(
      'ui:folder:set-color',
      (payload: { name: string; color: string }) => {
        void this.setColor(payload.name, payload.color)
      }
    )
  }

  async createFolder(
    name: string,
    options?: { color?: string }
  ): Promise<Folder> {
    const folder = await this._repo.create(name, options)
    this._state.set(`folders.${name}`, folder)
    this._bus.emit('data:folder:created', { name })
    return folder
  }

  async renameFolder(oldName: string, newName: string): Promise<void> {
    const folder = await this._repo.getByName(oldName)
    if (!folder) return

    await this._repo.delete(oldName)
    folder.name = newName
    await this._repo.save(folder)

    this._state.set(`folders.${newName}`, folder)
    this._state.set(`folders.${oldName}`, undefined)
    this._bus.emit('data:folder:renamed', { oldName, newName })
  }

  async deleteFolder(name: string): Promise<void> {
    if (name === 'Videos' || name === 'Archived') return
    await this._repo.delete(name)
    this._state.set(`folders.${name}`, undefined)
    this._bus.emit('data:folder:deleted', { name })
  }

  async reorderFolder(name: string, videoIds: string[]): Promise<void> {
    await this._repo.reorder(name, videoIds)
    this._bus.emit('data:folder:reordered', { name, videoIds })
  }

  async setColor(name: string, color: string): Promise<void> {
    const folder = await this._repo.getByName(name)
    if (!folder) return
    folder.color = color
    await this._repo.save(folder)
    this._state.set(`folders.${name}.color`, color)
    this._bus.emit('data:folder:color-changed', { name, color })
  }

  async getAllFolders(): Promise<Folder[]> {
    return this._repo.getAllSorted()
  }

  async getFolder(name: string): Promise<Folder | null> {
    return this._repo.getByName(name)
  }
}
