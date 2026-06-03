import type { AppEvent } from '../../shared/types'

type Handler = (payload: any) => void
type Unsubscribe = () => void

export class EventBus {
  private _handlers = new Map<string, Handler[]>()
  private _wildcardHandlers: Handler[] = []

  on(event: string, handler: Handler): Unsubscribe {
    if (event === '*') {
      this._wildcardHandlers.push(handler)
      return () => {
        const idx = this._wildcardHandlers.indexOf(handler)
        if (idx > -1) this._wildcardHandlers.splice(idx, 1)
      }
    }
    const list = this._handlers.get(event) || []
    list.push(handler)
    this._handlers.set(event, list)
    return () => this.off(event, handler)
  }

  off(event: string, handler: Handler): void {
    const list = this._handlers.get(event)
    if (!list) return
    const idx = list.indexOf(handler)
    if (idx > -1) list.splice(idx, 1)
    if (list.length === 0) this._handlers.delete(event)
  }

  emit(event: string, payload?: Record<string, unknown>): void {
    const list = this._handlers.get(event)
    if (list) {
      for (const handler of list) {
        try {
          handler(payload ?? {})
        } catch (err) {
          console.error(`[EventBus] Error in handler for "${event}":`, err)
        }
      }
    }
    for (const handler of this._wildcardHandlers) {
      try {
        handler({ event, payload })
      } catch (err) {
        console.error(`[EventBus] Error in wildcard handler:`, err)
      }
    }
  }

  emitTyped(event: AppEvent): void {
    this.emit(event.type, 'payload' in event ? event.payload : undefined)
  }

  once(event: string, handler: Handler): Unsubscribe {
    const wrapper: Handler = (payload) => {
      this.off(event, wrapper)
      handler(payload)
    }
    return this.on(event, wrapper)
  }

  clear(): void {
    this._handlers.clear()
    this._wildcardHandlers = []
  }

  listenerCount(event: string): number {
    return this._handlers.get(event)?.length ?? 0
  }
}
