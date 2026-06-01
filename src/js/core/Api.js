import { EventBus } from './EventBus.js'
import { StateManager } from './StateManager.js'
import { ServiceRegistry } from './ServiceRegistry.js'

let _instance = null

export class Api {
  constructor() {
    if (_instance) return _instance
    this.bus = new EventBus()
    this.state = new StateManager(this.bus)
    this.services = new ServiceRegistry()
    this._repositories = {}
    this._bootstrapped = false
    _instance = this
  }

  static getInstance() {
    if (!_instance) new Api()
    return _instance
  }

  static getEventBus() {
    return Api.getInstance().bus
  }

  static getStateManager() {
    return Api.getInstance().state
  }

  static getServiceRegistry() {
    return Api.getInstance().services
  }

  registerService(name, instance) {
    return this.services.register(name, instance)
  }

  getService(name) {
    return this.services.get(name)
  }

  hasService(name) {
    return this.services.has(name)
  }

  registerRepository(name, repo) {
    this._repositories[name] = repo
  }

  getRepository(name) {
    if (!this._repositories[name]) {
      throw new Error(`[Api] Repository "${name}" not registered`)
    }
    return this._repositories[name]
  }

  bootstrap(config) {
    if (this._bootstrapped) return
    this._bootstrapped = true

    const defaults = {
      videos: {},
      folders: { Videos: [], Archived: [] },
      folderMeta: {},
      pins: [],
      notes: [],
      bookmarks: [],
    directAccess: [],
    settings: {},
      nsfw: [],
      blurAllNSFW: false,
      collapsed: {},
      userName: '',
      lastVersion: '',
      swVersion: '',
      installedAt: null,
      lastOpenedAt: null,
      eulaAccepted: false,
      linkHistory: [],
      theme: 'white',
      download: {
        type: 'video',
        videoQuality: '720',
        videoCodec: 'h264',
        audioFormat: 'mp3',
        audioBitrate: 'auto'
      },
      ui: {
        currentView: 'grid',
        sidebarClosed: false,
        batchSelected: [],
        searchFocused: false,
        settingsOpen: false
      },
      platform: {
        isOnline: navigator.onLine,
        isNative: !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()),
        isElectron: !!(typeof process !== 'undefined' && process.versions?.electron),
        permissions: {}
      }
    }

    this.state.init({ ...defaults, ...config })
    this.bus.emit('app:bootstrapped', { state: this.state.getFullState() })
  }

  static reset() {
    _instance = null
  }
}
