const FALLBACK_DATA = [
  { id: '1', title: 'Romantic Landscape Study', description: 'A romantic landscape study featuring pastoral scenes and natural beauty.', period: '19th Century', location: 'European Landscape Archive', image: 'assets/gallery/d1265915f64e17724eee04496199b878f2a5a8c0.png', x: 122, y: 70, w: 340, h: 254 },
  { id: '2', title: 'Archaeological Excavation', description: 'Documentation of an archaeological excavation showing ancient structures and artifacts.', period: '19th Century', location: 'Mediterranean Archaeological Archive', image: 'assets/gallery/9b852d8f688f0cc61c4b0710686fbfe266ab6b32.png', x: 150, y: 343, w: 335, h: 336 },
  { id: '3', title: 'Geological Formation Study', description: 'A detailed study of geological formations and mineral structures.', period: '18th-19th Century', location: 'Geological Survey Institute', image: 'assets/gallery/880917d47a6fc1d8ef4b8a482d8d7f55440834c9.png', x: 540, y: 102, w: 418, h: 279 },
  { id: '4', title: 'Natural History Specimens', description: 'A scientific illustration featuring natural history specimens.', period: '18th-19th Century', location: 'Natural History Collection', image: 'assets/gallery/d8c62563eaf342efa330356e6dd65c4c925cc1fc.png', x: 633, y: 697, w: 380, h: 377 },
  { id: '5', title: 'Landscape with Cave Formation', description: 'A romantic landscape featuring dramatic cave formations.', period: '19th Century', location: 'Geological Survey Archive', image: 'assets/gallery/3c5895c0299021afb3575aed1fa08ef74290823e.png', x: 103, y: 709, w: 359, h: 367 },
  { id: '6', title: 'Botanical Study', description: 'A detailed botanical illustration showcasing plant specimens.', period: '18th-19th Century', location: 'Botanical Research Archive', image: 'assets/gallery/b626b3fe0c21786304267214fb15e2fd1ef31f6b.png', x: 103, y: 1100, w: 334, h: 450 },
  { id: '7', title: 'Ancient Architecture Study', description: 'Architectural documentation of ancient structures.', period: '19th Century', location: 'Architectural History Archive', image: 'assets/gallery/9e38e401610b4e9bf2f6923d1fd16273fd8321be.png', x: 470, y: 1100, w: 349, h: 390 },
  { id: '8', title: 'Scientific Botanical Illustration', description: 'A precise botanical study featuring detailed plant anatomy.', period: '18th-19th Century', location: 'Royal Botanical Society', image: 'assets/gallery/1618b2d32fdb0762749bdcaff4c4fdd1bc4bc3ef.png', x: 1013, y: 295, w: 340, h: 327 },
  { id: '9', title: 'Archaeological Site Documentation', description: 'Early photographic documentation of an archaeological site.', period: '19th Century', location: 'Archaeological Expedition Archive', image: 'assets/gallery/45efc59d344149e617a802897332b1032d37a332.png', x: 1025, y: 552, w: 323, h: 339 },
  { id: '10', title: 'Classical Landscape Engraving', description: 'A detailed engraving depicting a classical landscape with ancient architecture.', period: '18th-19th Century', location: 'European Grand Tour Collection', image: 'assets/gallery/524474e3b967bf940202bb4af7f0d77b82e057eb.png', x: 1035, y: 739, w: 313, h: 248 },
  { id: '11', title: 'Historic City Panorama', description: 'A panoramic view of a historic city captured during the early days of urban documentation.', period: '19th Century', location: 'European Urban Archive', image: 'assets/gallery/7379abcdb9d3081a1560c413315d06406bb5cf4c.png', x: 1518, y: 868, w: 330, h: 506 },
  { id: '12', title: 'Fortress and Cityscape', description: 'A historical view of a fortified city or castle complex.', period: '18th-19th Century', location: 'European Fortress Archive', image: 'assets/gallery/03720ca663068849ebed4c747ad5cdafcdd0eecd.png', x: 1832, y: 757, w: 308, h: 490 },
]

const API = 'assets/gallery/page-1.json'
const REMOTE_API = 'https://pdimagearchive.org/api/infinite-viewer/images'
const IMG = 'https://images.pdimagearchive.org'
const COL_W = 260
const COL_GAP = 24
const ROW_GAP = 16
const PADDING = 60
const BUFFER = 4
const LAZY_MARGIN = 600

function titleFromPath(path) {
  const name = path.replace(/\.\w+$/, '').split('/').pop() || ''
  return name.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export class GalleryView {
  constructor(bus, state) {
    this.bus = bus
    this.state = state
    this.rootEl = null
    this.items = []
    this.columns = []
    this.colCount = 0
    this.canvasW = 0
    this.canvasH = 0
    this.loadedPages = new Set()
    this.totalPages = null
    this.loading = false

    this.isDragging = false
    this.dragStartX = 0
    this.dragStartY = 0
    this.scrollLeft = 0
    this.scrollTop = 0
    this.selectedItem = null
    this.cursorVisible = false
    this._boundMousemove = null
    this._boundMouseleave = null
    this._isOnline = navigator.onLine
    this._raf = null
  }

  mount(rootEl) {
    this.rootEl = rootEl
    this._buildDOM()
    this._attachEvents()

    this._initColumns()
    this._loadPage(1)

    window.addEventListener('online', () => { this._isOnline = true })
    window.addEventListener('offline', () => { this._isOnline = false })
  }

  _buildDOM() {
    this.rootEl.innerHTML = `
      <div class="gallery-cursor" id="galleryCursor">
        <div class="gallery-cursor-dot">
          <div class="gallery-cursor-ring"></div>
          <span class="gallery-cursor-label">Learn more</span>
        </div>
      </div>

      <div class="gallery-canvas" id="galleryCanvas">
        <div class="gallery-canvas-inner" id="galleryCanvasInner">
          <div class="gallery-grid" id="galleryGrid"></div>
          <div class="gallery-items" id="galleryItems"></div>
        </div>
      </div>

      <div class="gallery-bottom-nav">
        <button class="gallery-surprise-btn" id="gallerySurpriseBtn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
          Surprise me
        </button>
        <div class="gallery-search-bar">
          <input type="text" placeholder="Search" id="gallerySearch" spellcheck="false">
        </div>
      </div>

      <div class="gallery-coords" id="galleryCoords" style="display:none">
        <div class="gallery-coords-inner">
          <p class="gallery-coords-text" id="galleryCoordsText">x: 0 &nbsp; y: 0</p>
        </div>
      </div>

      <div class="gallery-modal" id="galleryModal">
        <div class="gallery-modal-panel">
          <div class="gallery-modal-close" id="galleryModalClose">
            <div class="gallery-modal-close-inner">
              <div class="gallery-modal-close-icon">
                <svg viewBox="0 0 8 8" fill="none" stroke="currentColor" stroke-width="1.2">
                  <line x1="1" y1="1" x2="7" y2="7"/><line x1="7" y1="1" x2="1" y2="7"/>
                </svg>
              </div>
            </div>
          </div>
          <img class="gallery-modal-img" id="galleryModalImg" src="" alt="">
          <div class="gallery-modal-body">
            <h2 class="gallery-modal-title" id="galleryModalTitle"></h2>
            <p class="gallery-modal-description" id="galleryModalDesc"></p>
            <div class="gallery-modal-meta">
              <div class="gallery-modal-meta-row"><span class="gallery-modal-meta-label">Period:</span><span class="gallery-modal-meta-value" id="galleryModalPeriod"></span></div>
              <div class="gallery-modal-meta-row"><span class="gallery-modal-meta-label">Location:</span><span class="gallery-modal-meta-value" id="galleryModalLocation"></span></div>
            </div>
          </div>
        </div>
      </div>

    `
  }

  _buildGrid() {
    const grid = document.getElementById('galleryGrid')
    if (!grid) return
    this.canvasW = 2500
    this.canvasH = 1800
    this._updateCanvasSize()
    for (let row = 0; row < 20; row++) {
      const r = document.createElement('div')
      r.className = 'gallery-grid-row'
      for (let col = 0; col < 26; col++) {
        const c = document.createElement('div')
        c.className = 'gallery-grid-cell'
        r.appendChild(c)
      }
      grid.appendChild(r)
    }
  }

  _buildItems() {
    this._placeFallback()
  }

  _initColumns() {
    const vpW = window.innerWidth
    const visibleCols = Math.ceil((vpW - PADDING * 2) / (COL_W + COL_GAP))
    this.colCount = visibleCols + BUFFER * 2
    this.columns = new Array(this.colCount).fill(0)
    this.canvasW = this.colCount * (COL_W + COL_GAP) + PADDING * 2
    this.canvasH = Math.max(window.innerHeight * 3, PADDING * 2)
    this._updateCanvasSize()
  }

  _updateCanvasSize() {
    const inner = document.getElementById('galleryCanvasInner')
    if (inner) {
      inner.style.width = this.canvasW + 'px'
      inner.style.height = this.canvasH + 'px'
    }
  }

  async _loadPage(num) {
    if (this.loadedPages.has(num) || this.loading) return
    this.loading = true
    try {
      // Page 1 loads from local file (avoids CORS on Android)
      // Pages 2+ try remote API
      const url = num === 1 ? API : `${REMOTE_API}/${num}.json`
      const res = await fetch(url)
      if (!res.ok) throw new Error('fetch failed')
      const data = await res.json()
      this.totalPages = data.totalPages
      this.loadedPages.add(num)
      this._placeItems(data.images)
    } catch (e) {
      // If local file failed, try remote as fallback
      if (num === 1 && !this.loadedPages.has(1)) {
        try {
          const res = await fetch(`${REMOTE_API}/1.json`)
          if (!res.ok) throw new Error('remote fetch failed')
          const data = await res.json()
          this.totalPages = data.totalPages
          this.loadedPages.add(1)
          this._placeItems(data.images)
          return
        } catch (e2) {
          console.warn('Remote API also failed:', e2)
        }
      }
      if (this.items.length === 0) {
        this._buildGrid()
        this._buildItems()
      }
    } finally {
      this.loading = false
    }
  }

  _nextPageToLoad() {
    for (let i = 1; i <= (this.totalPages || 999); i++) {
      if (!this.loadedPages.has(i)) return i
    }
    return null
  }

  _placeItems(images) {
    this.items = []
    const container = document.getElementById('galleryItems')
    if (container) container.innerHTML = ''

    for (const img of images) {
      const h = Math.round(COL_W * (img.height / img.width))
      let minH = Infinity, minIdx = 0
      for (let i = 0; i < this.columns.length; i++) {
        if (this.columns[i] < minH) { minH = this.columns[i]; minIdx = i }
      }
      this.items.push({
        id: img.id,
        path: img.path,
        x: PADDING + minIdx * (COL_W + COL_GAP),
        y: PADDING + minH,
        w: COL_W,
        h,
        title: titleFromPath(img.path),
      })
      this.columns[minIdx] = minH + h + ROW_GAP
    }
    this.canvasW = this.colCount * (COL_W + COL_GAP) + PADDING * 2
    this.canvasH = Math.max(...this.columns) + PADDING * 2 + 200
    this._updateCanvasSize()
    this._renderVisible()
  }

  _placeFallback() {
    for (const item of FALLBACK_DATA) {
      this.items.push({
        id: item.id,
        path: '',
        x: item.x, y: item.y, w: item.w, h: item.h,
        title: item.title,
        _fallback: true,
        _data: item,
      })
    }
    this.canvasH = 1800
    this.canvasW = 2500
    this._updateCanvasSize()
    this._renderVisible()
  }

  _renderVisible() {
    const container = document.getElementById('galleryItems')
    const canvas = document.getElementById('galleryCanvas')
    if (!container || !canvas) return

    const L = canvas.scrollLeft - LAZY_MARGIN
    const R = canvas.scrollLeft + canvas.clientWidth + LAZY_MARGIN
    const T = canvas.scrollTop - LAZY_MARGIN
    const B = canvas.scrollTop + canvas.clientHeight + LAZY_MARGIN

    const visible = new Set()
    for (const item of this.items) {
      if (item.x + item.w >= L && item.x <= R && item.y + item.h >= T && item.y <= B) {
        visible.add(item.id)
      }
    }

    for (const el of container.children) {
      if (!visible.has(el.dataset.id)) {
        el.remove()
      }
    }

    for (const item of this.items) {
      if (!visible.has(item.id)) continue
      if (container.querySelector(`[data-id="${item.id}"]`)) continue

      const div = document.createElement('div')
      div.className = 'gallery-item'
      div.dataset.id = item.id
      div.style.cssText = `left:${item.x}px;top:${item.y}px;width:${item.w}px;height:${item.h}px;`

      const imgDiv = document.createElement('div')
      imgDiv.className = 'gallery-item-img'
      imgDiv.style.cssText = 'width:100%;height:100%;background-size:cover;background-position:center;'

      if (item._fallback) {
        imgDiv.style.backgroundImage = `url('${item._data.image}')`
      } else {
        const bg = new Image()
        bg.onload = () => { imgDiv.style.backgroundImage = `url('${IMG}${item.path}?width=${item.w}')` }
        bg.src = `${IMG}${item.path}?width=${item.w}`
      }

      div.appendChild(imgDiv)
      container.appendChild(div)
    }
  }

  _attachEvents() {
    const canvas = document.getElementById('galleryCanvas')
    const container = document.getElementById('galleryItems')
    if (!canvas) return

    function pointerX(e) { return e.touches ? e.touches[0].clientX : e.clientX }
    function pointerY(e) { return e.touches ? e.touches[0].clientY : e.clientY }

    canvas.addEventListener('mousedown', (e) => {
      if (e.target.closest('.gallery-search-bar, .gallery-modal, .gallery-modal-close')) return
      this.isDragging = true
      this.dragStartX = pointerX(e)
      this.dragStartY = pointerY(e)
      this.scrollLeft = canvas.scrollLeft
      this.scrollTop = canvas.scrollTop
      canvas.style.cursor = 'grabbing'
    })

    canvas.addEventListener('touchstart', (e) => {
      if (e.target.closest('.gallery-search-bar, .gallery-modal, .gallery-modal-close')) return
      this.isDragging = true
      this.dragStartX = pointerX(e)
      this.dragStartY = pointerY(e)
      this.scrollLeft = canvas.scrollLeft
      this.scrollTop = canvas.scrollTop
      this._dragTouchId = e.changedTouches[0].identifier
    }, { passive: true })

    function dragMove(e) {
      if (!this.isDragging) return
      const cx = pointerX(e)
      const cy = pointerY(e)
      if (e.touches) {
        const t = Array.from(e.changedTouches).find(t => t.identifier === this._dragTouchId)
        if (!t) return
      }
      canvas.scrollLeft = this.scrollLeft - (cx - this.dragStartX)
      canvas.scrollTop = this.scrollTop - (cy - this.dragStartY)
    }

    window.addEventListener('mousemove', dragMove.bind(this))
    canvas.addEventListener('touchmove', dragMove.bind(this), { passive: true })

    function dragEnd(e) {
      if (!this.isDragging) return
      if (e.changedTouches) {
        const t = Array.from(e.changedTouches).find(t => t.identifier === this._dragTouchId)
        if (!t) return
      }
      this.isDragging = false
      this._dragTouchId = null
      canvas.style.cursor = 'grab'
    }

    window.addEventListener('mouseup', dragEnd.bind(this))
    canvas.addEventListener('touchend', dragEnd.bind(this))

    let scrollRaf = null
    canvas.addEventListener('scroll', () => {
      if (scrollRaf) return
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = null
        this._renderVisible()

        const remaining = this.items.length - this.loadedPages.size * 200
        if (remaining < 100 && this._isOnline) {
          const next = this._nextPageToLoad()
          if (next) this._loadPage(next)
        }
      })
    })

    if (container) {
      container.addEventListener('click', (e) => {
        if (this.isDragging) return
        const el = e.target.closest('.gallery-item')
        if (!el) return
        const item = this.items.find(i => i.id === el.dataset.id)
        if (item) this._openModal(item)
      })
    }

    const searchInput = document.getElementById('gallerySearch')
    if (searchInput) {
      searchInput.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' || !searchInput.value.trim()) return
        const q = searchInput.value.trim().toLowerCase()
        const match = this.items.find(i => i.title.toLowerCase().includes(q))
        if (match) {
          searchInput.value = ''
          this._scrollTo(match)
          this._openModal(match)
        }
      })
    }

    const surpriseBtn = document.getElementById('gallerySurpriseBtn')
    if (surpriseBtn) {
      surpriseBtn.addEventListener('click', () => this._surpriseMe())
    }

    const modalClose = document.getElementById('galleryModalClose')
    if (modalClose) modalClose.addEventListener('click', () => this._closeModal())

    const modal = document.getElementById('galleryModal')
    if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) this._closeModal() })

    // Only show custom cursor on devices with fine pointers
    const hasFinePointer = window.matchMedia('(pointer: fine)').matches
    if (hasFinePointer) {
      this._boundMousemove = (e) => this._updateCursor(e)
      this._boundMouseleave = () => this._hideCursor()
      document.addEventListener('mousemove', this._boundMousemove)
      document.addEventListener('mouseleave', this._boundMouseleave)
      this.rootEl.addEventListener('mouseenter', () => { this.cursorVisible = true; this._updateCursor() })
      this.rootEl.addEventListener('mouseleave', () => { this.cursorVisible = false; this._hideCursor() })
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const modal = document.getElementById('galleryModal')
        if (modal?.classList.contains('open')) { this._closeModal(); return }
        const cg = document.getElementById('canvasGallery')
        if (cg?.classList.contains('open')) {
          cg.classList.remove('open')
          document.body.classList.remove('gallery-open')
          document.getElementById('deckBtn')?.classList.remove('active')
        }
      }
    })
  }

  _scrollTo(item) {
    const canvas = document.getElementById('galleryCanvas')
    if (!canvas) return
    canvas.scrollLeft = item.x + item.w / 2 - canvas.clientWidth / 2
    canvas.scrollTop = item.y + item.h / 2 - canvas.clientHeight / 2
    this._renderVisible()
  }

  _updateCursor(e) {
    const cursor = document.getElementById('galleryCursor')
    if (!cursor || !this.cursorVisible) return
    if (!this.rootEl?.classList.contains('open')) return
    cursor.classList.add('visible')
    cursor.style.left = (e?.clientX || 0) + 'px'
    cursor.style.top = (e?.clientY || 0) + 'px'
  }

  _hideCursor() {
    const cursor = document.getElementById('galleryCursor')
    if (cursor) cursor.classList.remove('visible', 'show-label')
  }

  _openModal(item) {
    const modal = document.getElementById('galleryModal')
    if (!modal) return
    if (item._fallback) {
      const d = item._data
      document.getElementById('galleryModalImg').src = d.image
      document.getElementById('galleryModalTitle').textContent = d.title
      document.getElementById('galleryModalDesc').textContent = d.description
      document.getElementById('galleryModalPeriod').textContent = d.period
      document.getElementById('galleryModalLocation').textContent = d.location
    } else {
      document.getElementById('galleryModalImg').src = `${IMG}${item.path}?width=600`
      document.getElementById('galleryModalTitle').textContent = item.title
      document.getElementById('galleryModalDesc').textContent = ''
      document.getElementById('galleryModalPeriod').textContent = ''
      document.getElementById('galleryModalLocation').textContent = ''
    }
    modal.classList.add('open')
  }

  _closeModal() {
    const modal = document.getElementById('galleryModal')
    if (modal) modal.classList.remove('open')
  }

  // ─── Surprise me ────────────────────────────────────────

  _surpriseMe() {
    if (this.items.length === 0) return
    const item = this.items[Math.floor(Math.random() * this.items.length)]
    this._openModal(item)
  }

  destroy() {
    this._hideCursor()
    if (this._boundMousemove) document.removeEventListener('mousemove', this._boundMousemove)
    if (this._boundMouseleave) document.removeEventListener('mouseleave', this._boundMouseleave)
    if (this.rootEl) this.rootEl.innerHTML = ''
  }
}
