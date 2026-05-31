import { db } from './db.js'

const LS_TO_STORE_MAP = {
  kiroVideos: 'videos',
  kiroFolders: 'folders',
  kiroFolderMeta: 'folderMeta',
  kiroNotes: 'notes',
  kiroBookmarks: 'bookmarks',
  kiroDirectAccess: 'directAccess',
  kiro_challenges: 'challenges',
  kiro_goals: 'goals',
  kiro_achievements: 'achievements',
  linkHistory: 'linkHistory',
}

const SETTINGS_KEYS = [
  'kiroNSFW', 'kiroBlurAllNSFW', 'kiroCollapsed', 'kiroSettings',
]

const METADATA_KEYS = [
  'kiroUserName', 'kiroLastVersion', 'kiroSwVersion',
  'kiroInstalledAt', 'kiroLastOpenedAt', 'kiroEulaAccepted',
  'theme', 'dlType', 'dlVideoQuality', 'dlVideoCodec',
  'dlAudioFormat', 'dlAudioBitrate',
]

export class MigrationEngine {
  constructor(eventBus) {
    this.bus = eventBus
    this._migrated = false
  }

  async needsMigration() {
    const hasLocalStorageData = Object.keys(LS_TO_STORE_MAP).some(
      (key) => localStorage.getItem(key) !== null
    )
    if (!hasLocalStorageData) return false

    try {
      const existing = await db.count('videos')
      return existing === 0
    } catch {
      return true
    }
  }

  async migrate() {
    if (this._migrated) return
    if (!await this.needsMigration()) {
      this._migrated = true
      return
    }

    console.log('[Migration] Starting localStorage → IndexedDB migration...')

    for (const [lsKey, storeName] of Object.entries(LS_TO_STORE_MAP)) {
      await this._migrateCollection(lsKey, storeName)
    }

    for (const key of SETTINGS_KEYS) {
      await this._migrateSetting(key)
    }

    for (const key of METADATA_KEYS) {
      await this._migrateMetadata(key)
    }

    this._migrated = true
    console.log('[Migration] Complete')

    if (this.bus) {
      this.bus.emit('data:migration:complete')
    }
  }

  async _migrateCollection(lsKey, storeName) {
    const raw = localStorage.getItem(lsKey)
    if (raw === null) return

    try {
      const data = JSON.parse(raw)

      if (storeName === 'videos' && typeof data === 'object' && !Array.isArray(data)) {
        const entries = Object.values(data).filter(Boolean)
        for (const entry of entries) {
          if (entry.videoId) await db.save(storeName, entry)
        }
      } else if (storeName === 'folders' && typeof data === 'object' && !Array.isArray(data)) {
        for (const [name, videoIds] of Object.entries(data)) {
          await db.save(storeName, { name, videoIds })
        }
      } else if (storeName === 'folderMeta' && typeof data === 'object' && !Array.isArray(data)) {
        for (const [name, meta] of Object.entries(data)) {
          await db.save(storeName, { name, ...meta })
        }
      } else if (Array.isArray(data)) {
        for (const item of data) {
          if (item) await db.save(storeName, item)
        }
      }
    } catch (err) {
      console.warn(`[Migration] Failed to migrate "${lsKey}" → "${storeName}":`, err)
    }
  }

  async _migrateSetting(key) {
    const raw = localStorage.getItem(key)
    if (raw === null) return
    try {
      const value = raw === 'true' ? true : raw === 'false' ? false : (() => { try { return JSON.parse(raw) } catch { return raw } })()
      await db.save('settings', { name: key, value })
    } catch (err) {
      console.warn(`[Migration] Failed to migrate setting "${key}":`, err)
    }
  }

  async _migrateMetadata(key) {
    const raw = localStorage.getItem(key)
    if (raw === null) return
    try {
      await db.save('metadata', { name: key, value: raw })
    } catch (err) {
      console.warn(`[Migration] Failed to migrate metadata "${key}":`, err)
    }
  }
}
