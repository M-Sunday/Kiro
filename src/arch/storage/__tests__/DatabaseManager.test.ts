import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DatabaseManager } from '../DatabaseManager'

describe('DatabaseManager', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should detect platform as browser in test environment', () => {
    const manager = new DatabaseManager({ autoMigrate: false })
    expect(manager.platform).toBe('browser')
  })

  it('should create adapter on connect', async () => {
    const manager = new DatabaseManager({ autoMigrate: false })
    const adapter = await manager.connect()
    expect(adapter).toBeDefined()
    expect(adapter.isConnected()).toBe(true)
    expect(manager.adapter).toBe(adapter)
  })

  it('should run migrations when autoMigrate is true', async () => {
    const manager = new DatabaseManager({ autoMigrate: true })
    const adapter = await manager.connect()
    expect(adapter.isConnected()).toBe(true)
  })

  it('should disconnect and clear adapter', async () => {
    const manager = new DatabaseManager({ autoMigrate: false })
    await manager.connect()
    expect(manager.adapter.isConnected()).toBe(true)

    await manager.disconnect()
    expect(() => manager.adapter).toThrow('Not initialized')
  })

  it('should return config', () => {
    const manager = new DatabaseManager({ platform: 'browser', autoMigrate: false })
    const cfg = manager.config
    expect(cfg.platform).toBe('browser')
    expect(cfg.autoMigrate).toBe(false)
  })

  it('should expose migrationRunner after connect', async () => {
    const manager = new DatabaseManager({ autoMigrate: false })
    await manager.connect()
    expect(manager.migrationRunner).toBeDefined()
  })

  it('should throw if accessing adapter before connect', () => {
    const manager = new DatabaseManager({ autoMigrate: false })
    expect(() => manager.adapter).toThrow('Not initialized')
  })
})
