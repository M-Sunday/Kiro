import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { BrowserStorageAdapter } from '../adapters/BrowserStorageAdapter'

describe('BrowserStorageAdapter', () => {
  let adapter: BrowserStorageAdapter

  beforeEach(async () => {
    adapter = new BrowserStorageAdapter()
    await adapter.connect()
    // Clear all stores to avoid cross-test contamination
    for (const store of ['videos', 'notes', 'bookmarks', 'direct_access', 'external_files', 'settings', 'permissions', 'folders']) {
      try { await adapter.clear(store) } catch {}
    }
  })

  afterEach(async () => {
    await adapter.disconnect()
  })

  it('should connect and report connected', () => {
    expect(adapter.isConnected()).toBe(true)
  })

  it('should put and get an item', async () => {
    const item = { id: 'test1', title: 'Test Item', value: 42 }
    const id = await adapter.put('videos', item)
    expect(id).toBe('test1')

    const retrieved = await adapter.get<typeof item>('videos', 'test1')
    expect(retrieved).toBeDefined()
    expect(retrieved?.title).toBe('Test Item')
    expect(retrieved?.value).toBe(42)
  })

  it('should return null for missing items', async () => {
    const result = await adapter.get('videos', 'nonexistent')
    expect(result).toBeNull()
  })

  it('should get all items in a store', async () => {
    await adapter.put('videos', { id: 'a', title: 'A' })
    await adapter.put('videos', { id: 'b', title: 'B' })
    await adapter.put('videos', { id: 'c', title: 'C' })

    const all = await adapter.getAll('videos')
    expect(all).toHaveLength(3)
  })

  it('should delete an item', async () => {
    await adapter.put('notes', { id: 'del1', content: 'to delete' })
    await adapter.delete('notes', 'del1')

    const result = await adapter.get('notes', 'del1')
    expect(result).toBeNull()
  })

  it('should clear all items in a store', async () => {
    await adapter.put('bookmarks', { id: 'bm1', url: 'https://example.com' })
    await adapter.put('bookmarks', { id: 'bm2', url: 'https://example.org' })
    await adapter.clear('bookmarks')

    const all = await adapter.getAll('bookmarks')
    expect(all).toHaveLength(0)
  })

  it('should throw on query()', async () => {
    await expect(adapter.query('SELECT * FROM videos')).rejects.toThrow(
      'query() not supported'
    )
  })

  it('should throw on execute()', async () => {
    await expect(adapter.execute('DELETE FROM videos')).rejects.toThrow(
      'execute() not supported'
    )
  })

  it('should run transaction as passthrough', async () => {
    let executed = false
    await adapter.transaction(async () => {
      executed = true
    })
    expect(executed).toBe(true)
  })

  it('should handle disconnect and reconnect', async () => {
    await adapter.disconnect()
    expect(adapter.isConnected()).toBe(false)

    await adapter.connect()
    expect(adapter.isConnected()).toBe(true)
  })

  it('should query by index', async () => {
    await adapter.put('videos', { id: 'v1', title: 'Alpha', added: 100 })
    await adapter.put('videos', { id: 'v2', title: 'Beta', added: 200 })
    await adapter.put('videos', { id: 'v3', title: 'Gamma', added: 100 })

    const result = await adapter.queryByIndex('videos', 'added', 100)
    expect(result).toHaveLength(2)
  })
})
