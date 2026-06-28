import { Component } from './base/Component.js'
import { Api } from '../core/Api.js'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

const HERO_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
  'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
  'linear-gradient(135deg, #f5576c 0%, #ff6a88 100%)',
]

const SVG = {
  play: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"/></svg>',
  pause: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="14" y="3" width="5" height="18" rx="1"/><rect x="5" y="3" width="5" height="18" rx="1"/></svg>',
  'volume-2': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>',
  'volume-1': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>',
  'volume-x': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>',
  'picture-in-picture-2': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 9V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10c0 1.1.9 2 2 2h4"/><rect width="10" height="7" x="12" y="13" rx="2"/></svg>',
  'picture-in-picture': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 10V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/><path d="M10 10v5a1 1 0 0 0 1 1h5"/><rect x="2" y="10" width="6" height="7" rx="1"/></svg>',
  'maximize': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/></svg>',
  'skip-back': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.971 4.285A2 2 0 0 1 21 6v12a2 2 0 0 1-3.029 1.715l-9.997-5.998a2 2 0 0 1-.003-3.432z"/><path d="M3 20V4"/></svg>',
  'skip-forward': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 4v16"/><path d="M6.029 4.285A2 2 0 0 0 3 6v12a2 2 0 0 0 3.029 1.715l9.997-5.998a2 2 0 0 0 .003-3.432z"/></svg>',
}

export class GridView extends Component {
  constructor() {
    super()
    this.api = Api.getInstance()
    this.selectedItems = new Set()
    this._animDone = false
    this._dateInterval = null
    this._currentImageBlobUrl = null
    this._imageViewState = null
    this._heroGradient = HERO_GRADIENTS[Math.floor(Math.random() * HERO_GRADIENTS.length)]
    this._heroData = null
    this._avatarData = null
    this._activeView = 'home'
    this._animatingSwitch = false
    this._renderQueued = false
    this._savedScroll = { home: 0, grid: 0 }

    this.state.subscribe('videos', () => this._queueRender())
    this.state.subscribe('folders', () => this._queueRender())
    this.state.subscribe('notes', () => this._queueRender())
    this.state.subscribe('bookmarks', () => this._queueRender())
    this.state.subscribe('directAccess', () => this._queueRender())
    this.state.subscribe('pins', () => this._queueRender())
    this.state.subscribe('userName', () => this._queueRender())
    this.state.subscribe('externalFiles', () => this._queueRender())
    this.state.subscribe('pages', () => this._queueRender())

    this.on('ui:grid:refresh', () => this.render())
    this.on('ui:camera:open', () => this._handleCameraOpen())
    this.on('settings:hero:change', () => this._handleHeroPick())
    this.on('settings:hero:remove', () => this._clearHeroImage())
    this.on('settings:avatar:change', () => this._handleAvatarPick())
    this.on('settings:avatar:remove', () => this._clearAvatarImage())

    this._exposeGlobals()
  }

  _queueRender() {
    /* Batch multiple synchronous state changes into a single render via microtask */
    if (this._renderQueued) return
    this._renderQueued = true
    queueMicrotask(() => {
      this._renderQueued = false
      this.render()
    })
  }

  _haptic() {
    if (navigator.vibrate) navigator.vibrate(8)
    else window.Capacitor?.Plugins?.Haptics?.selectionChanged?.()
  }

  _exposeGlobals() {
    window.renderGridView = () => this._queueRender()
    window.startGridAnim = () => this._startAnim()
    window.takePicture = () => this._takePicture()
    window.renderProgressBar = (c, t, l) => this._renderProgressBar(c, t, l)
    window.renderNoteTodoPreview = (n) => this._renderNoteTodoPreview(n)
    window.burstParticles = (x, y, c) => this._burstParticles(x, y, c)
    window.todoBurst = (e) => this._todoBurst(e)
    window.openExternalText = (f) => this._openExternalText(f)
    window.openExternalVideo = (f) => this._openExternalVideo(f)
    window.closeExternalText = () => this._closeExternalText()
    window.closeExternalVideo = () => this._closeExternalVideo()
    window.openExternalImage = (f) => this._openExternalImage(f)
    window.closeExternalImage = () => this._closeExternalImage()
    window.backfillExtThumbnails = () => this._backfillThumbnails()
    window.syncViewTabs = (view) => this._syncTabs(view)
  }

  mount(rootEl) {
    super.mount(rootEl)
    this._bindDOMEvents()
    this._createBottomPill()
    this.render()
    this._backfillThumbnails()
    this._restoreBlobUrls()
    this._loadHeroImage()
    this._loadAvatarImage()
  }

  _bindDOMEvents() {
    this.listenTo(document.getElementById('extTextClose'), 'click', () => this._closeExternalText())
    this.listenTo(document.getElementById('extVideoClose'), 'click', () => this._closeExternalVideo())
    this.listenTo(document.getElementById('extImageClose'), 'click', () => this._closeExternalImage())

    this.listenTo(this.rootEl, 'click', (e) => {
      const tab = e.target.closest('.view-tab')
      if (!tab) return
      const view = tab.dataset.view
      if (view === 'circle') return
      if (view === this._activeView || this._animatingSwitch) return
      this._animateSwitch(view)
    })
    this.listenTo(this.rootEl, 'click', (e) => {
      const btn = e.target.closest('.view-tab-circle')
      if (!btn) return
      const overlay = document.getElementById('profileOverlay')
      if (!overlay) return
      const userName = this.state.getState('userName') || ''
      const now = new Date()
      const dayName = DAYS[now.getDay()]
      const monthName = MONTHS[now.getMonth()]
      const dateStr = `${dayName} • ${monthName} ${now.getDate()}, ${now.getFullYear()}`
      const online = navigator.onLine
      const conn = navigator.connection?.effectiveType
      const statusClass = !online ? 'offline' : (conn === 'slow-2g' || conn === '2g' ? 'weak' : 'online')
      let avatarHtml
      if (this._avatarData) {
        avatarHtml = `<img class="profile-avatar-img" src="${this._avatarData.dataUrl}" alt="Avatar">`
      } else {
        const firstLetter = (userName || 'U').charAt(0).toUpperCase()
        avatarHtml = `<div class="profile-avatar-letter">${firstLetter}</div>`
      }
      document.getElementById('profileContent').innerHTML = `
        <div class="profile-header">
          <div class="profile-avatar-wrap">
            ${avatarHtml}
            <span class="profile-avatar-status ${statusClass}"></span>
          </div>
          <div class="profile-meta">
            <div class="profile-name">${userName || 'Dashboard'}</div>
            <div class="profile-date">${dateStr}</div>
          </div>
        </div>
      `
      overlay.classList.add('open')
    })
    this.listenTo(document.getElementById('profileOverlay'), 'click', (e) => {
      if (e.target === document.getElementById('profileOverlay')) {
        document.getElementById('profileOverlay')?.classList.remove('open')
      }
    })

    /* ── Instagram-style swipe between home/grid tabs ── */
    let gvTouchStartX = 0, gvTouchStartY = 0
    let gvSwipeCurrentX = 0
    let gvSwipeActive = false
    const gvSwipeThreshold = 60
    const gvSwipeRatio = 0.8

    this.rootEl.addEventListener('touchstart', (e) => {
      gvTouchStartX = e.touches[0].clientX
      gvTouchStartY = e.touches[0].clientY
      gvSwipeCurrentX = gvTouchStartX
      gvSwipeActive = false
    }, { passive: true })

    this.rootEl.addEventListener('touchmove', (e) => {
      const dx = e.touches[0].clientX - gvTouchStartX
      const dy = e.touches[0].clientY - gvTouchStartY
      if (!gvSwipeActive && (Math.abs(dx) >= gvSwipeThreshold || Math.abs(dy) >= gvSwipeThreshold)) {
        if (Math.abs(dx) > Math.abs(dy) * 0.5) {
          gvSwipeActive = true
          document.getElementById('homeView')?.style.setProperty('overflow-y', 'hidden')
          document.getElementById('gridSections')?.style.setProperty('overflow-y', 'hidden')
        }
      }
      if (!gvSwipeActive) return

      if (Math.abs(dx) > Math.abs(dy)) e.preventDefault()

      gvSwipeCurrentX = e.touches[0].clientX

      /* Only show slide movement when gesture is strong enough to commit */
      const canShow = Math.abs(dx) > gvSwipeThreshold && Math.abs(dx) > Math.abs(dy) * gvSwipeRatio
      if (!canShow) return

      const swipeable = this.rootEl.querySelector('.grid-swipable')
      if (!swipeable) return

      const viewWidth = this.rootEl.offsetWidth
      const progress = dx / viewWidth
      const clamped = Math.max(-1, Math.min(1, progress))

      const hv = document.getElementById('homeView')
      const gs = document.getElementById('gridSections')

      const homeContent = hv?.querySelector('.home-view-content')
      const gridContent = gs?.querySelector('.grid-sections-content')

      /* Clamp dx to viewport width so the user can't overshoot */
      const cappedDx = this._activeView === 'home'
        ? Math.max(-viewWidth, Math.min(0, dx))
        : Math.max(0, Math.min(viewWidth, dx))

      if (this._activeView === 'home' && dx < 0) {
        if (hv) hv.style.zIndex = '2'
        if (gs) {
          gs.style.zIndex = '1'; gs.style.display = ''
          if (hv) gs.scrollTop = hv.scrollTop
        }
        if (homeContent) {
          homeContent.style.transition = 'none'
          homeContent.style.transform = `translateX(${cappedDx}px)`
        }
        if (gridContent) {
          gridContent.style.transition = 'none'
          gridContent.style.transform = `translateX(${viewWidth + cappedDx}px)`
        }
      } else if (this._activeView === 'grid' && dx > 0) {
        if (gs) gs.style.zIndex = '2'
        if (hv) {
          hv.style.zIndex = '1'; hv.style.display = 'flex'
          if (gs) hv.scrollTop = gs.scrollTop
        }
        if (gridContent) {
          gridContent.style.transition = 'none'
          gridContent.style.transform = `translateX(${cappedDx}px)`
        }
        if (homeContent) {
          homeContent.style.transition = 'none'
          homeContent.style.transform = `translateX(${-viewWidth + cappedDx}px)`
        }
      }

      if (hv) { hv.style.opacity = ''; hv.style.transform = '' }
      if (gs) { gs.style.opacity = ''; gs.style.transform = '' }
    }, { passive: false })

    this.rootEl.addEventListener('touchend', (e) => {
      if (!gvSwipeActive) return
      const dx = gvSwipeCurrentX - gvTouchStartX
      const dy = e.changedTouches[0].clientY - gvTouchStartY

      const hv = document.getElementById('homeView')
      const gs = document.getElementById('gridSections')
      const homeContent = hv?.querySelector('.home-view-content')
      const gridContent = gs?.querySelector('.grid-sections-content')
      const transition = 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)'

      if (homeContent) { homeContent.style.transition = transition }
      if (gridContent) { gridContent.style.transition = transition }

      const committed = Math.abs(dx) > gvSwipeThreshold && Math.abs(dx) > Math.abs(dy) * gvSwipeRatio

      if (committed) {
        if (dx > 0 && this._activeView !== 'home') {
          if (homeContent) { homeContent.style.transform = 'translateX(0)' }
          if (gridContent) { gridContent.style.transform = 'translateX(100%)' }
          this._syncTabs('home')
          this._haptic()
          setTimeout(() => { this._switchView('home') }, 350)
        } else if (dx < 0 && this._activeView !== 'grid') {
          if (gridContent) { gridContent.style.transform = 'translateX(0)' }
          if (homeContent) { homeContent.style.transform = 'translateX(-100%)' }
          this._syncTabs('grid')
          this._haptic()
          setTimeout(() => { this._switchView('grid') }, 350)
        } else {
          if (this._activeView === 'home') {
            if (homeContent) { homeContent.style.transform = 'translateX(0)' }
            if (gridContent) { gridContent.style.transform = 'translateX(100%)' }
            setTimeout(() => { this._switchView('home') }, 350)
          } else {
            if (gridContent) { gridContent.style.transform = 'translateX(0)' }
            if (homeContent) { homeContent.style.transform = 'translateX(-100%)' }
            setTimeout(() => { this._switchView('grid') }, 350)
          }
        }
      } else {
        if (this._activeView === 'home') {
          if (homeContent) { homeContent.style.transform = 'translateX(0)' }
          if (gridContent) { gridContent.style.transform = 'translateX(100%)' }
          setTimeout(() => { this._switchView('home') }, 350)
        } else {
          if (gridContent) { gridContent.style.transform = 'translateX(0)' }
          if (homeContent) { homeContent.style.transform = 'translateX(-100%)' }
          setTimeout(() => { this._switchView('grid') }, 350)
        }
      }

      document.getElementById('homeView')?.style.setProperty('overflow-y', '')
      document.getElementById('gridSections')?.style.setProperty('overflow-y', '')
      gvSwipeActive = false
    }, { passive: true })

    this.listenTo(document.getElementById('extVideoPlayBtn'), 'click', () => this._toggleVideoPlay())
    this.listenTo(document.getElementById('extVideoSkipBackBtn'), 'click', () => { this._videoSkip(-10); this._showSkipOverlay('skip-back') })
    this.listenTo(document.getElementById('extVideoSkipFwdBtn'), 'click', () => { this._videoSkip(10); this._showSkipOverlay('skip-forward') })
    this.listenTo(document.getElementById('extVideoMuteBtn'), 'click', () => this._toggleVideoMute())
    this.listenTo(document.getElementById('extVideoVolume'), 'input', (e) => this._videoVolume(e))
    this.listenTo(document.getElementById('extVideoFullscreenBtn'), 'click', () => this._toggleVideoFullscreen())
    this.listenTo(document.getElementById('extVideoPipBtn'), 'click', () => this._toggleVideoPip())
    this.listenTo(document.getElementById('extVideoProgress'), 'click', (e) => this._videoSeek(e))
    this.listenTo(document.getElementById('extVideoElement'), 'timeupdate', () => this._updateVideoControls())
    this.listenTo(document.getElementById('extVideoElement'), 'play', () => this._updateVideoPlayIcon(true))
    this.listenTo(document.getElementById('extVideoElement'), 'pause', () => this._updateVideoPlayIcon(false))
    this.listenTo(document.getElementById('extVideoElement'), 'volumechange', () => this._updateVideoVolumeUI())
    this.listenTo(document.getElementById('extVideoElement'), 'loadedmetadata', () => {
      this._updateVideoControls()
      this._adaptVideoPlayerSize()
    })
    this.listenTo(document.getElementById('extVideoElement'), 'enterpictureinpicture', () => this._updatePipIcon(true))
    this.listenTo(document.getElementById('extVideoElement'), 'leavepictureinpicture', () => this._updatePipIcon(false))
    this.listenTo(document.getElementById('extVideoElement'), 'click', (e) => {
      if (this._extVideoDbl) {
        clearTimeout(this._extVideoDbl)
        this._extVideoDbl = null
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const edge = rect.width * 0.3
        if (x < edge) { this._videoSkip(-10); this._showSkipOverlay('skip-back') }
        else if (x > rect.width - edge) { this._videoSkip(10); this._showSkipOverlay('skip-forward') }
        return
      }
      this._extVideoDbl = setTimeout(() => {
        this._extVideoDbl = null
        this._toggleVideoPlay()
      }, 220)
    })



  }

  _createBottomPill() {
    if (document.querySelector('.mobile-nav-bar')) return

    const bar = document.createElement('div')
    bar.className = 'mobile-nav-bar'

    bar.innerHTML = `
      <div class="sidebar-fab">
        <button class="fab-btn" id="menuBtn" title="Sidebar">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
      </div>
      <div class="grid-fab">
        <button class="fab-btn" id="gridBtn" title="Dashboard">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/></svg>
        </button>
      </div>
      <div class="bottom-nav-pill">
        <button class="pill-icon-btn" id="mobileSearchBtn" title="Search">
          <svg xmlns="http://www.w3.org/2000/svg" class="pill-icon-search" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        </button>
        <div class="pill-input-wrap"><input type="text" id="kiroInput" placeholder="Search..." spellcheck="false"></div>
      </div>
      <div class="page-fab-set" id="pageFabSet">
        <div class="page-fab page-fab-trigger">
          <button class="fab-btn" title="Add block">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          </button>
        </div>
        <div class="page-fab page-note-fab">
          <button class="fab-btn" data-page-action="note" title="Add Note">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/></svg>
          </button>
        </div>
        <div class="page-fab page-photo-fab">
          <button class="fab-btn" data-page-action="photo" title="Add Photo">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </button>
        </div>
        <div class="page-fab page-video-fab">
          <button class="fab-btn" data-page-action="video" title="Import Video">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
          </button>
        </div>
        <div class="page-fab-popup" id="pageFabPopup">
          <div class="page-fab-grid-row">
            <div class="page-fab-grid-btn" data-page-action="note" data-page-popup-action="new">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/></svg>
              <span>New note</span>
            </div>
            <div class="page-fab-grid-btn" data-page-action="photo" data-page-popup-action="pick">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              <span>New image</span>
            </div>
          </div>
          <div class="page-fab-grid-row">
            <div class="page-fab-grid-btn" data-page-action="photo" data-page-popup-action="new">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
              <span>New photo</span>
            </div>
            <div class="page-fab-grid-btn page-fab-grid-close">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              <span>Close</span>
            </div>
          </div>
        </div>
      </div>
      <div class="add-fab">
        <button class="fab-btn" id="mobileAddBtn" title="Add" style="background:#F54927">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M19 13h-6v6a1 1 0 1 1-2 0v-6H5a1 1 0 1 1 0-2h6V5a1 1 0 1 1 2 0v6h6a1 1 0 1 1 0 2z"/></svg>
        </button>
        <div class="add-menu-backdrop" id="addMenuBackdrop"></div>
        <div class="add-menu-popup" id="addMenuPopup">
          <div class="add-menu-item" data-action="note">
            New note
            <span class="add-menu-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/></svg></span>
          </div>
          <div class="add-menu-item" data-action="folder">
            New folder
            <span class="add-menu-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg></span>
          </div>
          <div class="add-menu-item" data-action="import">
            Import file
            <span class="add-menu-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m17 8-5-5-5 5"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/></svg></span>
          </div>
          <div class="add-menu-item" data-action="camera">
            Take picture
            <span class="add-menu-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg></span>
          </div>
          <div class="add-menu-item" data-action="bookmark">
            New bookmark
            <span class="add-menu-icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg></span>
          </div>
        </div>
      </div>
    `
    document.body.appendChild(bar)
    this._bindMobilePillEvents()
  }

  _bindMobilePillEvents() {
    const bar = document.querySelector('.mobile-nav-bar')
    const gridBtn = document.getElementById('gridBtn')
    const pillBtn = document.getElementById('mobileSearchBtn')
    const addBtn = document.getElementById('mobileAddBtn')
    const popup = document.getElementById('addMenuPopup')

    function isSearchActive() { return bar && bar.classList.contains('search-active') }
    function enterSearch() { if (bar) { bar.classList.add('search-active'); popup?.classList.remove('open') } }
    function exitSearch() { if (bar) { bar.classList.remove('search-active') } }
    function isShipActive() { return bar && bar.classList.contains('ship-active') }
    function enterShip() { if (bar) { bar.classList.add('ship-active'); popup?.classList.remove('open') } }
    function exitShip() { if (bar) { bar.classList.remove('ship-active') } }

    if (gridBtn) {
      gridBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        const anyExtOpen = this._anyExternalViewOpen()
        if (anyExtOpen) {
          this._hideAllViews()
          this.rootEl.classList.add('open')
          this.render()
          this._switchView('grid')
        } else {
          this._animateSwitch('grid')
        }
      })
    }

    if (pillBtn) {
      pillBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        if (isShipActive()) { exitShip(); document.getElementById('kiroInput')?.blur(); return }
        if (isSearchActive()) { exitSearch() }
        enterShip()
        const input = document.getElementById('kiroInput')
        if (input) setTimeout(() => input.focus(), 50)
      })
    }

    const searchInput = document.getElementById('kiroInput')
    if (searchInput) {
      searchInput.addEventListener('focus', () => {
        this.bus.emit('ui:view:set', { view: 'landing' })
      })
      searchInput.addEventListener('blur', (e) => {
        if (!e.target.value.trim()) {
          const landing = document.getElementById('searchLanding')
          if (landing?.style.display === 'flex') {
            this.bus.emit('ui:view:set', { view: 'home' })
          }
        }
      })
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); this._handleSearchFromInput() }
        if (e.key === 'Escape') { e.target.blur() }
      })
    }

    if (addBtn && popup) {
      addBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        if (addBtn.classList.contains('page-close')) {
          this._hideAllViews()
          this.rootEl.classList.add('open')
          this._switchView('grid')
          return
        }
        if (isShipActive()) { exitShip(); document.getElementById('kiroInput')?.blur(); return }
        if (isSearchActive()) { popup.classList.remove('open'); exitSearch(); return }
        if (popup.classList.contains('open')) { popup.classList.remove('open'); return }
        popup.classList.add('open')
      })

      popup.addEventListener('click', (e) => {
        const item = e.target.closest('.add-menu-item')
        if (!item) return
        const action = item.dataset.action
        popup.classList.remove('open')
        if (action === 'note') this._handleNewNote()
        else if (action === 'folder') this._openMobileFolderDialog()
        else if (action === 'import') this._importFile()
        else if (action === 'camera') this._takePicture()
        else if (action === 'bookmark') window.openBookmarkDialog?.()
      })
    }

    const backdrop = document.getElementById('addMenuBackdrop')
    if (backdrop) {
      backdrop.addEventListener('click', () => popup?.classList.remove('open'))
    }

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.mobile-nav-bar')) {
        popup?.classList.remove('open')
        if (isShipActive()) { exitShip(); document.getElementById('kiroInput')?.blur() }
        if (isSearchActive()) { exitSearch() }
        if (document.getElementById('searchLanding')?.style.display === 'flex') {
          this._switchView('grid')
        }
      }
    })

    // Page mode buttons
    const pageFabSet = document.getElementById('pageFabSet')
    if (pageFabSet) {
      pageFabSet.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-page-action]')
        if (!btn) return
        const action = btn.dataset.pageAction
        window.__pageMobileAction?.(action)
      })

      // Collapsed trigger opens grid popup on narrow mobile
      const trigger = pageFabSet.querySelector('.page-fab-trigger')
      if (trigger) {
        trigger.addEventListener('click', (e) => {
          e.stopPropagation()
          window.__pageMobileAction?.()
        })
      }
    }
  }

  /* ─── Hero image (pick, crop, persist) ────────────── */
  _loadHeroImage() {
    const api = Api.getInstance()
    const repo = api.getRepository('settings')
    Promise.resolve(repo.get('heroImage')).then(saved => {
      if (saved) {
        const { dataUrl, offsetX = 0, offsetY = 0 } = saved
        this._heroData = { dataUrl, offsetX, offsetY }
        this._applyHeroImage()
      }
    }).catch(() => {})
  }

  _saveHeroImage() {
    if (!this._heroData) return
    const api = Api.getInstance()
    const repo = api.getRepository('settings')
    const { dataUrl, offsetX, offsetY } = this._heroData
    Promise.resolve(repo.set('heroImage', { dataUrl, offsetX, offsetY })).catch(() => {})
  }

  _handleHeroPick() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (!file) return
      this._heroOpenCrop(file)
    }
    input.click()
  }

  _heroCompress(file) {
    return new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const maxDim = 1600
          let w = img.width, h = img.height
          if (w > maxDim || h > maxDim) {
            const ratio = Math.min(maxDim / w, maxDim / h)
            w *= ratio; h *= ratio
          }
          const canvas = document.createElement('canvas')
          canvas.width = w; canvas.height = h
          canvas.getContext('2d').drawImage(img, 0, 0, w, h)
          resolve(canvas.toDataURL('image/jpeg', 0.85))
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    })
  }

  _heroOpenCrop(file) {
    const heroEl = document.querySelector('.dashboard-hero')
    const heroAspect = heroEl ? (heroEl.offsetWidth / heroEl.offsetHeight) : 2

    const overlay = document.createElement('div')
    overlay.className = 'hero-crop-overlay'
    overlay.innerHTML = `
      <div class="hero-crop-stage">
        <div class="hero-crop-img" id="heroCropImg"></div>
        <div class="hero-crop-window" style="aspect-ratio:${heroAspect}"></div>
      </div>
      <div class="hero-crop-bar">
        <button class="hero-crop-done" id="heroCropDone">Done</button>
      </div>
    `
    document.body.appendChild(overlay)

    this._heroCompress(file).then(dataUrl => {
      const bg = overlay.querySelector('#heroCropImg')
      bg.style.backgroundImage = `url(${dataUrl})`

      const state = {
        ox: this._heroData?.offsetX || 0,
        oy: this._heroData?.offsetY || 0,
        startX: 0, startY: 0,
        dragging: false
      }

      function update() {
        bg.style.backgroundSize = '150%'
        bg.style.backgroundPosition = `calc(50% + ${state.ox}px) calc(50% + ${state.oy}px)`
      }

      /* touch pan */
      bg.addEventListener('touchstart', e => {
        if (e.touches.length !== 1) return
        state.startX = e.touches[0].clientX - state.ox
        state.startY = e.touches[0].clientY - state.oy
      }, { passive: true })

      bg.addEventListener('touchmove', e => {
        if (e.touches.length !== 1) return
        state.ox = e.touches[0].clientX - state.startX
        state.oy = e.touches[0].clientY - state.startY
        update()
      }, { passive: true })

      /* mouse pan */
      bg.addEventListener('mousedown', e => {
        state.dragging = true
        state.startX = e.clientX - state.ox
        state.startY = e.clientY - state.oy
        bg.style.cursor = 'grabbing'
      })

      document.addEventListener('mousemove', e => {
        if (!state.dragging) return
        state.ox = e.clientX - state.startX
        state.oy = e.clientY - state.startY
        update()
      })

      document.addEventListener('mouseup', () => {
        if (state.dragging) { state.dragging = false; bg.style.cursor = 'grab' }
      })

      overlay.querySelector('#heroCropDone').addEventListener('click', () => {
        this._heroData = { dataUrl, offsetX: state.ox, offsetY: state.oy }
        this._saveHeroImage()
        this._applyHeroImage()
        overlay.remove()
      })
      bg.style.cursor = 'grab'
      update()
    })
  }

  _applyHeroImage() {
    const hero = document.querySelector('.dashboard-hero')
    if (!hero) return
    if (this._heroData) {
      hero.classList.add('has-image')
      hero.style.backgroundImage = `url(${this._heroData.dataUrl})`
      hero.style.backgroundSize = '150%'
      hero.style.backgroundPosition = `calc(50% + ${this._heroData.offsetX}px) calc(50% + ${this._heroData.offsetY}px)`
      hero.style.backgroundRepeat = 'no-repeat'
    } else {
      hero.classList.remove('has-image')
      hero.style.backgroundImage = ''
      hero.style.backgroundSize = ''
      hero.style.backgroundPosition = ''
      hero.style.backgroundRepeat = ''
    }
  }

  _clearHeroImage() {
    this._heroData = null
    this._heroGradient = HERO_GRADIENTS[Math.floor(Math.random() * HERO_GRADIENTS.length)]
    this._applyHeroImage()
    this._saveHeroImage()
    this.render()
  }

  _loadAvatarImage() {
    const api = Api.getInstance()
    const repo = api.getRepository('settings')
    Promise.resolve(repo.get('avatarImage')).then(saved => {
      if (saved) {
        this._avatarData = saved
        this.render()
      }
    }).catch(() => {})
  }

  _saveAvatarImage() {
    const api = Api.getInstance()
    const repo = api.getRepository('settings')
    Promise.resolve(repo.set('avatarImage', this._avatarData)).catch(() => {})
  }

  _handleAvatarPick() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (!file) return
      this._compressAvatar(file)
    }
    input.click()
  }

  _compressAvatar(file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const maxDim = 400
        let w = img.width, h = img.height
        if (w > maxDim || h > maxDim) {
          const ratio = Math.min(maxDim / w, maxDim / h)
          w *= ratio; h *= ratio
        }
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        this._avatarData = { dataUrl: canvas.toDataURL('image/jpeg', 0.85) }
        this._saveAvatarImage()
        this.render()
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  }

  _applyAvatarImage() {
    const wrap = document.querySelector('.dashboard-avatar-wrap')
    if (!wrap) return
    const existing = wrap.querySelector('.dashboard-avatar-img')
    if (this._avatarData) {
      const avatar = wrap.querySelector('.dashboard-avatar')
      if (avatar) avatar.style.display = 'none'
      if (!existing) {
        const img = document.createElement('img')
        img.className = 'dashboard-avatar-img'
        img.alt = 'Avatar'
        const status = wrap.querySelector('.dashboard-avatar-status')
        wrap.insertBefore(img, status)
      }
      wrap.querySelector('.dashboard-avatar-img').src = this._avatarData.dataUrl
    } else {
      if (existing) existing.remove()
      const avatar = wrap.querySelector('.dashboard-avatar')
      if (avatar) avatar.style.display = ''
    }
  }

  _clearAvatarImage() {
    this._avatarData = null
    this._saveAvatarImage()
    this.render()
  }

  _openMobileFolderDialog() {
    const input = document.getElementById('folderNameInput')
    if (input) input.value = ''
    document.querySelectorAll('.folder-color').forEach(c => c.classList.remove('active'))
    const first = document.querySelector('.folder-color')
    if (first) first.classList.add('active')
    document.getElementById('folderDialog')?.classList.add('open')
    setTimeout(() => input?.focus(), 100)
  }

  render() {
    if (!this.rootEl) return
    const el = this.rootEl

    /* Save scroll position before DOM rebuild */
    const oldHv = document.getElementById('homeView')
    const oldGs = document.getElementById('gridSections')
    const savedHomeScroll = oldHv ? oldHv.scrollTop : 0
    const savedGridScroll = oldGs ? oldGs.scrollTop : 0

    const folders = this.state.getState('folders') || {}
    const folderMeta = this.state.getState('folderMeta') || {}
    const videos = this.state.getState('videos') || {}
    const notes = this.state.getState('notes') || []
    const bookmarks = this.state.getState('bookmarks') || []
    const directAccess = this.state.getState('directAccess') || []
    const externalFiles = this.state.getState('externalFiles') || []
    const pins = this.state.getState('pins') || []
    const userName = this.state.getState('userName') || ''

    let html = ''

    const pages = this.state.getState('pages') || []
    html += `<div class="grid-section"><div class="grid-section-header"><i data-lucide="layout-dashboard" style="width:16px;height:16px;flex-shrink:0"></i> Pages</div><div class="grid-items">`
    for (const p of pages) html += this._pageCard(p)
    html += '</div></div>'

    for (const [name, ids] of Object.entries(folders)) {
      const folderNotes = notes.filter(n => n.folder === name)
      const folderExt = externalFiles.filter(f => f.folder === name)
      if (!ids.length && !folderNotes.length && !folderExt.length) continue
      const color = folderMeta[name]?.color || ''
      const hasContents = ids.length || folderNotes.length || folderExt.length

      html += `<div class="grid-section"><div class="grid-section-header"${color ? ` style="color:${color}"` : ''}><i data-lucide="${hasContents ? 'folder-fill' : 'folder'}" style="width:16px;height:16px;flex-shrink:0"></i> ${name}</div><div class="grid-items">`

      for (const id of ids) {
        const v = videos[id]
        if (!v) continue
        const thumb = v.thumbnail || `https://img.youtube.com/vi/${id}/maxresdefault.jpg`
        const pinned = pins.includes(id)
        html += this._videoCard(id, v, thumb, pinned)
      }

      for (const n of folderNotes) {
        html += this._noteCard(n)
      }

      for (const f of folderExt) {
        html += this._externalFileCard(f)
      }

      html += '</div></div>'
    }

    if (bookmarks.length) {
      html += `<div class="grid-section"><div class="grid-section-header"><i data-lucide="bookmark-fill" style="width:16px;height:16px;flex-shrink:0"></i> Bookmarks</div><div class="grid-items">`
      for (const bm of bookmarks) html += this._bookmarkCard(bm)
      html += '</div></div>'
    }

    const unassignedNotes = notes.filter(x => !x.folder)
    if (unassignedNotes.length) {
      html += `<div class="grid-section"><div class="grid-section-header"><i data-lucide="file-text-fill" style="width:16px;height:16px;flex-shrink:0"></i> Notes</div><div class="grid-items">`
      for (const n of unassignedNotes) html += this._noteCard(n)
      html += '</div></div>'
    }

    const unassignedExt = externalFiles.filter(f => !f.folder)
    if (unassignedExt.length) {
      html += `<div class="grid-section"><div class="grid-section-header"><i data-lucide="folder-fill" style="width:16px;height:16px;flex-shrink:0"></i> External Files</div><div class="grid-items">`
      for (const f of unassignedExt) html += this._externalFileCard(f)
      html += '</div></div>'
    }

    if (directAccess.length) {
      html += `<div class="grid-section"><div class="grid-section-header"><i data-lucide="link" style="width:16px;height:16px;flex-shrink:0"></i> Direct Access</div><div class="grid-items">`
      for (const d of directAccess) html += this._daCard(d)
      html += '</div></div>'
    }

    el.innerHTML = this._dashboardHTML(userName) + `<div class="grid-sections" id="gridSections">${this._headerHTML(userName)}<div class="grid-sections-content">${html}<div class="content-spacer"></div></div></div>`

    /* Wrap homeView and gridSections in swipable container */
    const hv = document.getElementById('homeView')
    const gs = document.getElementById('gridSections')
    if (hv && gs && !hv.parentElement?.classList.contains('grid-swipable')) {
      const wrapper = document.createElement('div')
      wrapper.className = 'grid-swipable'
      el.insertBefore(wrapper, gs)
      wrapper.appendChild(hv)
      wrapper.appendChild(gs)
    }

    const heroEl = el.querySelector('.dashboard-hero')
    if (heroEl) heroEl.onclick = () => this._handleHeroPick()

    if (!this._animDone) {
      el.querySelectorAll('.grid-section').forEach(s => s.classList.add('grid-section-anim'))
      el.querySelectorAll('.grid-item').forEach(s => s.classList.add('grid-item-anim'))
      const hero = el.querySelector('.dashboard-hero')
      if (hero) hero.classList.add('grid-section-anim')
    }

    /* Sticky header — just toggle .stuck, no scroll saves */
    ;[hv, gs].forEach(view => {
      if (!view) return
      const onScroll = () => {
        const tabs = view.querySelector('#viewTabs')
        const hero = view.querySelector('.dashboard-hero')
        if (tabs && hero) tabs.classList.toggle('stuck', view.scrollTop >= hero.offsetHeight + 60)
      }
      view.removeEventListener('scroll', view._stickyScroll)
      view._stickyScroll = onScroll
      view.addEventListener('scroll', onScroll, { passive: true })
    })

    /* Restore scroll after DOM rebuild (only place saves are needed) */
    requestAnimationFrame(() => {
      const newHv = document.getElementById('homeView')
      const newGs = document.getElementById('gridSections')
      if (newHv) newHv.scrollTop = savedHomeScroll
      if (newGs) newGs.scrollTop = savedGridScroll
      const activeEl = this._activeView === 'home' ? newHv : newGs
      if (activeEl) {
        const tabs = activeEl.querySelector('#viewTabs')
        const hero = activeEl.querySelector('.dashboard-hero')
        if (tabs && hero) tabs.classList.toggle('stuck', activeEl.scrollTop >= hero.offsetHeight + 60)
      }
    })

    this._updateDate()
    if (!this._dateInterval) {
      this._dateInterval = setInterval(() => this._updateDate(), 30000)
    }

    this._attachItemEvents(el, videos, bookmarks, directAccess, notes, externalFiles)
    this._attachDropEvents(el, folders)
    this._updateBatchBar()

    this.bus.emit('ui:icons:load-needed')
    this._applyViewState(this._activeView)
    this._syncTabs(this._activeView)
  }

  _dashboardHTML(userName) {
    const pages = this.state.getState('pages') || []
    const homePagesHtml = pages.length ? pages.map(p => this._pageCard(p)).join('') + this._newPageCard() : this._newPageCard()
    const homeEmptyDisplay = pages.length ? 'none' : ''
    return `<div id="homeView" class="home-view">
        ${this._headerHTML(userName)}
        <div class="home-view-content">
          <div class="home-view-pages" id="homeViewPages">${homePagesHtml}</div>
          <div class="home-view-empty" id="homeViewEmpty" style="display:${homeEmptyDisplay}">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <p class="home-view-empty-text">Your home view is empty</p>
          </div>
          <div class="content-spacer"></div>
        </div>
      </div>`
  }

  _headerHTML(userName) {
    const now = new Date()
    const dayName = DAYS[now.getDay()]
    const monthName = MONTHS[now.getMonth()]
    const dateStr = `${dayName} • ${monthName} ${now.getDate()}, ${now.getFullYear()}`
    const online = navigator.onLine
    const conn = navigator.connection?.effectiveType
    const statusClass = !online ? 'offline' : (conn === 'slow-2g' || conn === '2g' ? 'weak' : 'online')
    let heroStyle
    if (this._heroData) {
      heroStyle = `background-image:url(${this._heroData.dataUrl});background-size:150%;background-position:calc(50% + ${this._heroData.offsetX}px) calc(50% + ${this._heroData.offsetY}px);background-repeat:no-repeat`
    } else {
      heroStyle = `background:${this._heroGradient}`
    }
    let avatarHtml
    if (this._avatarData) {
      avatarHtml = `<img class="dashboard-avatar-img" src="${this._avatarData.dataUrl}" alt="Avatar">`
    } else {
      const firstLetter = (userName || 'U').charAt(0).toUpperCase()
      avatarHtml = `<div class="dashboard-avatar">${firstLetter}</div>`
    }
    return `<div class="dashboard-hero${this._heroData ? ' has-image' : ''}" style="${heroStyle}"></div>
      <div class="view-tabs" id="viewTabs">
        <button class="view-tab view-tab-circle" data-view="circle">${avatarHtml}</button>
        <button class="view-tab active" data-view="home">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          Home
        </button>
        <button class="view-tab" data-view="grid">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-inbox-icon lucide-inbox"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
          Grid
        </button>
      </div>`
  }

  _videoCard(id, v, thumb, pinned) {
    const stale = v._stale
    const heart = v.favorited ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/></svg>' : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/></svg>'
    return `<div class="grid-item${stale ? ' stale' : ''}" data-video-id="${id}">
      <div class="grid-item-img-wrap">
        <div class="grid-item-actions">
          <button class="grid-item-menu grid-item-action-btn" onclick="event.stopPropagation()"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg></button>
          <button class="grid-item-action-btn grid-item-heart${v.favorited ? ' active' : ''}" onclick="event.stopPropagation()">${heart}</button>
        </div>
        ${pinned ? '<span class="grid-item-badge">Pinned</span>' : '<span class="grid-item-badge">Video</span>'}
        ${stale ? '<div class="stale-overlay"><i data-lucide="play-off" style="width:22px;height:22px"></i></div>' : ''}
        <img class="grid-item-img${stale ? ' stale-img' : ''}" src="${thumb}" loading="lazy" onerror="this.src='https://img.youtube.com/vi/${id}/hqdefault.jpg'" />
      </div>
      <div class="grid-item-body${stale ? ' stale-info' : ''}">
        <div class="grid-item-title-row">
          <span class="grid-item-title">${v.title}</span>
        </div>
        <span class="grid-item-sublabel">${v.channel}</span>
      </div>
    </div>`
  }

  _noteCard(n) {
    const preview = this._stripHtml(n.content || '').replace(/\n/g, ' ').substring(0, 80)
    const hasTodos = n.todos && n.todos.length
    const noteIcon = hasTodos ? 'list-todo' : 'file-text'
    const todoHtml = this._renderNoteTodoPreview(n)
    const heart = n.favorited ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/></svg>' : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/></svg>'
    return `<div class="grid-item note" data-note-id="${n.id}">
      <div class="grid-item-img-wrap" style="background:#e8e8ed">
        <div class="grid-item-actions">
          <button class="grid-item-menu grid-item-action-btn" onclick="event.stopPropagation()"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg></button>
          <button class="grid-item-action-btn grid-item-heart${n.favorited ? ' active' : ''}" onclick="event.stopPropagation()">${heart}</button>
        </div>
        <span class="grid-item-badge">Note</span>
        <div style="display:flex;align-items:center;justify-content:center;height:100%"><i data-lucide="${noteIcon}" style="width:28px;height:28px;color:#8e8e93"></i></div>
      </div>
      <div class="grid-item-body">
        <div class="grid-item-title-row">
          <span class="grid-item-title">${n.title || 'Untitled'}</span>
        </div>
        <span class="grid-item-sublabel">${preview}${this._stripHtml(n.content || '').length > 80 ? '…' : ''}</span>
        ${todoHtml}
      </div>
    </div>`
  }

  _externalFileCard(f) {
    const nsfw = f.blurred || false
    const isVideo = /\.(mp4|webm|mkv|avi|mov|flv|wmv|m4v|3gp|mpeg|mpg)$/i.test(f.name)
    const isAudio = /\.(mp3|wav|ogg|flac|m4a)$/i.test(f.name)
    const isImage = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(f.name)
    const isText = /\.(txt|md|json|xml|html|css|js|py|java|c|cpp|h|ts)$/i.test(f.name)
    const thumb = f.thumbnail || ''
    const heart = f.favorited ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/></svg>' : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/></svg>'
    let imgContent
    if (thumb) {
      imgContent = `<img class="grid-item-img${nsfw ? ' nsfw-blur' : ''}" src="${thumb}" loading="lazy" onerror="this.style.display='none'" />`
    } else {
      let icon = 'file'
      if (isVideo) icon = 'file-video-2'
      else if (isAudio) icon = 'music'
      else if (isImage) icon = 'image'
      else if (isText) icon = 'file-text'
      imgContent = `<div style="display:flex;align-items:center;justify-content:center;height:100%"><i data-lucide="${icon}" style="width:28px;height:28px;color:#8e8e93"></i></div>`
    }
    return `<div class="grid-item ext-file" data-ext-id="${f.id}">
      <div class="grid-item-img-wrap">
        <div class="grid-item-actions">
          <button class="grid-item-menu grid-item-action-btn" onclick="event.stopPropagation()"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg></button>
          <button class="grid-item-action-btn grid-item-heart${f.favorited ? ' active' : ''}" onclick="event.stopPropagation()">${heart}</button>
        </div>
        <span class="grid-item-badge">File</span>
        ${imgContent}
      </div>
      <div class="grid-item-body">
        <div class="grid-item-title-row">
          <span class="grid-item-title" style="font-size:12px">${this._escapeHtml(f.name)}</span>
        </div>
        <span class="grid-item-sublabel" style="font-size:10px">${this._formatSize(f.size)}</span>
      </div>
    </div>`
  }

  _bookmarkCard(bm) {
    const nsfw = bm.blurred || false
    const heart = bm.favorited ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/></svg>' : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/></svg>'
    const imgContent = bm.image
      ? `<img class="grid-item-img${nsfw ? ' nsfw-blur' : ''}" src="${bm.image}" loading="lazy" onerror="this.style.display='none'" />`
      : `<div style="display:flex;align-items:center;justify-content:center;height:100%"><i data-lucide="external-link" style="width:28px;height:28px;color:#8e8e93"></i></div>`
    return `<div class="grid-item bm" data-bookmark-id="${bm.id}">
      <div class="grid-item-img-wrap">
        <div class="grid-item-actions">
          <button class="grid-item-menu grid-item-action-btn" onclick="event.stopPropagation()"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg></button>
          <button class="grid-item-action-btn grid-item-heart${bm.favorited ? ' active' : ''}" onclick="event.stopPropagation()">${heart}</button>
        </div>
        <span class="grid-item-badge">Bookmark</span>
        ${imgContent}
      </div>
      <div class="grid-item-body">
        <div class="grid-item-title-row">
          <span class="grid-item-title">${bm.title || bm.url}</span>
        </div>
        <span class="grid-item-sublabel">${bm.url}</span>
      </div>
    </div>`
  }

  _daCard(d) {
    const heart = d.favorited ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/></svg>' : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/></svg>'
    const imgContent = d.image
      ? `<img class="grid-item-img" src="${d.image}" loading="lazy" onerror="this.style.display='none'" />`
      : `<div style="display:flex;align-items:center;justify-content:center;height:100%"><i data-lucide="external-link" style="width:28px;height:28px;color:#8e8e93"></i></div>`
    return `<div class="grid-item bm" data-da-id="${d.id}">
      <div class="grid-item-img-wrap">
        <div class="grid-item-actions">
          <button class="grid-item-menu grid-item-action-btn" onclick="event.stopPropagation()"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg></button>
          <button class="grid-item-action-btn grid-item-heart${d.favorited ? ' active' : ''}" onclick="event.stopPropagation()">${heart}</button>
        </div>
        <span class="grid-item-badge">Link</span>
        ${imgContent}
      </div>
      <div class="grid-item-body">
        <div class="grid-item-title-row">
          <span class="grid-item-title">${d.title}</span>
        </div>
        <span class="grid-item-sublabel">${d.url}</span>
      </div>
    </div>`
  }

  _pageCard(p) {
    const preview = p.blocks?.length ? p.blocks.length + ' block' + (p.blocks.length > 1 ? 's' : '') : 'Empty'
    const title = p.title || 'Untitled'
    const heart = p.favorited ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/></svg>' : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/></svg>'
    const imgContent = p.heroImage
      ? `<img class="grid-item-img" src="${p.heroImage}" loading="lazy">`
      : `<div style="display:flex;align-items:center;justify-content:center;height:100%;flex-direction:column;gap:4px">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#8e8e93"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
        </div>`
    return `<div class="grid-item page" data-page-id="${p.id}">
      <div class="grid-item-img-wrap">
        <div class="grid-item-actions">
          <button class="grid-item-menu grid-item-action-btn" onclick="event.stopPropagation()"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg></button>
          <button class="grid-item-action-btn grid-item-heart${p.favorited ? ' active' : ''}" onclick="event.stopPropagation()">${heart}</button>
        </div>
        <span class="grid-item-badge">Page</span>
        ${imgContent}
      </div>
      <div class="grid-item-body">
        <div class="grid-item-title-row">
          <span class="grid-item-title">${title}</span>
        </div>
        <span class="grid-item-sublabel">${preview}</span>
      </div>
    </div>`
  }

  _newPageCard() {
    return `<div class="grid-item page new-page" data-action="new-page">
      <div class="grid-item-img-wrap" style="display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color:#8e8e93"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
      </div>
      <div class="grid-item-body">
        <div class="grid-item-title-row">
          <span class="grid-item-title" style="color:#8e8e93">Create new page</span>
        </div>
        <span class="grid-item-sublabel">&nbsp;</span>
      </div>
    </div>`
  }

  _updateDate() {
    const el = this.rootEl?.querySelector('.dashboard-date')
    if (!el) return
    const d = new Date()
    el.textContent = `${DAYS[d.getDay()]} • ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
  }

  _attachItemEvents(el, videos, bookmarks, directAccess, notes, externalFiles) {
    el.querySelectorAll('[data-video-id]').forEach(item => {
      this._addDragEvents(item, 'video', el)
      item.addEventListener('click', () => {
        const id = item.dataset.videoId
        if (!id) return
        const v = videos[id]
        if (v && v._stale) { this._showNotFoundToast(id, el); return }
        if (id) this.bus.emit('ui:card:load-video', { id })
      })
    })

    el.querySelectorAll('[data-bookmark-id]').forEach(item => {
      const bm = bookmarks.find(b => b.id === item.dataset.bookmarkId)
      if (bm?.url) item.addEventListener('click', () => window.open(bm.url))
    })

    el.querySelectorAll('[data-da-id]').forEach(item => {
      const d = directAccess.find(x => x.id === item.dataset.daId)
      if (d?.url) item.addEventListener('click', () => window.open(d.url))
    })

    el.querySelectorAll('[data-note-id]').forEach(item => {
      item.addEventListener('click', () => {
        const nid = item.dataset.noteId
        if (nid) this.bus.emit('ui:note:open', { id: nid })
      })
    })

    el.querySelectorAll('[data-page-id]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation()
        const id = item.dataset.pageId
        if (id) this.bus.emit('ui:page:open', { id })
      })
    })
    el.querySelectorAll('[data-action="new-page"]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation()
        this.bus.emit('ui:page:create')
      })
    })
    const homePages = document.getElementById('homeViewPages')
    if (homePages) {
      homePages.querySelectorAll('[data-page-id]').forEach(item => {
        item.addEventListener('click', (e) => {
          e.stopPropagation()
          const id = item.dataset.pageId
          if (id) this.bus.emit('ui:page:open', { id })
        })
      })
    }

    el.querySelectorAll('[data-ext-id]').forEach(item => {
      item.addEventListener('click', () => {
        const f = externalFiles.find(x => x.id === item.dataset.extId)
        if (!f) return
        const isVideo = /\.(mp4|webm|mkv|avi|mov|flv|wmv|m4v|3gp|mpeg|mpg)$/i.test(f.name)
        const isText = /\.(txt|md|json|xml|html|css|js|py|java|c|cpp|h|ts)$/i.test(f.name)
        const isImage = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(f.name)
        const isElectron = typeof process !== 'undefined' && process.versions?.electron
        if (isText && isElectron && f.path) {
          this._openExternalText(f)
        } else if (isVideo && f.path) {
          this._openExternalVideo(f)
        } else if (isImage && f.path) {
          this._openExternalImage(f)
        } else if (f._stale) {
          this._reimportStaleFile(f)
        } else if (f.path) {
          if (isElectron) {
            window.require('electron').shell.openPath(f.path)
          } else if (window.cordova || window.Capacitor) {
            window.open(f.path)
          }
        }
      })
    })

    el.querySelectorAll('.grid-item-menu').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        const item = btn.closest('.grid-item')
        const rect = btn.getBoundingClientRect()
        this.bus.emit('ui:context-menu:show', {
          x: rect.right, y: rect.bottom,
          videoId: item.dataset.videoId || null,
          bookmarkId: item.dataset.bookmarkId || null,
          noteId: item.dataset.noteId || null,
          daId: item.dataset.daId || null,
          extId: item.dataset.extId || null,
          pageId: item.dataset.pageId || null,
        })
      })
    })

    el.querySelectorAll('.grid-item').forEach(item => {
      item.addEventListener('contextmenu', (e) => {
        e.preventDefault()
        this.bus.emit('ui:context-menu:show', {
          x: e.clientX, y: e.clientY,
          videoId: item.dataset.videoId || null,
          bookmarkId: item.dataset.bookmarkId || null,
          noteId: item.dataset.noteId || null,
          daId: item.dataset.daId || null,
          extId: item.dataset.extId || null,
          pageId: item.dataset.pageId || null,
        })
      })
    })

    el.querySelectorAll('.grid-item-heart').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        const item = btn.closest('.grid-item')
        const videoId = item.dataset.videoId
        const bookmarkId = item.dataset.bookmarkId
        const noteId = item.dataset.noteId
        const daId = item.dataset.daId
        const extId = item.dataset.extId
        const pageId = item.dataset.pageId
        if (videoId) {
          const vs = window.getVideos?.() || {}
          const v = vs[videoId]
          if (v) { v.favorited = !v.favorited; window.saveVideos?.(vs) }
        } else if (bookmarkId) {
          const bms = window.getBookmarks?.() || []
          const b = bms.find(x => x.id === bookmarkId)
          if (b) { b.favorited = !b.favorited; window.saveBookmarks?.(bms) }
        } else if (noteId) {
          const notes = window.getNotes?.() || []
          const n = notes.find(x => x.id === noteId)
          if (n) { n.favorited = !n.favorited; window.saveNotes?.(notes) }
        } else if (daId) {
          const das = window.getDirectAccess?.() || []
          const d = das.find(x => x.id === daId)
          if (d) { d.favorited = !d.favorited; window.saveDirectAccess?.(das) }
        } else if (extId) {
          const files = window.getExternalFiles?.() || []
          const f = files.find(x => x.id === extId)
          if (f) { f.favorited = !f.favorited; window.saveExternalFiles?.(files) }
        } else if (pageId) {
          const pages = window.getPages?.() || []
          const p = pages.find(x => x.id === pageId)
          if (p) { p.favorited = !p.favorited; window.savePages?.(pages) }
        }
      })
    })

    el.addEventListener('click', (e) => {
      if (!e.ctrlKey && !e.metaKey) return
      const item = e.target.closest('.grid-item')
      if (!item) return
      e.preventDefault(); e.stopPropagation()
      const id = item.dataset.videoId || item.dataset.bookmarkId || item.dataset.noteId || item.dataset.daId || item.dataset.extId
      if (!id) return
      if (this.selectedItems.has(id)) { this.selectedItems.delete(id); item.classList.remove('selected') }
      else { this.selectedItems.add(id); item.classList.add('selected') }
      this._updateBatchBar()
    })
  }

  _addDragEvents(item, type, container) {
    item.setAttribute('draggable', 'true')
    let tdState = null

    item.addEventListener('touchstart', (e) => {
      if (document.getElementById('ctxMenu')?.classList.contains('open')) return
      const t = e.touches[0]
      tdState = {
        dragId: item.dataset.videoId || item.dataset.bookmarkId || item.dataset.noteId || item.dataset.daId || item.dataset.extId,
        dragType: type,
        folder: (item.closest('.grid-section')?.querySelector('.grid-section-header')?.textContent?.trim()) || '',
        startX: t.clientX, startY: t.clientY, lastX: t.clientX, lastY: t.clientY,
        active: false,
        timer: setTimeout(() => { if (document.getElementById('ctxMenu')?.classList.contains('open')) return; tdState.active = true; item.classList.add('dragging'); if (navigator.vibrate) navigator.vibrate(8) }, 500)
      }
    }, { passive: true })

    item.addEventListener('touchmove', (e) => {
      if (!tdState) return
      const t = e.touches[0]; tdState.lastX = t.clientX; tdState.lastY = t.clientY
      if (!tdState.active) { if (Math.abs(t.clientX - tdState.startX) > 12 || Math.abs(t.clientY - tdState.startY) > 12) { clearTimeout(tdState.timer); tdState = null } return }
      e.preventDefault()
      container.querySelectorAll('.grid-item.drag-before, .grid-item.drag-after').forEach(i => i.classList.remove('drag-before', 'drag-after'))
      const target = document.elementFromPoint(t.clientX, t.clientY)
      const targetItem = target?.closest('.grid-item')
      if (!targetItem || targetItem === item) return
      const rect = targetItem.getBoundingClientRect()
      targetItem.classList.toggle('drag-before', t.clientY < rect.top + rect.height / 2)
      targetItem.classList.toggle('drag-after', t.clientY >= rect.top + rect.height / 2)
    }, { passive: false })

    item.addEventListener('touchend', (e) => {
      if (!tdState) return
      clearTimeout(tdState.timer)
      if (tdState.active && !document.getElementById('ctxMenu')?.classList.contains('open')) {
        const moved = Math.abs(tdState.lastX - tdState.startX) > 12 || Math.abs(tdState.lastY - tdState.startY) > 12
        if (moved) {
          this._handleDropReorder(tdState.dragId, tdState.dragType, tdState.folder, tdState.lastX, tdState.lastY, container)
        } else {
          e.preventDefault()
          container.querySelectorAll('.grid-item.dragging').forEach(i => i.classList.remove('dragging'))
          const itemRect = item.getBoundingClientRect()
          this.bus.emit('ui:context-menu:show', {
            x: itemRect.right, y: itemRect.bottom,
            videoId: item.dataset.videoId || null,
            bookmarkId: item.dataset.bookmarkId || null,
            noteId: item.dataset.noteId || null,
            daId: item.dataset.daId || null,
            extId: item.dataset.extId || null,
            pageId: item.dataset.pageId || null,
          })
        }
      }
      tdState = null
    })

    item.addEventListener('touchcancel', () => {
      if (tdState) { clearTimeout(tdState.timer); if (tdState.active) container.querySelectorAll('.grid-item.drag-before, .grid-item.drag-after, .grid-item.dragging').forEach(i => i.classList.remove('drag-before', 'drag-after', 'dragging')); tdState = null }
    })

    item.addEventListener('dragstart', (e) => {
      const id = item.dataset.videoId || item.dataset.bookmarkId || item.dataset.noteId || item.dataset.daId || item.dataset.extId
      const section = item.closest('.grid-section')
      const folder = section?.querySelector('.grid-section-header')?.textContent?.trim() || ''
      e.dataTransfer.setData('text/plain', id || '')
      e.dataTransfer.setData('type', type)
      e.dataTransfer.setData('folder', folder)
      e.dataTransfer.effectAllowed = 'move'
      item.classList.add('dragging')
    })

    item.addEventListener('dragover', (e) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      const t = e.dataTransfer.getData('type')
      const myId = item.dataset.videoId || item.dataset.bookmarkId || item.dataset.noteId || item.dataset.daId || item.dataset.extId
      if (t === type && e.dataTransfer.getData('text/plain') !== myId) {
        const rect = item.getBoundingClientRect()
        item.classList.toggle('drag-before', e.clientY < rect.top + rect.height / 2)
        item.classList.toggle('drag-after', e.clientY >= rect.top + rect.height / 2)
      }
    })

    item.addEventListener('dragleave', () => item.classList.remove('drag-before', 'drag-after'))

    item.addEventListener('drop', (e) => {
      e.preventDefault()
      item.classList.remove('drag-before', 'drag-after')
      const draggedId = e.dataTransfer.getData('text/plain')
      const draggedType = e.dataTransfer.getData('type')
      const folderName = e.dataTransfer.getData('folder')
      if (!draggedId || draggedType !== type) return
      this._handleDropReorder(draggedId, draggedType, folderName, e.clientX, e.clientY, container)
    })

    item.addEventListener('dragend', () => {
      item.classList.remove('dragging', 'drag-before', 'drag-after')
      container.querySelectorAll('.grid-item.drag-before, .grid-item.drag-after, .grid-item.dragging').forEach(i => i.classList.remove('drag-before', 'drag-after', 'dragging'))
    })
  }

  _handleDropReorder(dragId, dragType, folderName, clientX, clientY, container) {
    const target = document.elementFromPoint(clientX, clientY)
    const targetItem = target?.closest('.grid-item')
    if (!targetItem) return

    const targetId = targetItem.dataset.videoId || targetItem.dataset.bookmarkId || targetItem.dataset.noteId || targetItem.dataset.daId || targetItem.dataset.extId
    if (!targetId || dragId === targetId) return

    const rect = targetItem.getBoundingClientRect()
    const insertBefore = clientY < rect.top + rect.height / 2

    this.bus.emit('ui:grid:reorder', { dragId, dragType, folderName, targetId, insertBefore })
  }

  _attachDropEvents(el) {
    el.querySelectorAll('.grid-section-header').forEach(header => {
      header.addEventListener('dragover', function(e) { e.preventDefault(); this.classList.add('drop-zone') })
      header.addEventListener('dragleave', function() { this.classList.remove('drop-zone') })
      header.addEventListener('drop', (e) => {
        e.preventDefault(); header.classList.remove('drop-zone')
        const id = e.dataTransfer.getData('text/plain')
        const type = e.dataTransfer.getData('type')
        if (!id) return
        const text = header.textContent.trim()
        this.bus.emit('ui:grid:drop-on-folder', { id, type, folderName: text })
      })
    })
  }

  _updateBatchBar() {
    const bar = document.getElementById('batchBar')
    const count = document.getElementById('batchCount')
    const len = this.selectedItems.size
    if (bar && count) {
      if (len) { bar.style.display = 'flex'; count.textContent = len + ' selected' }
      else bar.style.display = 'none'
    }
  }

  _handleNewNote() {
    const notes = window.getNotes?.() || []
    const id = '_nt_' + Date.now()
    notes.push({ id, title: 'Untitled', content: '', added: Date.now() })
    window.saveNotes?.(notes)
    if (window.renderSidebar) window.renderSidebar()
    if (window.openNote) window.openNote(id)
  }

  _base64ToBlobUrl(b64, ext) {
    const mimeMap = { mp4: 'video/mp4', webm: 'video/webm', mkv: 'video/x-matroska', avi: 'video/x-msvideo', mov: 'video/quicktime', flv: 'video/x-flv', wmv: 'video/x-ms-wmv', m4v: 'video/mp4', '3gp': 'video/3gpp', mpeg: 'video/mpeg', mpg: 'video/mpeg', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', bmp: 'image/bmp' }
    const raw = atob(b64)
    const bytes = new Uint8Array(raw.length)
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
    return URL.createObjectURL(new Blob([bytes], { type: mimeMap[ext] || 'application/octet-stream' }))
  }

  _capFileCounter = 0

  async _persistCapacitorFile(contentUri, fileName, fileSize, mimeType) {
    if (!window.Capacitor?.Plugins?.Filesystem) return null
    try {
      const fs = window.Capacitor.Plugins.Filesystem
      const r = await fs.readFile({ path: contentUri })
      if (!r?.data) return null
      const ext = fileName && fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : ''
      const localName = 'ext_' + Date.now() + '_' + (++this._capFileCounter) + (ext ? '.' + ext : '')
      await fs.writeFile({ path: localName, data: r.data, directory: 'Data' })
      const uriResult = await fs.getUri({ path: localName, directory: 'Data' })
      const displayUrl = window.Capacitor.convertFileSrc
        ? window.Capacitor.convertFileSrc(uriResult.uri)
        : uriResult.uri
      const blobUrl = this._base64ToBlobUrl(r.data, ext)
      return { name: fileName, path: displayUrl, size: fileSize, mimeType, _fn: localName, _blobUrl: blobUrl }
    } catch (e) {
      console.warn('[PersistCapacitor] Failed:', e)
      return null
    }
  }

  async _importFile() {
    await this._handleFileImport()
  }

  _showImportLoader() { const el = document.getElementById('importLoader'); if (el) el.classList.add('show') }
  _hideImportLoader() { const el = document.getElementById('importLoader'); if (el) el.classList.remove('show') }

  async _handleFileImport() {
    // Capacitor native (Android, iOS, macOS via Mac Catalyst)
    if (window.Capacitor?.isNativePlatform?.()) {
      try {
        const fp = window.Capacitor.Plugins.FilePicker
        if (!fp) throw new Error('FilePicker plugin not available')
        // Only Android needs explicit permission requests
        if (window.Capacitor.getPlatform() === 'android') {
          try {
            const permResult = await fp.checkPermissions()
            if (permResult.readExternalStorage !== 'granted') {
              const reqResult = await fp.requestPermissions({ permissions: ['readExternalStorage'] })
              if (reqResult.readExternalStorage !== 'granted') {
                console.warn('[Import] Storage permission denied')
                return
              }
            }
          } catch (permErr) {}
        }
        let pickerResult
        if (window.Capacitor.Plugins.PhotoPicker) {
          try {
            pickerResult = await window.Capacitor.Plugins.PhotoPicker.pick({ limit: 0 })
          } catch (e) {
            if (e.message !== 'canceled') console.warn('[Import] PhotoPicker failed, falling back:', e)
          }
        }
        if (!pickerResult?.files?.length) {
          pickerResult = await fp.pickMedia({ limit: 0 })
        }
        if (!pickerResult?.files?.length) return
        this._showImportLoader()
        try {
          const persistResults = await Promise.all(pickerResult.files.map(f =>
            this._persistCapacitorFile(f.path || f.uri || f.name, f.name, f.size || 0, f.mimeType || '')
          ))
          const entries = persistResults.filter(Boolean)
          if (entries.length) this._addExternalFiles(entries)
        } finally {
          this._hideImportLoader()
        }
      } catch (e) {
        if (e.message?.includes?.('canceled')) return
        console.warn('[Import] Capacitor file-picker failed:', e)
      }
      return
    }

    // Electron (macOS, Windows, Linux)
    const isElectron = typeof process !== 'undefined' && process.versions?.electron
    if (isElectron) {
      try {
        const { dialog } = window.require('@electron/remote') || {}
        if (dialog) {
          const result = await dialog.showOpenDialog({ properties: ['openFile', 'multiSelections'] })
          if (!result.canceled && result.filePaths?.length) {
            const entries = result.filePaths.map(p => ({
              name: p.split(/[/\\]/).pop(), path: p, size: 0, mimeType: '',
            }))
            this._addExternalFiles(entries)
          }
          return
        }
      } catch {}
      try {
        const result = await window.require('electron').ipcRenderer.invoke('open-file-dialog')
        if (result?.filePaths?.length) {
          const entries = result.filePaths.map(p => ({
            name: p.split(/[/\\]/).pop(), path: p, size: 0, mimeType: '',
          }))
          this._addExternalFiles(entries)
        }
      } catch {}
    }
  }

  _addExternalFiles(entries) {
    const existing = window.getExternalFiles?.() || []
    const created = []
    for (const e of entries) {
      const id = '_ext_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)
      const entry = {
        id, name: e.name, path: e.path, size: e.size || 0,
        mimeType: e.mimeType || '', added: Date.now(), blurred: false,
      }
      if (e._fn) entry._fn = e._fn
      if (e._blobUrl) entry._blobUrl = e._blobUrl
      existing.push(entry)
      created.push(entry)
    }
    window.saveExternalFiles?.(existing)
    this.state.setState('externalFiles', existing)
    // Fire thumbnail generation for all new entries (parallel)
    for (const entry of created) this._generateThumbnail(entry)
    if (window.renderSidebar) window.renderSidebar()
    if (window.renderGridView) window.renderGridView()
  }

  async _reimportStaleFile(entry) {
    if (window.Capacitor?.isNativePlatform?.()) {
      // Transparently restore from persisted Data directory — no picker needed
      if (entry._fn && window.Capacitor?.Plugins?.Filesystem) {
        try {
          const fs = window.Capacitor.Plugins.Filesystem
          const r = await fs.readFile({ path: entry._fn, directory: 'Data' })
          if (r?.data) {
            const ext = entry._fn.split('.').pop().toLowerCase()
            entry._blobUrl = this._base64ToBlobUrl(r.data, ext)
            delete entry._stale
            delete entry.thumbnail
            const files = window.getExternalFiles?.() || []
            window.saveExternalFiles?.(files)
            this.state.setState('externalFiles', files)
            await this._generateThumbnail(entry)
            if (window.renderGridView) window.renderGridView()
            return true
          }
        } catch (e) {
          console.warn('[Reimport] Transparent restore failed, falling back to picker:', e)
        }
      }
      try {
        const fp = window.Capacitor.Plugins.FilePicker
        if (!fp) throw new Error('FilePicker plugin not available')
        if (window.Capacitor.getPlatform() === 'android') {
          try {
            const permResult = await fp.checkPermissions()
            if (permResult.readExternalStorage !== 'granted') {
              const reqResult = await fp.requestPermissions({ permissions: ['readExternalStorage'] })
              if (reqResult.readExternalStorage !== 'granted') {
                console.warn('[Reimport] Storage permission denied')
                return false
              }
            }
          } catch (permErr) {}
        }
        let pickerResult
        if (window.Capacitor.Plugins.PhotoPicker) {
          try {
            pickerResult = await window.Capacitor.Plugins.PhotoPicker.pick({ limit: 1 })
          } catch (e) {
            if (e.message !== 'canceled') console.warn('[Reimport] PhotoPicker failed, falling back:', e)
          }
        }
        if (!pickerResult?.files?.length) {
          pickerResult = await fp.pickMedia({ limit: 1 })
        }
        if (!pickerResult?.files?.length) return false
        const file = pickerResult.files[0]
        let path = file.path || file.uri || file.name
        let localName = null
        let blobUrl = null
        if (path && (path.startsWith('content://') || path.startsWith('file://'))) {
          const persistResult = await this._persistCapacitorFile(path, file.name)
          if (persistResult) {
            path = persistResult.url
            localName = persistResult.localName
            blobUrl = persistResult.blobUrl
          }
        }
        entry.name = file.name
        entry.path = path
        if (localName) entry._fn = localName
        if (blobUrl) entry._blobUrl = blobUrl
        entry.size = file.size || 0
        entry.mimeType = file.mimeType || ''
        delete entry.thumbnail
        delete entry._stale
        const files = window.getExternalFiles?.() || []
        window.saveExternalFiles?.(files)
        this.state.setState('externalFiles', files)
        await this._generateThumbnail(entry)
        if (window.renderGridView) window.renderGridView()
        return true
      } catch (e) {
        if (e.message?.includes?.('canceled')) return false
        console.warn('[Reimport] Capacitor file-picker failed:', e)
        return false
      }
    }
  }

  async _generateThumbnail(entry) {
    const isImage = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(entry.name)
    const isVideo = /\.(mp4|webm|mkv|avi|mov|flv|wmv|m4v|3gp|mpeg|mpg)$/i.test(entry.name)
    if (!entry.path || !(isImage || isVideo)) return
    const isElectron = typeof process !== 'undefined' && process.versions?.electron

    if (isImage) {
      if (isElectron) {
        try {
          const fs = window.require('fs')
          const stat = fs.statSync(entry.path)
          if (stat.size > 2 * 1024 * 1024) {
            entry.thumbnail = this._toFileURL(entry.path)
            this._saveThumbnail(entry)
            return
          }
          const buf = fs.readFileSync(entry.path)
          const ext = entry.name.split('.').pop().toLowerCase()
          const mime = ext === 'jpg' ? 'jpeg' : ext === 'svg' ? 'svg+xml' : ext
          entry.thumbnail = 'data:image/' + mime + ';base64,' + buf.toString('base64')
          this._saveThumbnail(entry)
        } catch (e) {
          console.warn('[Thumbnail] Failed to read image:', e)
        }
      } else {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          try {
            const c = document.createElement('canvas')
            const s = Math.min(320 / img.naturalWidth, 180 / img.naturalHeight, 1)
            c.width = Math.round(img.naturalWidth * s)
            c.height = Math.round(img.naturalHeight * s)
            const ctx = c.getContext('2d')
            if (ctx) { ctx.drawImage(img, 0, 0, c.width, c.height); entry.thumbnail = c.toDataURL('image/jpeg', 0.6); this._saveThumbnail(entry) }
          } catch (e) { console.warn('[Thumbnail] Image canvas failed:', e) }
        }
        img.onerror = () => {}
        img.src = entry.path
      }
      return
    }

    if (isVideo) {
      const vid = document.createElement('video')
      vid.muted = true
      vid.playsInline = true
      if (isElectron) {
        try {
          const fs = window.require('fs')
          const buf = fs.readFileSync(entry.path)
          const ext = entry.name.split('.').pop().toLowerCase()
          const mimeMap = { mp4: 'video/mp4', webm: 'video/webm', mkv: 'video/x-matroska', avi: 'video/x-msvideo', mov: 'video/quicktime', flv: 'video/x-flv', wmv: 'video/x-ms-wmv', m4v: 'video/mp4', '3gp': 'video/3gpp', mpeg: 'video/mpeg', mpg: 'video/mpeg' }
          const blob = new Blob([buf], { type: mimeMap[ext] || 'video/mp4' })
          vid.src = URL.createObjectURL(blob)
        } catch (e) {
          console.warn('[Thumbnail] Failed to read video file:', e)
          return
        }
      } else {
        vid.src = entry.path
      }
      if (!vid.src) { console.warn('[Thumbnail] No valid video source'); return }
      vid.style.position = 'absolute'
      vid.style.left = '-9999px'
      document.body.appendChild(vid)
      const cleanup = () => { try { vid.remove() } catch {} }
      vid.addEventListener('loadeddata', () => {
        if (vid.duration) vid.currentTime = Math.min(vid.duration * 0.3, 5)
      })
      vid.addEventListener('seeked', () => {
        try {
          if (vid.videoWidth > 0 && vid.videoHeight > 0) {
            const canvas = document.createElement('canvas')
            const scale = Math.min(320 / vid.videoWidth, 180 / vid.videoHeight, 1)
            canvas.width = Math.round(vid.videoWidth * scale)
            canvas.height = Math.round(vid.videoHeight * scale)
            const ctx = canvas.getContext('2d')
            if (ctx) { ctx.drawImage(vid, 0, 0, canvas.width, canvas.height); entry.thumbnail = canvas.toDataURL('image/jpeg', 0.6) }
          }
        } catch (e) { console.warn('[Thumbnail] seeked drawImage failed:', e) }
        cleanup()
        if (entry.thumbnail && entry.thumbnail.length > 50) this._saveThumbnail(entry)
      })
      vid.addEventListener('error', (e) => {
        console.warn('[Thumbnail] Video error:', vid.error?.message || vid.error, entry.path)
        cleanup()
      })
      vid.load()
    }
  }

  _saveThumbnail(entry) {
    const ext = window.getExternalFiles?.() || []
    const f = ext.filter(x => x.id === entry.id)[0]
    if (!f) return
    f.thumbnail = entry.thumbnail
    window.saveExternalFiles?.(ext)
    this.state.setState('externalFiles', ext)
    if (window.renderGridView) window.renderGridView()
  }

  _backfillThumbnails() {
    const ext = window.getExternalFiles?.() || []
    let dirty = false
    const isElectron = typeof process !== 'undefined' && process.versions?.electron
    for (const entry of ext) {
      if (!isElectron && entry.path && entry.path.startsWith('blob:')) {
        entry._stale = true
        dirty = true
      } else if (!isElectron && entry._stale) {
        delete entry._stale
        dirty = true
      }
      if (isElectron && entry.path && !entry._stale) {
        try {
          const fs = window.require('fs')
          fs.accessSync(entry.path)
        } catch {
          entry._stale = true
          dirty = true
        }
      }
      if (entry.thumbnail) continue
      const isImage = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(entry.name)
      const isVideo = /\.(mp4|webm|mkv|avi|mov|flv|wmv|m4v|3gp|mpeg|mpg)$/i.test(entry.name)
      if (!isImage && !isVideo) continue
      dirty = true
      this._generateThumbnail(entry)
    }
    if (dirty) {
      window.saveExternalFiles?.(ext)
      this.state.setState('externalFiles', ext)
      if (window.renderSidebar) window.renderSidebar()
    }
  }

  async _restoreBlobUrls() {
    if (!window.Capacitor?.isNativePlatform?.() || !window.Capacitor?.Plugins?.Filesystem) return
    const files = window.getExternalFiles?.() || []
    const fs = window.Capacitor.Plugins.Filesystem
    let dirty = false
    for (const entry of files) {
      const isImage = entry.name && /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(entry.name)
      if (!isImage || !entry._fn) continue
      try {
        const r = await fs.readFile({ path: entry._fn, directory: 'Data' })
        if (!r?.data) continue
        const ext = entry._fn.split('.').pop().toLowerCase()
        entry._blobUrl = this._base64ToBlobUrl(r.data, ext)
        dirty = true
      } catch (e) {
        console.warn('[RestoreBlob] Failed:', entry._fn, e)
      }
    }
    if (dirty) {
      window.saveExternalFiles?.(files)
      this.state.setState('externalFiles', files)
    }
  }

  _hideAllViews() {
    document.getElementById('noteView').style.display = 'none'
    document.getElementById('pageView').style.display = 'none'
    document.getElementById('pagePicker').style.display = 'none'
    document.getElementById('gridView').classList.remove('open')
    document.getElementById('extTextView').style.display = 'none'
    document.getElementById('extVideoView').style.display = 'none'
    document.getElementById('extImageView').style.display = 'none'
    const ct = document.querySelector('.content')
    if (ct) ct.style.display = 'none'
    const sl = document.getElementById('searchLanding')
    if (sl) sl.style.display = 'none'
    const ve = document.getElementById('extVideoElement')
    if (ve) ve.pause()
    this._resetImageZoom()
    this.bus.emit('ui:page:close')
    // Restore mobile nav bar
    const navBar = document.querySelector('.mobile-nav-bar')
    if (navBar) navBar.classList.remove('page-mode')
    const addBtn = document.getElementById('mobileAddBtn')
    if (addBtn) addBtn.classList.remove('page-close')
  }

  _animateSwitch(view) {
    if (view === this._activeView || this._animatingSwitch) return
    this._animatingSwitch = true
    const hv = document.getElementById('homeView')
    const gs = document.getElementById('gridSections')
    const homeContent = hv?.querySelector('.home-view-content')
    const gridContent = gs?.querySelector('.grid-sections-content')
    const transition = 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)'

    /* Show the target view and prevent scrolling during animation */
    if (view === 'grid') {
      if (gs) { gs.style.zIndex = '1'; gs.style.display = '' }
      if (hv) hv.style.zIndex = '2'
    } else {
      if (hv) { hv.style.zIndex = '1'; hv.style.display = 'flex' }
      if (gs) gs.style.zIndex = '2'
    }
    if (hv) hv.style.setProperty('overflow-y', 'hidden')
    if (gs) gs.style.setProperty('overflow-y', 'hidden')

    /* Set initial positions (no transition) */
    if (homeContent) homeContent.style.transition = 'none'
    if (gridContent) gridContent.style.transition = 'none'
    if (view === 'grid') {
      if (homeContent) homeContent.style.transform = 'translateX(0)'
      if (gridContent) gridContent.style.transform = 'translateX(100%)'
    } else {
      if (gridContent) gridContent.style.transform = 'translateX(0)'
      if (homeContent) homeContent.style.transform = 'translateX(-100%)'
    }

    void (homeContent || gridContent)?.offsetHeight

    /* Animate to final positions */
    if (homeContent) homeContent.style.transition = transition
    if (gridContent) gridContent.style.transition = transition
    if (view === 'grid') {
      if (homeContent) homeContent.style.transform = 'translateX(-100%)'
      if (gridContent) gridContent.style.transform = 'translateX(0)'
    } else {
      if (gridContent) gridContent.style.transform = 'translateX(100%)'
      if (homeContent) homeContent.style.transform = 'translateX(0)'
    }

    this._syncTabs(view)
    this._haptic()
    setTimeout(() => {
      this._animatingSwitch = false
      document.getElementById('homeView')?.style.setProperty('overflow-y', '')
      document.getElementById('gridSections')?.style.setProperty('overflow-y', '')
      this._switchView(view)
    }, 350)
  }

  _switchView(view) {
    const prevView = this._activeView
    this._activeView = view
    const gv = this.rootEl
    if (!gv.classList.contains('open')) gv.classList.add('open')
    const hv = document.getElementById('homeView')
    const gs = document.getElementById('gridSections')
    /* No scroll save/restore — browser preserves scrollTop across display:none toggles */
    this._applyViewState(view)
    void (hv || gs)?.offsetHeight
    const targetEl = view === 'home' ? hv : gs
    if (targetEl) {
      const tabs = targetEl.querySelector('#viewTabs')
      const hero = targetEl.querySelector('.dashboard-hero')
      if (tabs && hero) tabs.classList.toggle('stuck', targetEl.scrollTop >= hero.offsetHeight + 60)
    }

    this._haptic()
    if (view === 'grid') {
      document.getElementById('gridBtn')?.classList.add('active')
    } else {
      document.getElementById('gridBtn')?.classList.remove('active')
    }
    this._syncTabs(view)
    const input = document.getElementById('kiroInput')
    if (input) input.value = ''
    this.bus.emit('ui:view:set', { view })
  }

  _applyViewState(view) {
    const gs = document.getElementById('gridSections')
    const hv = document.getElementById('homeView')
    if (gs) {
      gs.style.display = view === 'grid' ? '' : 'none'; gs.style.transform = ''; gs.style.opacity = ''; gs.style.zIndex = ''; gs.style.transition = ''
      const gc = gs.querySelector('.grid-sections-content')
      if (gc) { gc.style.transform = ''; gc.style.opacity = ''; gc.style.transition = ''; gc.style.display = '' }
    }
    if (hv) {
      hv.style.display = view === 'home' ? 'flex' : 'none'; hv.style.transform = ''; hv.style.opacity = ''; hv.style.zIndex = ''; hv.style.transition = ''
      const hc = hv.querySelector('.home-view-content')
      if (hc) { hc.style.transform = ''; hc.style.opacity = ''; hc.style.transition = ''; hc.style.display = '' }
    }
  }

  _syncStickyState(fromView, toView, savedScrollTop) {
    const hv = document.getElementById('homeView')
    const gs = document.getElementById('gridSections')
    const toEl = toView === 'home' ? hv : gs
    if (!toEl) return
    void toEl.offsetHeight
    toEl.scrollTop = savedScrollTop
    const tabs = toEl.querySelector('#viewTabs')
    const hero = toEl.querySelector('.dashboard-hero')
    if (tabs && hero) tabs.classList.toggle('stuck', toEl.scrollTop >= hero.offsetHeight + 60)
  }

  _anyExternalViewOpen() {
    const extText = document.getElementById('extTextView')
    const extVideo = document.getElementById('extVideoView')
    const extImage = document.getElementById('extImageView')
    const note = document.getElementById('noteView')
    const page = document.getElementById('pageView')
    const card = document.querySelector('.content')
    const landing = document.getElementById('searchLanding')
    if (extText?.style.display === 'flex') return true
    if (extVideo?.style.display === 'flex') return true
    if (extImage?.style.display === 'flex') return true
    if (note?.style.display === 'flex') return true
    if (page?.style.display === 'flex') return true
    const picker = document.getElementById('pagePicker')
    if (picker?.style.display === 'flex') return true
    if (card && card.style.display !== 'none' && card.style.display !== '') return true
    if (landing?.style.display === 'flex') return true
    return false
  }

  _syncTabs(view) {
    const tabs = this.rootEl?.querySelectorAll('.view-tab')
    if (tabs) tabs.forEach(t => t.classList.toggle('active', t.dataset.view === view))
  }

  _openExternalText(f) {
    if (!f.path) return
    const isElectron = typeof process !== 'undefined' && process.versions?.electron
    if (!isElectron) return
    try {
      const fs = window.require('fs')
      const content = fs.readFileSync(f.path, 'utf-8')
      document.getElementById('extTextTitle').textContent = f.name
      document.getElementById('extTextContent').textContent = content
      this._hideAllViews()
      document.getElementById('extTextView').style.display = 'flex'
      window.__navigation?.push('extText')
      // Set footer info
      const lines = content.split('\n').length
      const words = content.split(/\s+/).filter(Boolean).length
      const stats = fs.statSync(f.path)
      const size = stats.size
      const units = ['B', 'KB', 'MB']
      let s = size, ui = 0
      while (s >= 1024 && ui < units.length - 1) { s /= 1024; ui++ }
      const sizeStr = s.toFixed(1) + ' ' + units[ui]
      document.getElementById('extTextFooter').textContent = lines + ' lines · ' + words + ' words · ' + sizeStr
    } catch (e) {
      console.warn('[ExtText] Failed to read:', e)
    }
  }

  _closeExternalText() {
    document.getElementById('extTextContent').textContent = ''
    document.getElementById('extTextFooter').textContent = ''
    this._hideAllViews()
    this.rootEl.classList.add('open')
    this.render()
    this._switchView('grid')
    window.__navigation?.replace('grid')
  }

  async _takePicture() {
    this.bus.emit('ui:camera:open')
  }

  _handleSearchFromInput() {
    const input = document.getElementById('kiroInput')
    const text = (input?.value || '').trim()
    if (!text) return
    this.bus.emit('ui:search:video', { url: text })
  }

  async _handleCameraOpen() {
    if (window.Capacitor?.Plugins?.Camera) {
      try {
        const cam = window.Capacitor.Plugins.Camera
        const Permissions = window.Capacitor.Plugins.Permissions
        if (Permissions) {
          const permResult = await Permissions.request({ name: 'camera' })
          if (permResult.state !== 'granted') {
            console.warn('[Camera] permission not granted:', permResult.state)
            return
          }
        }
        const image = await cam.getPhoto({ quality: 90, source: 'CAMERA', saveToGallery: false, resultType: 'uri' })
        const dataUrl = image.webPath ?? image.dataUrl ?? image.thumbnail ?? ''
        if (!dataUrl) return
        const now = Date.now()
        const name = 'Photo_' + new Date().toISOString().slice(0, 10) + '_' + now + '.jpg'
        const ext = window.getExternalFiles?.() || []
        const id = '_ext_' + now
        const entry = { id, name, path: dataUrl, size: 0, mimeType: 'image/jpeg', added: now, blurred: false, thumbnail: dataUrl }
        ext.push(entry)
        window.saveExternalFiles?.(ext)
        this.state.setState('externalFiles', ext)
        if (window.renderSidebar) window.renderSidebar()
        if (window.renderGridView) window.renderGridView()
      } catch (e) {
        if (e.message?.includes?.('cancel')) return
        console.warn('[Camera] failed:', e)
      }
    }
  }

  _toFileURL(p) {
    let normalized = p.replace(/\\/g, '/')
    const parts = normalized.split('/')
    for (let i = 0; i < parts.length; i++) {
      if (/^[A-Z]:$/i.test(parts[i])) continue
      parts[i] = encodeURIComponent(parts[i])
    }
    if (/^[A-Z]:/i.test(parts[0])) {
      parts.unshift('')
    }
    return 'file://' + parts.join('/')
  }

  async _openExternalVideo(f) {
    if (!f.path) return
    const isElectron = typeof process !== 'undefined' && process.versions?.electron
    const el = document.getElementById('extVideoElement')
    const errEl = document.getElementById('extVideoError')
    if (f._stale) {
      f._stale = false
      const ok = await this._reimportStaleFile(f)
      if (!ok) return
    }
    if (errEl) errEl.style.display = 'none'
    el.addEventListener('error', (ev) => {
      const msg = el.error?.message || ''
      if (!msg.includes('empty src') && !msg.includes('MEDIA_ELEMENT_ERROR')) {
        console.warn('[Video]', msg, 'src:', (el.src || '').substring(0, 80))
        if (errEl) { errEl.textContent = msg; errEl.style.display = 'block' }
      }
    }, { once: true })
    document.getElementById('extVideoTitle').textContent = f.name
    if (isElectron) {
      el.src = this._toFileURL(f.path)
    } else if (window.Capacitor?.isNativePlatform?.() && f.path) {
      el.src = f.path
    } else {
      el.src = f.path
    }
    this._hideAllViews()
    document.getElementById('extVideoView').style.display = 'flex'
    window.__navigation?.push('extVideo')
    if (window.loadIcons) window.loadIcons()
    this._updateVideoPlayIcon(false)
    this._updateVideoVolumeUI()
    this._updatePipIcon(false)
    this._updateVideoControls()
    el.play().catch(() => {})
  }

  _closeExternalVideo() {
    const el = document.getElementById('extVideoElement')
    el.pause()
    el.src = ''
    const body = document.querySelector('.ext-video-body')
    if (body) body.style.aspectRatio = ''
    this._hideAllViews()
    this.rootEl.classList.add('open')
    this._switchView('grid')
    window.__navigation?.replace('grid')
  }

  _getImageMime(name) {
    const ext = name.split('.').pop().toLowerCase()
    const map = { png: 'image/png', jpeg: 'image/jpeg', jpg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', bmp: 'image/bmp', ico: 'image/x-icon' }
    return map[ext] || 'image/jpeg'
  }

  _resetImageZoom() {
    const el = document.getElementById('extImageElement')
    if (!el) return
    this._imageViewState = null
    el.style.transform = ''
    el.classList.remove('zoomed')
  }

  _applyImageTransform() {
    const el = document.getElementById('extImageElement')
    if (!el || !this._imageViewState) return
    const { scale, translateX, translateY } = this._imageViewState
    el.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`
    el.classList.toggle('zoomed', scale > 1)
  }

  _initImageViewEvents() {
    const body = document.getElementById('extImageBody')
    if (!body || body.dataset.viewInit) return
    body.dataset.viewInit = '1'
    const el = document.getElementById('extImageElement')
    if (!el) return

    // Click background to close
    body.addEventListener('click', (e) => {
      if (e.target === body || e.target === document.getElementById('extImageError')) {
        this._closeExternalImage()
      }
    })

    // Mouse wheel zoom
    body.addEventListener('wheel', (e) => {
      if (!this._imageViewState) return
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const cursorX = e.clientX - rect.left
      const cursorY = e.clientY - rect.top
      const delta = e.deltaY > 0 ? 0.9 : 1 / 0.9
      const newScale = Math.max(0.25, Math.min(10, this._imageViewState.scale * delta))
      const ratio = newScale / this._imageViewState.scale
      this._imageViewState.translateX = cursorX - ratio * (cursorX - this._imageViewState.translateX)
      this._imageViewState.translateY = cursorY - ratio * (cursorY - this._imageViewState.translateY)
      this._imageViewState.scale = newScale
      this._applyImageTransform()
    }, { passive: false })

    // Mouse drag pan
    body.addEventListener('mousedown', (e) => {
      if (!this._imageViewState || this._imageViewState.scale <= 1 || e.button !== 0) return
      if (!e.target.closest('#extImageElement')) return
      this._imageViewState.isDragging = true
      this._imageViewState.dragStartX = e.clientX
      this._imageViewState.dragStartY = e.clientY
      this._imageViewState.dragStartTranslateX = this._imageViewState.translateX
      this._imageViewState.dragStartTranslateY = this._imageViewState.translateY
    })

    document.addEventListener('mousemove', (e) => {
      if (!this._imageViewState?.isDragging) return
      this._imageViewState.translateX = this._imageViewState.dragStartTranslateX + (e.clientX - this._imageViewState.dragStartX)
      this._imageViewState.translateY = this._imageViewState.dragStartTranslateY + (e.clientY - this._imageViewState.dragStartY)
      this._applyImageTransform()
    })

    document.addEventListener('mouseup', () => {
      if (this._imageViewState) this._imageViewState.isDragging = false
    })

    // Touch pinch-zoom and pan
    let touchStart = null
    body.addEventListener('touchstart', (e) => {
      if (!this._imageViewState) return
      if (e.touches.length === 1) {
        touchStart = {
          x: e.touches[0].clientX, y: e.touches[0].clientY,
          tx: this._imageViewState.translateX, ty: this._imageViewState.translateY,
          dist: 0, cx: 0, cy: 0
        }
      } else if (e.touches.length === 2) {
        const t1 = e.touches[0], t2 = e.touches[1]
        touchStart = {
          x: 0, y: 0, tx: this._imageViewState.translateX, ty: this._imageViewState.translateY,
          dist: Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY),
          cx: (t1.clientX + t2.clientX) / 2, cy: (t1.clientY + t2.clientY) / 2,
          scale: this._imageViewState.scale
        }
      }
    }, { passive: true })

    body.addEventListener('touchmove', (e) => {
      if (!this._imageViewState || !touchStart) return
      e.preventDefault()
      if (e.touches.length === 1 && !touchStart.dist) {
        this._imageViewState.translateX = touchStart.tx + (e.touches[0].clientX - touchStart.x)
        this._imageViewState.translateY = touchStart.ty + (e.touches[0].clientY - touchStart.y)
        this._applyImageTransform()
      } else if (e.touches.length === 2 && touchStart.dist) {
        const t1 = e.touches[0], t2 = e.touches[1]
        const curDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
        const curCx = (t1.clientX + t2.clientX) / 2, curCy = (t1.clientY + t2.clientY) / 2
        const newScale = Math.max(0.25, Math.min(10, touchStart.scale * (curDist / touchStart.dist)))
        const ratio = newScale / touchStart.scale
        this._imageViewState.translateX = touchStart.cx - ratio * (touchStart.cx - touchStart.tx) + (curCx - touchStart.cx)
        this._imageViewState.translateY = touchStart.cy - ratio * (touchStart.cy - touchStart.ty) + (curCy - touchStart.cy)
        this._imageViewState.scale = newScale
        this._applyImageTransform()
      }
    }, { passive: false })

    body.addEventListener('touchend', () => { touchStart = null })
    body.addEventListener('touchcancel', () => { touchStart = null })

    // Double-tap to zoom
    let lastTap = 0
    el.addEventListener('click', (e) => {
      const now = Date.now()
      if (now - lastTap < 300) {
        e.stopPropagation()
        if (!this._imageViewState) return
        if (this._imageViewState.scale > 1.5) {
          this._imageViewState.scale = 1
          this._imageViewState.translateX = 0
          this._imageViewState.translateY = 0
        } else {
          this._imageViewState.scale = 2.5
        }
        this._applyImageTransform()
      }
      lastTap = now
    })
  }

  async _openExternalImage(f) {
    if (!f.path) return
    if (f._stale) {
      f._stale = false
      const ok = await this._reimportStaleFile(f)
      if (!ok) return
    }
    const el = document.getElementById('extImageElement')
    const errEl = document.getElementById('extImageError')
    if (!el) return
    document.getElementById('extImageTitle').textContent = f.name
    if (errEl) errEl.style.display = 'none'
    if (this._currentImageBlobUrl) {
      URL.revokeObjectURL(this._currentImageBlobUrl)
      this._currentImageBlobUrl = null
    }
    this._resetImageZoom()
    const isElectron = typeof process !== 'undefined' && process.versions?.electron
    try {
      if (isElectron) {
        const fs = window.require('fs')
        const buf = fs.readFileSync(f.path)
        const mime = this._getImageMime(f.name)
        const blob = new Blob([buf], { type: mime })
        this._currentImageBlobUrl = URL.createObjectURL(blob)
        el.src = this._currentImageBlobUrl
      } else if (window.Capacitor?.isNativePlatform?.() && f._blobUrl) {
        el.src = f._blobUrl
      } else {
        el.src = f.path
      }
    } catch (e) {
      console.warn('[Image] Failed to read:', e)
      if (errEl) errEl.style.display = 'block'
    }
    el.onerror = () => {
      if (errEl) errEl.style.display = 'block'
      el.style.display = 'none'
    }
    el.onload = () => {
      el.style.display = ''
      this._imageViewState = { scale: 1, translateX: 0, translateY: 0, isDragging: false, dragStartX: 0, dragStartY: 0, dragStartTranslateX: 0, dragStartTranslateY: 0 }
    }
    this._hideAllViews()
    document.getElementById('extImageView').style.display = 'flex'
    this._resetImageZoom()
    this._initImageViewEvents()
    window.__navigation?.push('extImage')
    if (window.loadIcons) window.loadIcons()
  }

  _closeExternalImage() {
    const el = document.getElementById('extImageElement')
    const errEl = document.getElementById('extImageError')
    if (this._currentImageBlobUrl) {
      URL.revokeObjectURL(this._currentImageBlobUrl)
      this._currentImageBlobUrl = null
    }
    el.src = ''
    el.onerror = null
    el.onload = null
    if (errEl) errEl.style.display = 'none'
    this._resetImageZoom()
    this._hideAllViews()
    this.rootEl.classList.add('open')
    this._switchView('grid')
    window.__navigation?.replace('grid')
  }

  _toggleVideoPlay() {
    const el = document.getElementById('extVideoElement')
    if (el.paused) el.play().catch(() => {})
    else el.pause()
    this._showPlayPauseOverlay()
  }

  _showPlayPauseOverlay() {
    const el = document.getElementById('extVideoElement')
    if (!el) return
    this._showOverlay(el.paused ? 'pause' : 'play')
  }

  _showSkipOverlay(dir) {
    const pos = dir === 'skip-back' ? 'skip-left' : dir === 'skip-forward' ? 'skip-right' : ''
    this._showOverlay(dir, pos)
  }

  _showOverlay(name, pos) {
    const overlay = document.getElementById('extVideoOverlayIcon')
    if (!overlay) return
    overlay.innerHTML = SVG[name]
    overlay.classList.remove('skip-left', 'skip-right')
    if (pos) overlay.classList.add(pos)
    overlay.classList.add('show')
    clearTimeout(overlay._hideTimer)
    overlay._hideTimer = setTimeout(() => overlay.classList.remove('show'), 400)
  }

  _videoSkip(sec) {
    const el = document.getElementById('extVideoElement')
    if (!el.duration) return
    el.currentTime = Math.max(0, Math.min(el.duration, el.currentTime + sec))
  }

  _toggleVideoMute() {
    const el = document.getElementById('extVideoElement')
    el.muted = !el.muted
  }

  _videoVolume(e) {
    const el = document.getElementById('extVideoElement')
    const v = parseFloat(e.target.value)
    el.muted = false
    el.volume = v
  }

  _toggleVideoFullscreen() {
    const el = document.getElementById('extVideoElement')
    if (!document.fullscreenElement) {
      el.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
  }

  _toggleVideoPip() {
    const el = document.getElementById('extVideoElement')
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture?.()
    } else {
      el.requestPictureInPicture?.()
    }
  }

  _videoSeek(e) {
    const el = document.getElementById('extVideoElement')
    if (!el.duration) return
    const track = document.getElementById('extVideoProgress')
    const rect = track.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    el.currentTime = pct * el.duration
  }

  _updateVideoControls() {
    const el = document.getElementById('extVideoElement')
    const fill = document.getElementById('extVideoProgressFill')
    const timeEl = document.getElementById('extVideoTime')
    if (!el || !fill || !timeEl) return
    const pct = el.duration ? (el.currentTime / el.duration) * 100 : 0
    fill.style.width = pct + '%'
    timeEl.textContent = this._formatTime(el.currentTime) + ' / ' + this._formatTime(el.duration)
  }

  _updateVideoPlayIcon(playing) {
    const icon = document.getElementById('extVideoPlayIcon')
    if (!icon) return
    icon.innerHTML = SVG[playing ? 'pause' : 'play']
  }

  _updateVideoVolumeUI() {
    const el = document.getElementById('extVideoElement')
    const slider = document.getElementById('extVideoVolume')
    const icon = document.getElementById('extVideoMuteIcon')
    if (!el || !slider || !icon) return
    const name = el.muted || el.volume === 0 ? 'volume-x' : el.volume < 0.5 ? 'volume-1' : 'volume-2'
    icon.innerHTML = SVG[name]
    slider.value = el.muted ? 0 : el.volume
  }

  _updatePipIcon(active) {
    const icon = document.getElementById('extVideoPipIcon')
    if (!icon) return
    icon.innerHTML = SVG[active ? 'picture-in-picture' : 'picture-in-picture-2']
  }

  _formatTime(s) {
    if (!s || !isFinite(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return m + ':' + (sec < 10 ? '0' : '') + sec
  }

  _adaptVideoPlayerSize() {
    const el = document.getElementById('extVideoElement')
    const body = document.querySelector('.ext-video-body')
    if (!el || !body || !el.videoWidth || !el.videoHeight) return
    const ar = el.videoWidth / el.videoHeight
    body.style.aspectRatio = ''
    el.style.aspectRatio = ar
    // Cap height so controls are always visible
    const controls = document.querySelector('.ext-video-controls')
    const controlsH = controls ? controls.offsetHeight : 36
    el.style.maxHeight = (body.clientHeight - controlsH) + 'px'
  }

  _renderProgressBar(current, target, label) {
    const pct = Math.min(100, (current / Math.max(target, 1)) * 100)
    const displayLabel = label || (current + '/' + target)
    return `<div class="kiro-progress"><div class="kiro-progress-track segmented"><div class="kiro-progress-fill${pct >= 100 ? ' glow' : ''}" style="width:${pct}%"></div></div><span class="kiro-progress-text">${displayLabel}</span></div>`
  }

  _renderNoteTodoPreview(n) {
    if (!n || !n.todos || !n.todos.length) return ''
    let html = '<div class="grid-item-todos">'
    let shown = 0
    for (const t of n.todos) {
      if (shown >= 3) break
      html += `<div class="grid-item-todo"><span class="todo-check${t.done ? ' done' : ''}"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg></span><span class="todo-text${t.done ? ' done' : ''}">${t.text || ''}</span></div>`
      shown++
    }
    if (n.todos.length > 3) html += '<div style="font-size:9px;color:#8e8e93;padding-top:2px">+' + (n.todos.length - 3) + ' more</div>'
    html += '</div>'
    return html
  }

  _formatSize(bytes) {
    if (!bytes) return ''
    const units = ['B', 'KB', 'MB', 'GB']
    let i = 0
    let size = bytes
    while (size >= 1024 && i < units.length - 1) { size /= 1024; i++ }
    return size.toFixed(1) + ' ' + units[i]
  }

  _todoBurst(e) {
    const colors = ['#ffd60a', '#ff9f0a', '#30d158', '#007aff', '#ff375f']
    for (let i = 0; i < 12; i++) {
      const dot = document.createElement('div')
      dot.className = 'kiro-particle'
      const color = colors[i % colors.length]
      const size = 4 + Math.random() * 6
      dot.style.width = size + 'px'
      dot.style.height = size + 'px'
      dot.style.background = color
      dot.style.boxShadow = '0 0 6px ' + color
      dot.style.left = (e.clientX || window.innerWidth / 2) + 'px'
      dot.style.top = (e.clientY || window.innerHeight / 2) + 'px'
      document.body.appendChild(dot)
      const angle = Math.random() * 360
      const dist = 20 + Math.random() * 30
      const dx = Math.cos(angle * Math.PI / 180) * dist
      const dy = Math.sin(angle * Math.PI / 180) * dist
      dot.style.transition = 'transform 0.45s cubic-bezier(0,.8,.5,1), opacity 0.45s ease, box-shadow 0.45s ease'
      requestAnimationFrame(() => {
        dot.style.transform = `translate(${dx}px,${dy}px) scale(0)`
        dot.style.opacity = '0'
        dot.style.boxShadow = 'none'
      })
      setTimeout(() => { if (dot.parentNode) dot.parentNode.removeChild(dot) }, 500)
    }
  }

  _burstParticles(x, y, color) {
    this._todoBurst({ clientX: x, clientY: y })
  }

  _startAnim() {
    const el = this.rootEl
    if (!el) return
    const sections = el.querySelectorAll('.grid-section-anim')
    Array.from(sections).forEach((section, i) => {
      setTimeout(() => {
        section.classList.add('visible')
        const items = section.querySelectorAll('.grid-item-anim')
        Array.from(items).forEach((item, j) => {
          setTimeout(() => item.classList.add('visible'), j * 60 + 120)
        })
      }, i * 220)
    })
    this._animDone = true
  }

  destroy() {
    if (this._dateInterval) { clearInterval(this._dateInterval); this._dateInterval = null }
    super.destroy()
  }

  _escapeHtml(str) {
    if (typeof str !== 'string') return ''
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
    return str.replace(/[&<>"']/g, ch => map[ch])
  }

  _stripHtml(str) {
    return str.replace(/<[^>]*>/g, '')
  }

  _showNotFoundToast(videoId) {
    const toast = document.getElementById('updateToast')
    const toastText = document.getElementById('updateToastText') || toast
    const actions = document.querySelector('.update-toast-actions')
    const saved = actions.innerHTML

    toastText.textContent = 'Video not found'
    actions.innerHTML = `
      <button class="toast-btn-secondary" id="nfCancel">Cancel</button>
      <button class="toast-btn-primary" id="nfLocate">Locate</button>
    `
    actions.style.display = ''
    toast.classList.add('show')

    document.getElementById('nfCancel').onclick = () => {
      toast.classList.remove('show')
      actions.innerHTML = saved
    }
    document.getElementById('nfLocate').onclick = () => {
      toast.classList.remove('show')
      actions.innerHTML = saved
      const v = (window.getVideos?.() || {})[videoId]
      if (v && v.url) window.open(v.url)
    }
  }
}
