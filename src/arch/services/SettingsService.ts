import type { SettingsRepository } from '../../shared/types'
import { EventBus } from '../core/EventBus'
import { AppStateManager } from '../core/AppState'

export class SettingsService {
  private _repo: SettingsRepository
  private _bus: EventBus
  private _state: AppStateManager

  constructor(repo: SettingsRepository, bus: EventBus, state: AppStateManager) {
    this._repo = repo
    this._bus = bus
    this._state = state
    this._bindEvents()
  }

  private _bindEvents(): void {
    this._bus.on(
      'ui:settings:change',
      (payload: { key: string; value: unknown }) => {
        void this.set(payload.key, payload.value)
      }
    )
    this._bus.on('ui:settings:theme', (payload: { theme: string }) => {
      void this.setTheme(payload.theme)
    })
  }

  async get(key: string): Promise<unknown> {
    return this._repo.get(key)
  }

  async set(key: string, value: unknown): Promise<void> {
    await this._repo.set(key, value)
    this._state.set(`settings.${key}`, value)
    this._bus.emit('data:settings:changed', { key, value })
  }

  async getTheme(): Promise<string> {
    const theme = await this.get('theme')
    return (theme as string) || 'white'
  }

  async setTheme(theme: string): Promise<void> {
    await this.set('theme', theme)
    this._bus.emit('data:theme:changed', { theme })
  }

  async getAll(): Promise<Record<string, unknown>> {
    return this._repo.getAllSettings()
  }
}
