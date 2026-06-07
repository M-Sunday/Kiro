import { PlatformDetector } from './PlatformDetector.js'

const PERMISSION_MAP = {
  storage: { android: 'storage' },
  notifications: { android: 'notifications' },
  camera: { android: 'camera' },
  photos: { android: 'photoLibrary' },
  microphone: { android: 'microphone' },
}

export class PermissionService {
  constructor(eventBus, stateManager) {
    this.bus = eventBus
    this.state = stateManager
    this._cache = {}
  }

  async check(permission) {
    this._ensurePlatformState()

    if (PlatformDetector.isNativeAndroid()) {
      return this._checkAndroid(permission)
    }

    if (PlatformDetector.isElectron()) {
      return this._checkElectron(permission)
    }

    return 'denied'
  }

  async request(permission) {
    this._ensurePlatformState()

    if (PlatformDetector.isNativeAndroid()) {
      return this._requestAndroid(permission)
    }

    if (PlatformDetector.isElectron()) {
      return this._requestElectron(permission)
    }

    return 'denied'
  }

  async ensure(permission) {
    const status = await this.check(permission)
    if (status === 'granted') return true
    const result = await this.request(permission)
    return result === 'granted'
  }

  async openSettings() {
    if (PlatformDetector.isNativeAndroid()) {
      try {
        await Capacitor.launchUrl({ url: 'package:com.kiro.app' })
      } catch (err) {
        console.warn('[PermissionService] Failed to open Android app settings:', err)
      }
      return
    }

    if (PlatformDetector.isElectron()) {
      try {
        const shell = require('electron').shell
        if (shell && shell.openExternal) {
          shell.openExternal('https://support.apple.com/guide/mac-help/change-privacy-preferences-mh32356/mac')
        }
      } catch {}
      return
    }
  }

  getCached(permission) {
    return this._cache[permission] || null
  }

  // ── Android ──────────────────────────────────────────

  async _checkAndroid(permission) {
    const alias = PERMISSION_MAP[permission]
    if (!alias) return 'denied'

    try {
      const Permissions = window.Capacitor.Plugins.Permissions
      if (Permissions) {
        const result = await Permissions.query({ name: alias.android })
        this._cache[permission] = result.state
        this._updateState(permission, result.state)
        return result.state
      }
      // Fallback: use known plugin permission APIs
      if (permission === 'storage') {
        const fs = window.Capacitor.Plugins.Filesystem
        if (fs) {
          const result = await fs.checkPermissions()
          const state = result.publicStorage === 'granted' ? 'granted' : 'prompt'
          this._cache[permission] = state
          this._updateState(permission, state)
          return state
        }
      }
      return 'granted'
    } catch (err) {
      console.warn(`[PermissionService] check("${permission}") failed:`, err)
      return 'denied'
    }
  }

  async _requestAndroid(permission) {
    const alias = PERMISSION_MAP[permission]
    if (!alias) return 'denied'

    try {
      const Permissions = window.Capacitor.Plugins.Permissions
      if (Permissions) {
        const result = await Permissions.request({ name: alias.android })
        this._cache[permission] = result.state
        this._updateState(permission, result.state)

        if (result.state === 'denied') {
          this.bus.emit('platform:permission:denied', {
            permission,
            canRequestAgain: result.canRequestAgain !== false,
          })
        }

        if (result.state === 'granted') {
          this.bus.emit('platform:permission:granted', { permission })
        }
        return result.state
      }
      // Fallback: use known plugin permission APIs
      if (permission === 'storage') {
        const fs = window.Capacitor.Plugins.Filesystem
        if (fs) {
          const result = await fs.requestPermissions()
          const state = result.publicStorage === 'granted' ? 'granted' : 'denied'
          this._cache[permission] = state
          this._updateState(permission, state)
          if (state === 'granted') {
            this.bus.emit('platform:permission:granted', { permission })
          } else {
            this.bus.emit('platform:permission:denied', { permission, canRequestAgain: true })
          }
          return state
        }
      }
      return 'granted'
    } catch (err) {
      console.warn(`[PermissionService] request("${permission}") failed:`, err)
      return 'denied'
    }
  }

  // ── Electron (macOS/Windows) ─────────────────────────

  async _checkElectron(permission) {
    if (permission === 'notifications') {
      if (typeof Notification === 'undefined') return 'denied'
      const state = Notification.permission
      this._cache[permission] = state
      this._updateState(permission, state)
      return state
    }
    if (permission === 'storage' || permission === 'photos') {
      return 'granted'
    }
    return 'granted'
  }

  async _requestElectron(permission) {
    if (permission === 'notifications') {
      if (typeof Notification === 'undefined') return 'denied'
      const result = await Notification.requestPermission()
      this._cache[permission] = result
      this._updateState(permission, result)

      if (result === 'granted') {
        this.bus.emit('platform:permission:granted', { permission })
      } else {
        this.bus.emit('platform:permission:denied', { permission, canRequestAgain: true })
      }
      return result
    }
    return 'granted'
  }

  _updateState(permission, value) {
    this.state.setState(`platform.permissions.${permission}`, value)
  }

  _ensurePlatformState() {
    this.state.setState('platform.isNative', PlatformDetector.isNativeAndroid())
    this.state.setState('platform.isElectron', PlatformDetector.isElectron())
  }
}
