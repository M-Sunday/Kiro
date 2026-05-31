export class ServiceRegistry {
  constructor() {
    this._services = {}
    this._factories = {}
  }

  register(name, instance) {
    if (this._services[name]) {
      console.warn(`[ServiceRegistry] Overwriting existing service: "${name}"`)
    }
    this._services[name] = instance
    return instance
  }

  registerLazy(name, factory) {
    this._factories[name] = factory
  }

  get(name) {
    if (!this._services[name] && this._factories[name]) {
      this._services[name] = this._factories[name]()
      delete this._factories[name]
    }
    if (!this._services[name]) {
      throw new Error(`[ServiceRegistry] Service "${name}" not registered`)
    }
    return this._services[name]
  }

  has(name) {
    return !!this._services[name] || !!this._factories[name]
  }

  getAll() {
    return { ...this._services }
  }

  getNames() {
    return Object.keys(this._services)
  }
}
