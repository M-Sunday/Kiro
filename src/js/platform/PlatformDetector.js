export class PlatformDetector {
  static isNativeAndroid() {
    return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform())
  }

  static isElectron() {
    return !!(typeof process !== 'undefined' && process.versions?.electron)
  }

  static isPWA() {
    return !!(navigator.standalone)
  }

  static isBrowser() {
    return !PlatformDetector.isNativeAndroid() && !PlatformDetector.isElectron() && !PlatformDetector.isPWA()
  }

  static platformName() {
    if (PlatformDetector.isNativeAndroid()) return 'android'
    if (PlatformDetector.isElectron()) return 'electron'
    if (PlatformDetector.isPWA()) return 'pwa'
    return 'browser'
  }

  static isOnline() {
    return navigator.onLine
  }

  static onOnlineChange(handler) {
    window.addEventListener('online', () => handler(true))
    window.addEventListener('offline', () => handler(false))
  }
}
