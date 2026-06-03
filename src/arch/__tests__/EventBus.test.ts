import { describe, it, expect, vi } from 'vitest'
import { EventBus } from '../core/EventBus'

describe('EventBus', () => {
  it('should emit and receive events', () => {
    const bus = new EventBus()
    const handler = vi.fn()
    bus.on('test:event', handler)
    bus.emit('test:event', { data: 42 })
    expect(handler).toHaveBeenCalledWith({ data: 42 })
  })

  it('should unsubscribe handlers', () => {
    const bus = new EventBus()
    const handler = vi.fn()
    const unsub = bus.on('test:event', handler)
    unsub()
    bus.emit('test:event', {})
    expect(handler).not.toHaveBeenCalled()
  })

  it('should support wildcard handlers', () => {
    const bus = new EventBus()
    const handler = vi.fn()
    bus.on('*', handler)
    bus.emit('any:event', { foo: 'bar' })
    expect(handler).toHaveBeenCalledWith({ event: 'any:event', payload: { foo: 'bar' } })
  })

  it('should support once handlers', () => {
    const bus = new EventBus()
    const handler = vi.fn()
    bus.once('test:event', handler)
    bus.emit('test:event', {})
    bus.emit('test:event', {})
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('should clear all handlers', () => {
    const bus = new EventBus()
    const handler = vi.fn()
    bus.on('test:event', handler)
    bus.clear()
    bus.emit('test:event', {})
    expect(handler).not.toHaveBeenCalled()
  })

  it('should count listeners', () => {
    const bus = new EventBus()
    expect(bus.listenerCount('test:event')).toBe(0)
    bus.on('test:event', () => {})
    expect(bus.listenerCount('test:event')).toBe(1)
    bus.on('test:event', () => {})
    expect(bus.listenerCount('test:event')).toBe(2)
  })

  it('should handle errors in handlers gracefully', () => {
    const bus = new EventBus()
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    bus.on('test:event', () => { throw new Error('handler error') })
    bus.emit('test:event', {})
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('should handle multiple events', () => {
    const bus = new EventBus()
    const handler1 = vi.fn()
    const handler2 = vi.fn()
    bus.on('event:1', handler1)
    bus.on('event:2', handler2)
    bus.emit('event:1', { a: 1 })
    bus.emit('event:2', { b: 2 })
    expect(handler1).toHaveBeenCalledWith({ a: 1 })
    expect(handler2).toHaveBeenCalledWith({ b: 2 })
  })
})
