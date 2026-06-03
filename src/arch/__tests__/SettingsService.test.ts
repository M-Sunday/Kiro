import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EventBus } from '../core/EventBus'
import { AppStateManager } from '../core/AppState'
import { SettingsService } from '../services/SettingsService'
import type { SettingsRepository } from '../../shared/types'

class MockSettingsRepo implements SettingsRepository {
  private _data = new Map<string, unknown>()

  async get(key: string): Promise<unknown> {
    return this._data.get(key) ?? null
  }

  async set(key: string, value: unknown): Promise<void> {
    this._data.set(key, value)
  }

  async getAllSettings(): Promise<Record<string, unknown>> {
    const result: Record<string, unknown> = {}
    for (const [key, value] of this._data) {
      result[key] = value
    }
    return result
  }
}

describe('SettingsService', () => {
  let bus: EventBus
  let state: AppStateManager
  let repo: MockSettingsRepo
  let service: SettingsService

  beforeEach(() => {
    bus = new EventBus()
    state = new AppStateManager(bus)
    repo = new MockSettingsRepo()
    service = new SettingsService(repo, bus, state)
  })

  it('should set and get settings', async () => {
    await service.set('theme', 'black')
    const theme = await service.get('theme')
    expect(theme).toBe('black')
  })

  it('should get default theme', async () => {
    const theme = await service.getTheme()
    expect(theme).toBe('white')
  })

  it('should set theme', async () => {
    await service.setTheme('black')
    const theme = await service.getTheme()
    expect(theme).toBe('black')
  })

  it('should get all settings', async () => {
    await service.set('theme', 'dark')
    await service.set('lang', 'en')
    const all = await service.getAll()
    expect(all['theme']).toBe('dark')
    expect(all['lang']).toBe('en')
  })

  it('should handle settings via event', async () => {
    bus.emit('ui:settings:change', { key: 'theme', value: 'black' })

    await vi.waitFor(async () => {
      const theme = await service.get('theme')
      expect(theme).toBe('black')
    })
  })
})
