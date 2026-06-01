const DB_NAME = 'KiroDB'
const DB_VERSION = 1

const STORES = {
  videos: { keyPath: 'videoId' },
  folders: { keyPath: 'name' },
  folderMeta: { keyPath: 'name' },
  notes: { keyPath: 'id', autoIncrement: true },
  bookmarks: { keyPath: 'id', autoIncrement: true },
  directAccess: { keyPath: 'id', autoIncrement: true },
  settings: { keyPath: 'name' },
  metadata: { keyPath: 'name' },
  linkHistory: { keyPath: 'id', autoIncrement: true },
}

const INDEXES = {
  videos: [
    { name: 'folder', key: 'folder' },
    { name: 'added', key: 'added' },
    { name: 'title', key: 'title' },
  ],
  notes: [
    { name: 'folder', key: 'folder' },
    { name: 'updated', key: 'updated' },
    { name: 'created', key: 'created' },
  ],
  bookmarks: [
    { name: 'added', key: 'added' },
  ],
  directAccess: [
    { name: 'added', key: 'added' },
  ],
  linkHistory: [
    { name: 'added', key: 'added' },
  ],
}

let _db = null
let _connectionPromise = null

function openDB() {
  if (_db) return Promise.resolve(_db)
  if (_connectionPromise) return _connectionPromise

  _connectionPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = event.target.result

      for (const [storeName, config] of Object.entries(STORES)) {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, config)
          const idxConfig = INDEXES[storeName]
          if (idxConfig) {
            for (const idx of idxConfig) {
              store.createIndex(idx.name, idx.key, { unique: false })
            }
          }
        }
      }
    }

    request.onsuccess = (event) => {
      _db = event.target.result

      _db.onversionchange = () => {
        _db.close()
        _db = null
        _connectionPromise = null
      }

      _db.onerror = (event) => {
        console.error('[DB] Database error:', event.target.error)
      }

      resolve(_db)
    }

    request.onerror = (event) => {
      _connectionPromise = null
      console.error('[DB] Failed to open database:', event.target.error)
      reject(event.target.error)
    }
  })

  return _connectionPromise
}

function getStore(storeName, mode = 'readonly') {
  return openDB().then((db) => {
    const transaction = db.transaction(storeName, mode)
    return transaction.objectStore(storeName)
  })
}

async function getAll(storeName) {
  const store = await getStore(storeName)
  return new Promise((resolve, reject) => {
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function getById(storeName, id) {
  const store = await getStore(storeName)
  return new Promise((resolve, reject) => {
    const request = store.get(id)
    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

async function save(storeName, record) {
  const store = await getStore(storeName, 'readwrite')
  return new Promise((resolve, reject) => {
    const request = store.put(record)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function saveAll(storeName, records) {
  if (!records || records.length === 0) return []
  const store = await getStore(storeName, 'readwrite')
  return new Promise((resolve, reject) => {
    const results = []
    for (const record of records) {
      const request = store.put(record)
      request.onsuccess = () => results.push(request.result)
    }
    const tx = store.transaction
    tx.oncomplete = () => resolve(results)
    tx.onerror = () => reject(tx.error)
  })
}

async function remove(storeName, id) {
  const store = await getStore(storeName, 'readwrite')
  return new Promise((resolve, reject) => {
    const request = store.delete(id)
    request.onsuccess = () => resolve(true)
    request.onerror = () => reject(request.error)
  })
}

async function clear(storeName) {
  const store = await getStore(storeName, 'readwrite')
  return new Promise((resolve, reject) => {
    const request = store.clear()
    request.onsuccess = () => resolve(true)
    request.onerror = () => reject(request.error)
  })
}

async function count(storeName) {
  const store = await getStore(storeName)
  return new Promise((resolve, reject) => {
    const request = store.count()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function queryByIndex(storeName, indexName, value) {
  const store = await getStore(storeName)
  return new Promise((resolve, reject) => {
    const index = store.index(indexName)
    const request = index.getAll(value)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function getByIndex(storeName, indexName, value) {
  const store = await getStore(storeName)
  return new Promise((resolve, reject) => {
    const index = store.index(indexName)
    const request = index.get(value)
    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

async function getStorageInfo() {
  const info = {}
  for (const storeName of Object.keys(STORES)) {
    try {
      const c = await count(storeName)
      info[storeName] = c
    } catch {
      info[storeName] = 0
    }
  }
  return info
}

export const db = {
  open: openDB,
  getAll,
  getById,
  save,
  saveAll,
  remove,
  clear,
  count,
  queryByIndex,
  getByIndex,
  getStorageInfo,
  getStoreNames: () => Object.keys(STORES),
}
