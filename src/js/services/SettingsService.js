import { Api } from '../core/Api.js'

export class SettingsService {
  constructor() {
    this.api = Api.getInstance()
    this.repo = this.api.getRepository('settings')
    this.bus = this.api.bus
    this.state = this.api.state
    this._bindEvents()
  }

  _bindEvents() {
    this.bus.on('ui:settings:change', (e) => this.set(e.key, e.value))
    this.bus.on('ui:settings:theme', (e) => this.setTheme(e.theme))
  }

  async get(key) {
    return this.repo.get(key)
  }

  async set(key, value) {
    await this.repo.set(key, value)
    this.state.setState(`settings.${key}`, value)
    this.bus.emit('data:settings:changed', { key, value })
  }

  async getTheme() {
    const theme = await this.get('theme')
    return theme || 'white'
  }

  async setTheme(theme) {
    await this.set('theme', theme)
    document.body.className = document.body.className
      .replace(/theme-\w+/g, '')
      .trim() + ` theme-${theme}`
    this.bus.emit('data:theme:changed', { theme })
  }

  async getAll() {
    return this.repo.getAllSettings()
  }
}
