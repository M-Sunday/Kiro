type Factory<T> = () => T

export class ServiceRegistry {
  private _services = new Map<string, unknown>()
  private _factories = new Map<string, Factory<unknown>>()

  register<T>(name: string, instance: T): T {
    if (this._services.has(name)) {
      console.warn(`[ServiceRegistry] Overwriting existing service: "${name}"`)
    }
    this._services.set(name, instance)
    return instance
  }

  registerLazy<T>(name: string, factory: Factory<T>): void {
    this._factories.set(name, factory)
  }

  get<T>(name: string): T {
    if (!this._services.has(name) && this._factories.has(name)) {
      const factory = this._factories.get(name)!
      const instance = factory()
      this._services.set(name, instance)
      this._factories.delete(name)
    }
    if (!this._services.has(name)) {
      throw new Error(`[ServiceRegistry] Service "${name}" not registered`)
    }
    return this._services.get(name) as T
  }

  has(name: string): boolean {
    return this._services.has(name) || this._factories.has(name)
  }

  getAll(): Record<string, unknown> {
    const result: Record<string, unknown> = {}
    for (const [key, value] of this._services) {
      result[key] = value
    }
    return result
  }

  getNames(): string[] {
    return Array.from(this._services.keys())
  }
}
