import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { StorageAdapter, Video, Note, Folder, Bookmark, DirectAccess } from '../../../shared/types'
import { LegacyMigrator } from '../LegacyMigrator'

class MockSourceAdapter implements StorageAdapter {
  private _data: Record<string, Record<string, unknown>> = {
    videos: {},
    folders: {},
    folderMeta: {},
    notes: {},
    bookmarks: {},
    directAccess: {},
    settings: {},
  }

  connect = vi.fn()
  disconnect = vi.fn()
  isConnected = () => true

  setData(store: string, items: unknown[]): void {
    const table: Record<string, unknown> = {}
    for (const item of items) {
      const key = String((item as Record<string, unknown>)['id'] ?? (item as Record<string, unknown>)['name'] ?? '')
      table[key] = item
    }
    this._data[store] = table
  }

  async get<T>(store: string, id: string): Promise<T | null> {
    return (this._data[store]?.[id] as T) ?? null
  }

  async getAll<T>(store: string): Promise<T[]> {
    return Object.values(this._data[store] ?? {}) as T[]
  }

  async put<T>(store: string, item: T): Promise<string> { return '' }
  async delete(store: string, id: string): Promise<void> {}
  async clear(store: string): Promise<void> {}
  async queryByIndex<T>(store: string, index: string, value: unknown): Promise<T[]> { return [] }
  async query<T>(sql: string, params?: unknown[]): Promise<T[]> { return [] }
  async transaction<T>(fn: () => Promise<T>): Promise<T> { return fn() }
  async execute(sql: string, params?: unknown[]): Promise<number> { return 0 }
}

class MockTargetAdapter implements StorageAdapter {
  public written: Record<string, unknown[]> = {}

  connect = vi.fn()
  disconnect = vi.fn()
  isConnected = () => true
  async get<T>(store: string, id: string): Promise<T | null> { return null }
  async getAll<T>(store: string): Promise<T[]> { return [] }

  async put<T>(store: string, item: T): Promise<string> {
    if (!this.written[store]) this.written[store] = []
    this.written[store].push(item as unknown as Record<string, unknown>)
    return String((item as Record<string, unknown>)['id'] ?? '')
  }

  async delete(store: string, id: string): Promise<void> {}
  async clear(store: string): Promise<void> {}
  async queryByIndex<T>(store: string, index: string, value: unknown): Promise<T[]> { return [] }
  async query<T>(sql: string, params?: unknown[]): Promise<T[]> { return [] }
  async transaction<T>(fn: () => Promise<T>): Promise<T> { return fn() }
  async execute(sql: string, params?: unknown[]): Promise<number> { return 0 }
}

describe('LegacyMigrator', () => {
  let source: MockSourceAdapter
  let target: MockTargetAdapter
  let migrator: LegacyMigrator

  beforeEach(() => {
    source = new MockSourceAdapter()
    target = new MockTargetAdapter()
    migrator = new LegacyMigrator(source, target)
  })

  it('should migrate empty data', async () => {
    const result = await migrator.migrate()
    expect(result.success).toBe(true)
    expect(result.counts['videos']).toBe(0)
    expect(result.counts['notes']).toBe(0)
    expect(result.counts['folders']).toBe(0)
  })

  it('should migrate videos with folder_id', async () => {
    source.setData('folders', [
      { name: 'My Folder', videoIds: ['v1'], color: 'blue' },
    ])
    source.setData('videos', [
      { videoId: 'v1', title: 'Test', channel: 'Chan', duration: '1:00', thumbnail: '', url: '', added: 100, blurred: false, archived: false },
    ])

    const result = await migrator.migrate()
    expect(result.success).toBe(true)
    expect(result.counts['videos']).toBe(1)
    expect(result.counts['folders']).toBe(1)

    const videoEntries = target.written['videos'] ?? []
    expect(videoEntries).toHaveLength(1)
    const v = videoEntries[0] as Record<string, unknown>
    expect(v['folder_id']).toBe('My Folder')
  })

  it('should migrate notes', async () => {
    source.setData('notes', [
      { id: 'n1', title: 'Note', content: 'Hello', folder: null, todos: [], added: 100, updated: 100 },
    ])

    const result = await migrator.migrate()
    expect(result.success).toBe(true)
    expect(result.counts['notes']).toBe(1)

    const noteEntries = target.written['notes'] ?? []
    expect(noteEntries).toHaveLength(1)
  })

  it('should migrate bookmarks', async () => {
    source.setData('bookmarks', [
      { id: 'bm1', url: 'https://example.com', title: 'Example', added: 100, blurred: false },
    ])

    const result = await migrator.migrate()
    expect(result.success).toBe(true)
    expect(result.counts['bookmarks']).toBe(1)
  })

  it('should report error on failure', async () => {
    source.getAll = vi.fn().mockRejectedValue(new Error('DB error'))
    const result = await migrator.migrate()
    expect(result.success).toBe(false)
    expect(result.error).toContain('DB error')
  })

  it('should migrate settings', async () => {
    source.setData('settings', [
      { name: 'pins', value: ['v1', 'v2'] },
      { name: 'nsfw', value: ['v3'] },
      { name: 'blurAllNSFW', value: true },
      { name: 'collapsed', value: { folder1: true } },
    ])

    await migrator.migrate()

    const settingsEntries = target.written['settings'] ?? []
    const keys = settingsEntries.map((s: unknown) => (s as Record<string, unknown>)['key'])
    expect(keys).toContain('pins')
    expect(keys).toContain('nsfw')
    expect(keys).toContain('blurAllNSFW')
    expect(keys).toContain('collapsed')
  })
})
