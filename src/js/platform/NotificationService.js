import { PlatformDetector } from './PlatformDetector.js'

const CHANNELS = {
  'kiro-general': {
    id: 'kiro-general',
    name: 'General',
    description: 'General app notifications',
    importance: 3,
  },
  'kiro-achievements': {
    id: 'kiro-achievements',
    name: 'Achievements',
    description: 'Achievement and milestone notifications',
    importance: 4,
  },
  'kiro-reminders': {
    id: 'kiro-reminders',
    name: 'Reminders',
    description: 'Scheduled reminders and task notifications',
    importance: 3,
  },
  'kiro-updates': {
    id: 'kiro-updates',
    name: 'App Updates',
    description: 'App version update notifications',
    importance: 2,
  },
}

export class NotificationService {
  constructor(eventBus, permissionService) {
    this.bus = eventBus
    this.permissions = permissionService
    this._initialized = false
    this._notificationId = 0

    if (PlatformDetector.isNativeAndroid()) {
      this._initChannels()
    }
  }

  async _initChannels() {
    try {
      const { LocalNotifications } = await import(
        /* webpackIgnore: true */ 
        'data:text/javascript,export const LocalNotifications = window.Capacitor?.Plugins?.LocalNotifications'
      )
    } catch {
    }
  }

  async _ensureCapacitorPlugin() {
    if (!PlatformDetector.isNativeAndroid()) return null
    try {
      return window.Capacitor?.Plugins?.LocalNotifications || null
    } catch {
      return null
    }
  }

  async requestPermission() {
    return this.permissions.ensure('notifications')
  }

  async schedule(notification) {
    if (!await this._canNotify()) return

    const plugin = await this._ensureCapacitorPlugin()
    if (!plugin) return

    const id = notification.id || ++this._notificationId

    try {
      await plugin.schedule({
        notifications: [{
          id,
          title: notification.title,
          body: notification.body,
          channelId: notification.channelId || 'kiro-general',
          schedule: notification.schedule || undefined,
          ...(notification.extra || {}),
        }],
      })

      this.bus.emit('platform:notification:scheduled', { id, notification })
      return id
    } catch (err) {
      console.warn('[NotificationService] Failed to schedule notification:', err)
    }
  }

  async scheduleImmediate(title, body, channelId = 'kiro-general') {
    return this.schedule({ title, body, channelId })
  }

  async scheduleFuture(title, body, at, channelId = 'kiro-reminders') {
    return this.schedule({
      title,
      body,
      channelId,
      schedule: { at },
    })
  }

  async scheduleRepeating(title, body, every, channelId = 'kiro-reminders') {
    return this.schedule({
      title,
      body,
      channelId,
      schedule: { every, count: 1 },
    })
  }

  async cancel(id) {
    const plugin = await this._ensureCapacitorPlugin()
    if (!plugin) return

    try {
      await plugin.cancel({ notifications: [{ id }] })
    } catch (err) {
      console.warn('[NotificationService] Failed to cancel notification:', err)
    }
  }

  async cancelAll() {
    const plugin = await this._ensureCapacitorPlugin()
    if (!plugin) return

    try {
      await plugin.cancelAll()
    } catch (err) {
      console.warn('[NotificationService] Failed to cancel all notifications:', err)
    }
  }

  async getPending() {
    const plugin = await this._ensureCapacitorPlugin()
    if (!plugin) return []

    try {
      const result = await plugin.getPending()
      return result.notifications || []
    } catch (err) {
      console.warn('[NotificationService] Failed to get pending notifications:', err)
      return []
    }
  }

  registerTapHandler(handler) {
    if (!PlatformDetector.isNativeAndroid()) return

    const plugin = window.Capacitor?.Plugins?.LocalNotifications
    if (!plugin) return

    try {
      plugin.addListener('localNotificationReceived', (notification) => {
        handler(notification)
      })
    } catch (err) {
      console.warn('[NotificationService] Failed to register tap handler:', err)
    }
  }

  async _canNotify() {
    const status = await this.permissions.check('notifications')
    return status === 'granted'
  }
}
