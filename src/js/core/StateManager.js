export class StateManager {
  constructor(eventBus) {
    this.bus = eventBus
    this._state = {}
    this._subscriptions = {}
  }

  init(initialState) {
    this._state = { ...initialState }
    this.bus.emit('state:initialized', { state: this._state })
  }

  getState(path) {
    if (!path) return this._state
    const keys = path.split('.')
    let current = this._state
    for (const key of keys) {
      if (current == null || typeof current !== 'object') return undefined
      current = current[key]
    }
    return current
  }

  setState(path, value) {
    if (!path) return
    const keys = path.split('.')
    const lastKey = keys.pop()
    const parent = this._resolveParent(keys)

    if (!parent || typeof parent !== 'object') return

    const oldValue = parent[lastKey]
    if (oldValue === value) return

    parent[lastKey] = value
    this.bus.emit('state:changed', { path, value, oldValue })
    this.bus.emit(`state:${path}:changed`, { value, oldValue })

    this._notifySubscribers(path, value, oldValue)

    if (path.indexOf('.') > -1) {
      const topKey = keys.length > 0 ? keys[0] : path
      const topValue = this.getState(topKey)
      this.bus.emit(`state:${topKey}:changed`, { value: topValue })
    }
  }

  setStatePartial(path, partial) {
    const current = this.getState(path)
    if (!current || typeof current !== 'object') {
      this.setState(path, partial)
      return
    }
    this.setState(path, { ...current, ...partial })
  }

  subscribe(path, callback) {
    const fullPath = path || '*'
    if (!this._subscriptions[fullPath]) this._subscriptions[fullPath] = []
    this._subscriptions[fullPath].push(callback)
    return () => this.unsubscribe(path, callback)
  }

  unsubscribe(path, callback) {
    const fullPath = path || '*'
    const list = this._subscriptions[fullPath]
    if (!list) return
    const idx = list.indexOf(callback)
    if (idx > -1) list.splice(idx, 1)
    if (list.length === 0) delete this._subscriptions[fullPath]
  }

  getFullState() {
    return { ...this._state }
  }

  reset(initialState) {
    this._state = initialState || {}
    this.bus.emit('state:reset', { state: this._state })
  }

  _resolveParent(keys) {
    let current = this._state
    for (const key of keys) {
      if (current[key] == null || typeof current[key] !== 'object') {
        current[key] = {}
      }
      current = current[key]
    }
    return current
  }

  _notifySubscribers(path, value, oldValue) {
    for (const [subPath, callbacks] of Object.entries(this._subscriptions)) {
      if (subPath === '*' || subPath === path || path.startsWith(subPath + '.')) {
        for (const cb of callbacks) {
          try { cb(value, oldValue, path) }
          catch (err) { console.error(`[StateManager] Error in subscriber for "${subPath}":`, err) }
        }
      }
    }
  }
}
