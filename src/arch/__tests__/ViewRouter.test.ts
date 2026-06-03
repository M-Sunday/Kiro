import { describe, it, expect, vi } from 'vitest'
import { EventBus } from '../core/EventBus'
import { AppStateManager } from '../core/AppState'
import { ViewRouter, View } from '../core/ViewRouter'
import type { ViewName } from '../../shared/types'

class MockView implements View {
  readonly name: ViewName
  private _active = false
  readonly mountFn: (...args: unknown[]) => void
  readonly unmountFn: (...args: unknown[]) => void

  constructor(name: ViewName) {
    this.name = name
    this.mountFn = vi.fn()
    this.unmountFn = vi.fn()
  }

  mount(): void {
    this._active = true
    this.mountFn()
  }

  unmount(): void {
    this._active = false
    this.unmountFn()
  }

  isActive(): boolean {
    return this._active
  }
}

describe('ViewRouter', () => {
  function createRouter() {
    const bus = new EventBus()
    const state = new AppStateManager(bus)
    const router = new ViewRouter(bus, state)
    return { bus, state, router }
  }

  it('should register views', () => {
    const { router } = createRouter()
    const view = new MockView('grid')
    router.register(view)
    expect(router.getRegisteredViews()).toContain('grid')
  })

  it('should activate and deactivate views', () => {
    const { router } = createRouter()
    const gridView = new MockView('grid')
    const cardView = new MockView('card')
    router.register(gridView)
    router.register(cardView)

    router.activate('grid')
    expect(gridView.mountFn).toHaveBeenCalled()
    expect(gridView.isActive()).toBe(true)
    expect(router.activeView).toBe('grid')

    router.activate('card')
    expect(gridView.unmountFn).toHaveBeenCalled()
    expect(cardView.mountFn).toHaveBeenCalled()
    expect(cardView.isActive()).toBe(true)
    expect(router.activeView).toBe('card')
  })

  it('should not activate the same view twice', () => {
    const { router } = createRouter()
    const view = new MockView('grid')
    router.register(view)

    router.activate('grid')
    router.activate('grid')
    expect(view.mountFn).toHaveBeenCalledTimes(1)
  })

  it('should handle ui:view:set events', () => {
    const { router, bus } = createRouter()
    const view = new MockView('grid')
    router.register(view)

    bus.emit('ui:view:set', { view: 'grid' })
    expect(view.mountFn).toHaveBeenCalled()
  })

  it('should return null for unregistered views', () => {
    const { router } = createRouter()
    expect(router.activeView).toBeNull()
  })
})
