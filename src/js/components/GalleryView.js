export class GalleryView {
  constructor(bus, state) {
    this.bus = bus
    this.state = state
    this.rootEl = null
  }

  mount(rootEl) {
    this.rootEl = rootEl
    this.rootEl.innerHTML = ''
  }

  destroy() {
    if (this.rootEl) this.rootEl.innerHTML = ''
  }
}
