import { EventBus } from '../../core/EventBus'
import { AppStateManager } from '../../core/AppState'

export abstract class Component {
  protected bus: EventBus
  protected state: AppStateManager
  protected rootEl: HTMLElement | null = null
  private _subscriptions: (() => void)[] = []
  private _listeners: { el: EventTarget; event: string; handler: EventListener }[] = []
  private _mounted = false

  constructor(bus: EventBus, state: AppStateManager) {
    this.bus = bus
    this.state = state
  }

  mount(rootEl: HTMLElement): void {
    this.rootEl = rootEl
    this._mounted = true
    this.render()
  }

  abstract render(): void

  destroy(): void {
    this._unsubscribeAll()
    this._removeAllEventListeners()
    this._mounted = false
    this.rootEl = null
  }

  protected subscribe(path: string, callback: (value: unknown, oldValue: unknown, path: string) => void): () => void {
    const unsub = this.state.subscribe(path, callback)
    this._subscriptions.push(unsub)
    return unsub
  }

  protected emit(event: string, payload?: Record<string, unknown>): void {
    this.bus.emit(event, payload)
  }

  protected on(event: string, handler: (payload: any) => void): () => void {
    const unsub = this.bus.on(event, handler.bind(this))
    this._subscriptions.push(unsub)
    return unsub
  }

  protected listenTo(el: EventTarget | null, event: string, handler: EventListener, options?: AddEventListenerOptions): void {
    if (!el) return
    const boundHandler = handler.bind(this)
    el.addEventListener(event, boundHandler, options)
    this._listeners.push({ el, event, handler: boundHandler })
  }

  protected get isMounted(): boolean {
    return this._mounted
  }

  private _unsubscribeAll(): void {
    for (const unsub of this._subscriptions) {
      try { unsub() } catch { /* noop */ }
    }
    this._subscriptions = []
  }

  private _removeAllEventListeners(): void {
    for (const { el, event, handler } of this._listeners) {
      try { el.removeEventListener(event, handler) } catch { /* noop */ }
    }
    this._listeners = []
  }
}
