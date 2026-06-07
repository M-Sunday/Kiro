export class PlatformDetector {
  static isNativeAndroid() {
    return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform())
  }

  static isElectron() {
    return !!(typeof process !== 'undefined' && process.versions?.electron)
  }

  static isDesktop() {
    return PlatformDetector.isElectron()
  }

  static platformName() {
    if (PlatformDetector.isNativeAndroid()) return 'android'
    if (PlatformDetector.isElectron()) return 'electron'
    return 'unknown'
  }

  static isOnline() {
    return navigator.onLine
  }

  static onOnlineChange(handler) {
    window.addEventListener('online', () => handler(true))
    window.addEventListener('offline', () => handler(false))
  }
}
