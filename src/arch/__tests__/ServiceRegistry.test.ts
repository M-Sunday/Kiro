import { describe, it, expect } from 'vitest'
import { ServiceRegistry } from '../core/ServiceRegistry'

describe('ServiceRegistry', () => {
  it('should register and retrieve services', () => {
    const registry = new ServiceRegistry()
    const service = { doSomething: () => 'done' }
    registry.register('testService', service)
    expect(registry.get('testService')).toBe(service)
  })

  it('should throw for unregistered services', () => {
    const registry = new ServiceRegistry()
    expect(() => registry.get('nonexistent')).toThrow()
  })

  it('should check if service exists', () => {
    const registry = new ServiceRegistry()
    expect(registry.has('test')).toBe(false)
    registry.register('test', {})
    expect(registry.has('test')).toBe(true)
  })

  it('should register lazy services', () => {
    const registry = new ServiceRegistry()
    const factory = () => ({ created: true })
    registry.registerLazy('lazyService', factory)
    expect(registry.has('lazyService')).toBe(true)
    const instance = registry.get('lazyService')
    expect(instance).toEqual({ created: true })
  })

  it('should return all service names', () => {
    const registry = new ServiceRegistry()
    registry.register('a', {})
    registry.register('b', {})
    const names = registry.getNames()
    expect(names).toContain('a')
    expect(names).toContain('b')
  })
})
