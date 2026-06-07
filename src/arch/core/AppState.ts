import type { AppState, ViewName } from '../../shared/types'
import { EventBus } from './EventBus'

type SubscriptionCallback = (value: unknown, oldValue: unknown, path: string) => void

const INITIAL_STATE: AppState = {
  videos: {},
  folders: { Videos: [], Archived: [] },
  folderMeta: {},
  pins: [],
  notes: [],
  bookmarks: [],
  directAccess: [],
  externalFiles: [],
  collapsed: {},
  nsfw: [],
  blurAllNSFW: false,
  userName: '',
  settings: {
    showSidebarBtn: true,
    showKiroInput: true,
    compactMode: false,
    autoUpdateLinks: true,
    confirmDeletion: true,
    detectAllExt: false,
    saveLinkHistory: true,
    clearOnExit: false,
  },
  download: {
    type: 'video',
    videoQuality: '720',
    videoCodec: 'h264',
    audioFormat: 'mp3',
    audioBitrate: 'auto',
  },
  ui: {
    currentView: 'grid',
    sidebarClosed: false,
    batchSelected: [],
    searchFocused: false,
    settingsOpen: false,
    currentVideoId: null,
    currentNoteId: null,
  },
  permissions: {
    records: {},
    dialog: { open: false, type: null, resolve: null },
  },
  platform: {
    isOnline: navigator.onLine,
    isNative: false,
    isElectron: false,
    permissions: {},
  },
}

export class AppStateManager {
  private _state: AppState
  private _bus: EventBus
  private _subscriptions = new Map<string, SubscriptionCallback[]>()

  constructor(bus: EventBus) {
    this._bus = bus
    this._state = this._deepClone(INITIAL_STATE)
  }

  get fullState(): AppState {
    return this._deepClone(this._state)
  }

  get<T>(path: string): T | undefined {
    const keys = path.split('.')
    let current: unknown = this._state
    for (const key of keys) {
      if (current == null || typeof current !== 'object') return undefined
      current = (current as Record<string, unknown>)[key]
    }
    return current as T | undefined
  }

  set(path: string, value: unknown): void {
    const keys = path.split('.')
    const lastKey = keys.pop()
    if (!lastKey) return
    const parent = this._resolveParent(keys)
    if (!parent || typeof parent !== 'object') return

    const oldValue = (parent as Record<string, unknown>)[lastKey]
    if (oldValue === value) return

    ;(parent as Record<string, unknown>)[lastKey] = value
    this._bus.emit('state:changed', { path, value, oldValue })
    this._bus.emit(`state:${path}:changed`, { value, oldValue })
    this._notifySubscribers(path, value, oldValue)

    if (path.includes('.')) {
      const topKey = keys[0] ?? path
      this._bus.emit(`state:${topKey}:changed`, { value: this.get(topKey) })
    }
  }

  setPartial(path: string, partial: Record<string, unknown>): void {
    const current = this.get<Record<string, unknown>>(path)
    if (!current || typeof current !== 'object') {
      this.set(path, partial)
      return
    }
    this.set(path, { ...current, ...partial })
  }

  // ── Convenience setters ──

  setActiveView(view: ViewName): void {
    this.set('ui.currentView', view)
  }

  setCurrentVideoId(id: string | null): void {
    this.set('ui.currentVideoId', id)
  }

  setCurrentNoteId(id: string | null): void {
    this.set('ui.currentNoteId', id)
  }

  setSidebarClosed(closed: boolean): void {
    this.set('ui.sidebarClosed', closed)
  }

  setOnline(online: boolean): void {
    this.set('platform.isOnline', online)
  }

  // ── Subscriptions ──

  subscribe(path: string | '*', callback: SubscriptionCallback): () => void {
    const fullPath = path || '*'
    const list = this._subscriptions.get(fullPath) || []
    list.push(callback)
    this._subscriptions.set(fullPath, list)
    return () => this.unsubscribe(path, callback)
  }

  unsubscribe(path: string | '*', callback: SubscriptionCallback): void {
    const fullPath = path || '*'
    const list = this._subscriptions.get(fullPath)
    if (!list) return
    const idx = list.indexOf(callback)
    if (idx > -1) list.splice(idx, 1)
    if (list.length === 0) this._subscriptions.delete(fullPath)
  }

  // ── Reset ──

  reset(): void {
    this._state = this._deepClone(INITIAL_STATE)
    this._bus.emit('state:reset', { state: this._state })
  }

  // ── Init from localStorage (migration bridge) ──

  initFromLegacy(legacyData: Partial<AppState>): void {
    for (const [key, value] of Object.entries(legacyData)) {
      if (value !== undefined && key in this._state) {
        ;(this._state as unknown as Record<string, unknown>)[key] = this._deepClone(value)
      }
    }
    this._bus.emit('state:initialized', { state: this._state })
  }

  // ── Internal ──

  private _resolveParent(keys: string[]): Record<string, unknown> | null {
    let current: Record<string, unknown> = this._state as unknown as Record<string, unknown>
    for (const key of keys) {
      if (current[key] == null || typeof current[key] !== 'object') {
        current[key] = {}
      }
      current = current[key] as Record<string, unknown>
    }
    return current
  }

  private _notifySubscribers(path: string, value: unknown, oldValue: unknown): void {
    for (const [subPath, callbacks] of this._subscriptions) {
      if (subPath === '*' || subPath === path || path.startsWith(subPath + '.')) {
        for (const cb of callbacks) {
          try {
            cb(value, oldValue, path)
          } catch (err) {
            console.error(`[AppState] Error in subscriber for "${subPath}":`, err)
          }
        }
      }
    }
  }

  private _deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj
    return JSON.parse(JSON.stringify(obj))
  }
}
