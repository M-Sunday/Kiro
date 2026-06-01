const REST_POSITIONS = [
  { x: 0, y: 0, scale: 1, rotate: 0 },
  { x: 32, y: -12, scale: 0.9, rotate: 2 },
  { x: 48, y: 0, scale: 0.85, rotate: 4 },
  { x: 62, y: 12, scale: 0.8, rotate: 7 },
]

export class CardStackView {
  constructor() {
    this._cards = []
    this._dragging = null
    this._raf = null
    this._springs = []
  }

  mount() {
    const container = document.querySelector('.deck-content')
    if (!container) return
    this._container = container
    this._cards = [...container.querySelectorAll('.deck-card')]
    this._springs = this._cards.map(() => ({
      x: 0, y: 0,
      vx: 0, vy: 0,
      targetX: 0, targetY: 0,
      scale: 1, rotate: 0,
    }))
    this._applyRestPositions(true)
    this._bindEvents()
  }

  unmount() {
    if (this._raf) cancelAnimationFrame(this._raf)
    this._raf = null
    this._unbindEvents()
  }

  _applyRestPositions(instant) {
    this._cards.forEach((card, i) => {
      const p = REST_POSITIONS[i] || REST_POSITIONS[REST_POSITIONS.length - 1]
      if (instant) {
        card.style.transform = `translateX(${p.x}px) translateY(${p.y}px) scale(${p.scale}) rotate(${p.rotate}deg)`
      }
      this._springs[i].targetX = p.x
      this._springs[i].targetY = p.y
      this._springs[i].scale = p.scale
      this._springs[i].rotate = p.rotate
    })
  }

  _bindEvents() {
    this._cards.forEach((card) => {
      card.addEventListener('pointerdown', this._onPointerDown)
    })
    this._onMove = this._onPointerMove.bind(this)
    this._onUp = this._onPointerUp.bind(this)
  }

  _unbindEvents() {
    this._cards.forEach((card) => {
      card.removeEventListener('pointerdown', this._onPointerDown)
    })
    window.removeEventListener('pointermove', this._onMove)
    window.removeEventListener('pointerup', this._onUp)
    window.removeEventListener('pointercancel', this._onUp)
  }

  _onPointerDown = (e) => {
    const card = e.currentTarget
    const idx = this._cards.indexOf(card)
    if (idx === -1) return
    this._dragging = { card, idx, startX: e.clientX, startY: e.clientY }
    card.classList.add('dragging')
    this._cards.forEach(c => { if (c !== card) { c.style.transition = 'opacity 0.2s'; c.style.opacity = '0.3' } })
    window.addEventListener('pointermove', this._onMove)
    window.addEventListener('pointerup', this._onUp)
    window.addEventListener('pointercancel', this._onUp)
  }

  _onPointerMove(e) {
    if (!this._dragging) return
    const dx = e.clientX - this._dragging.startX
    const dy = e.clientY - this._dragging.startY
    const s = this._springs[this._dragging.idx]
    s.targetX = REST_POSITIONS[this._dragging.idx].x + dx
    s.targetY = REST_POSITIONS[this._dragging.idx].y + dy
    s.rotate = dx * 0.05
    s.scale = 1.05
    if (!this._raf) this._raf = requestAnimationFrame(() => this._tick())
  }

  _onPointerUp(e) {
    if (!this._dragging) return
    const card = this._dragging.card
    card.classList.remove('dragging')
    const idx = this._dragging.idx
    const s = this._springs[idx]
    const p = REST_POSITIONS[idx] || REST_POSITIONS[REST_POSITIONS.length - 1]
    s.targetX = p.x
    s.targetY = p.y
    s.rotate = p.rotate
    s.scale = p.scale
    s.vx = (e.clientX - this._dragging.startX) * 0.15
    s.vy = (e.clientY - this._dragging.startY) * 0.15
    this._dragging = null
    this._cards.forEach(c => { c.style.transition = ''; c.style.opacity = '' })
    if (!this._raf) this._raf = requestAnimationFrame(() => this._tick())
  }

  _tick() {
    this._raf = null
    let animating = false
    this._cards.forEach((card, i) => {
      const s = this._springs[i]
      const p = REST_POSITIONS[i] || REST_POSITIONS[REST_POSITIONS.length - 1]
      const tx = s.targetX, ty = s.targetY
      s.vx += (tx - s.x) * 0.12
      s.vy += (ty - s.y) * 0.12
      s.vx *= 0.72
      s.vy *= 0.72
      s.x += s.vx
      s.y += s.vy
      if (Math.abs(s.vx) > 0.1 || Math.abs(s.vy) > 0.1 || Math.abs(s.x - tx) > 0.5 || Math.abs(s.y - ty) > 0.5) {
        animating = true
      } else {
        s.x = tx
        s.y = ty
      }
      card.style.transform = `translateX(${s.x}px) translateY(${s.y}px) scale(${s.scale}) rotate(${s.rotate}deg)`
      card.style.zIndex = i === this._dragging?.idx ? 10 : (this._cards.length - i)
    })
    if (animating || this._dragging) {
      this._raf = requestAnimationFrame(() => this._tick())
    }
  }
}
