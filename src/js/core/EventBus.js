export class EventBus {
  constructor() {
    this._handlers = {}
    this._wildcardHandlers = []
  }

  on(event, handler, context) {
    if (event === '*') {
      this._wildcardHandlers.push({ handler, context })
      const self = this
      return () => {
        const idx = self._wildcardHandlers.indexOf(entry)
        if (idx > -1) self._wildcardHandlers.splice(idx, 1)
      }
    }
    if (!this._handlers[event]) this._handlers[event] = []
    const entry = { handler, context }
    this._handlers[event].push(entry)
    return () => this.off(event, handler)
  }

  off(event, handler) {
    const list = this._handlers[event]
    if (!list) return
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i].handler === handler) list.splice(i, 1)
    }
    if (list.length === 0) delete this._handlers[event]
  }

  emit(event, payload) {
    const list = this._handlers[event]
    if (list) {
      for (const entry of list) {
        try { entry.handler.call(entry.context || null, payload) }
        catch (err) { console.error(`[EventBus] Error in handler for "${event}":`, err) }
      }
    }
    for (const w of this._wildcardHandlers) {
      try { w.handler.call(w.context || null, { event, payload }) }
      catch (err) { console.error(`[EventBus] Error in wildcard handler:`, err) }
    }
  }

  once(event, handler) {
    const wrapper = (payload) => {
      this.off(event, wrapper)
      handler(payload)
    }
    this.on(event, wrapper)
  }

  clear() {
    this._handlers = {}
    this._wildcardHandlers = []
  }

  listenerCount(event) {
    const list = this._handlers[event]
    return list ? list.length : 0
  }
}
