import type { StorageAdapter } from '../../../shared/types'

const DB_NAME = 'KiroBrowserDB'
const DB_VERSION = 1

const STORES = [
  'videos', 'notes', 'folders', 'bookmarks',
  'direct_access', 'external_files', 'settings', 'permissions',
] as const

interface IndexConfig {
  name: string
  key: string
}

const INDEXES: Record<string, IndexConfig[]> = {
  videos: [
    { name: 'folder_id', key: 'folder_id' },
    { name: 'added', key: 'added' },
    { name: 'title', key: 'title' },
  ],
  notes: [
    { name: 'folder_id', key: 'folder_id' },
    { name: 'updated', key: 'updated' },
  ],
  bookmarks: [{ name: 'added', key: 'added' }],
  direct_access: [{ name: 'added', key: 'added' }],
  external_files: [{ name: 'added', key: 'added' }],
}

export class BrowserStorageAdapter implements StorageAdapter {
  private _db: IDBDatabase | null = null
  private _connectPromise: Promise<IDBDatabase> | null = null

  async connect(): Promise<void> {
    await this._getDb()
  }

  async disconnect(): Promise<void> {
    this._db?.close()
    this._db = null
    this._connectPromise = null
  }

  isConnected(): boolean {
    return this._db !== null
  }

  async get<T>(store: string, id: string): Promise<T | null> {
    const db = await this._getDb()
    const tx = db.transaction(store, 'readonly')
    const os = tx.objectStore(store)
    return new Promise((resolve, reject) => {
      const req = os.get(id)
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror = () => reject(req.error)
    })
  }

  async getAll<T>(store: string): Promise<T[]> {
    const db = await this._getDb()
    const tx = db.transaction(store, 'readonly')
    const os = tx.objectStore(store)
    return new Promise((resolve, reject) => {
      const req = os.getAll()
      req.onsuccess = () => resolve(req.result as T[])
      req.onerror = () => reject(req.error)
    })
  }

  async put<T>(store: string, item: T): Promise<string> {
    const db = await this._getDb()
    const tx = db.transaction(store, 'readwrite')
    const os = tx.objectStore(store)
    return new Promise((resolve, reject) => {
      const req = os.put(item)
      req.onsuccess = () => resolve(String(req.result))
      req.onerror = () => reject(req.error)
    })
  }

  async delete(store: string, id: string): Promise<void> {
    const db = await this._getDb()
    const tx = db.transaction(store, 'readwrite')
    const os = tx.objectStore(store)
    return new Promise((resolve, reject) => {
      const req = os.delete(id)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  }

  async clear(store: string): Promise<void> {
    const db = await this._getDb()
    const tx = db.transaction(store, 'readwrite')
    const os = tx.objectStore(store)
    return new Promise((resolve, reject) => {
      const req = os.clear()
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  }

  async queryByIndex<T>(store: string, index: string, value: unknown): Promise<T[]> {
    const db = await this._getDb()
    const tx = db.transaction(store, 'readonly')
    const os = tx.objectStore(store)
    const idx = os.index(index)
    return new Promise((resolve, reject) => {
      const req = idx.getAll(value as IDBValidKey)
      req.onsuccess = () => resolve(req.result as T[])
      req.onerror = () => reject(req.error)
    })
  }

  async query<T = Record<string, unknown>>(_sql: string, _params?: unknown[]): Promise<T[]> {
    throw new Error('[BrowserStorageAdapter] query() not supported — use SQLite adapter for SQL queries')
  }

  async transaction<T = void>(fn: () => Promise<T>): Promise<T> {
    return fn()
  }

  async execute(_sql: string, _params?: unknown[]): Promise<number> {
    throw new Error('[BrowserStorageAdapter] execute() not supported — use SQLite adapter for SQL writes')
  }

  private async _getDb(): Promise<IDBDatabase> {
    if (this._db) return this._db
    if (this._connectPromise) return this._connectPromise

    this._connectPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION)

      req.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        for (const storeName of STORES) {
          if (!db.objectStoreNames.contains(storeName)) {
            const keyPath = storeName === 'settings' ? 'key' : 'id'
            const store = db.createObjectStore(storeName, { keyPath })
            const idxConfig = INDEXES[storeName]
            if (idxConfig) {
              for (const idx of idxConfig) {
                store.createIndex(idx.name, idx.key, { unique: false })
              }
            }
          }
        }
      }

      req.onsuccess = (event) => {
        this._db = (event.target as IDBOpenDBRequest).result
        this._db.onversionchange = () => {
          this._db?.close()
          this._db = null
          this._connectPromise = null
        }
        resolve(this._db!)
      }

      req.onerror = () => {
        this._connectPromise = null
        reject(req.error)
      }
    })

    return this._connectPromise
  }
}
