export class GalleryView {
  constructor(bus, state) {
    this.bus = bus
    this.state = state
    this.rootEl = null
  }

  mount(rootEl) {
    this.rootEl = rootEl
    this.render()
  }

  render() {
    if (!this.rootEl) return
    this.rootEl.innerHTML = `
      <div class="home-view-content">
        <div class="home-view-empty">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          <p class="home-view-empty-text">Gallery is empty</p>
        </div>
      </div>
    `
  }

  destroy() {
    if (this.rootEl) this.rootEl.innerHTML = ''
  }
}
