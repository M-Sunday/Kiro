import { Api } from '../../core/Api.js'

export class Component {
  constructor() {
    this.api = Api.getInstance()
    this.bus = this.api.bus
    this.state = this.api.state
    this._subscriptions = []
    this._domRefs = {}
    this._mounted = false
  }

  mount(rootEl) {
    this.rootEl = rootEl
    this._mounted = true
    this.render()
  }

  render() {
  }

  destroy() {
    this._unsubscribeAll()
    this._removAllEventListeners()
    this._mounted = false
    this.rootEl = null
  }

  subscribe(path, callback) {
    const unsub = this.state.subscribe(path, callback)
    this._subscriptions.push(unsub)
    return unsub
  }

  emit(event, payload) {
    this.bus.emit(event, payload)
  }

  on(event, handler) {
    const unsub = this.bus.on(event, handler.bind(this))
    this._subscriptions.push(unsub)
    return unsub
  }

  listenTo(el, event, handler, options) {
    if (!el) return null
    const boundHandler = handler.bind(this)
    el.addEventListener(event, boundHandler, options)
    if (!this._listeners) this._listeners = []
    this._listeners.push({ el, event, handler: boundHandler })
    return boundHandler
  }

  ref(id) {
    if (this._domRefs[id]) return this._domRefs[id]
    if (this.rootEl) {
      this._domRefs[id] = this.rootEl.querySelector(`[data-ref="${id}"]`)
    }
    return this._domRefs[id] || null
  }

  setHTML(el, html) {
    if (el) el.innerHTML = html
  }

  show(el) {
    if (el) el.style.display = ''
  }

  hide(el) {
    if (el) el.style.display = 'none'
  }

  toggle(el, force) {
    if (el) {
      if (force !== undefined) el.style.display = force ? '' : 'none'
      else el.style.display = el.style.display === 'none' ? '' : 'none'
    }
  }

  _unsubscribeAll() {
    for (const unsub of this._subscriptions) {
      try { unsub() } catch {}
    }
    this._subscriptions = []
  }

  _removAllEventListeners() {
    if (this._listeners) {
      for (const { el, event, handler } of this._listeners) {
        try { el.removeEventListener(event, handler) } catch {}
      }
      this._listeners = []
    }
  }
}
