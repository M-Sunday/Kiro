import { Api } from '../core/Api.js'

const VIEW_NAMES = {
  GRID: 'grid',
  HOME: 'home',
  CARD: 'card',
  LANDING: 'landing',
  NOTE: 'note',
  EXT_VIDEO: 'extVideo',
  EXT_IMAGE: 'extImage',
  EXT_TEXT: 'extText',
  SETTINGS: 'settings',
}

export class NavigationService {
  constructor() {
    this.api = Api.getInstance()
    this._history = []
    this._initialView = this._detectCurrentView()
    this._pushState(this._initialView, { replace: true })

    this._bindBackButton()
    this._bindEscapeKey()
    this._exposeGlobals()
  }

  _detectCurrentView() {
    if (document.getElementById('pageView')?.style.display === 'flex') return 'page'
    if (document.getElementById('extImageView')?.style.display === 'flex') return 'extImage'
    if (document.getElementById('extVideoView')?.style.display === 'flex') return 'extVideo'
    if (document.getElementById('extTextView')?.style.display === 'flex') return 'extText'
    if (document.getElementById('noteView')?.style.display === 'flex') return 'note'
    if (document.querySelector('.content')?.style.display !== 'none' &&
        document.querySelector('.content')?.style.display !== '') return 'card'
    if (document.getElementById('searchLanding')?.style.display === 'flex') return 'landing'
    if (document.getElementById('homeView')?.style.display === 'flex') return 'home'
    return 'grid'
  }

  _getViewName() {
    if (document.getElementById('pagePicker')?.style.display === 'flex') return 'pagePicker'
    if (document.getElementById('pageView')?.style.display === 'flex') return 'page'
    if (document.getElementById('extImageView')?.style.display === 'flex') return 'extImage'
    if (document.getElementById('extVideoView')?.style.display === 'flex') return 'extVideo'
    if (document.getElementById('extTextView')?.style.display === 'flex') return 'extText'
    if (document.getElementById('noteView')?.style.display === 'flex') return 'note'
    if (document.querySelector('.content')?.style.display !== 'none' &&
        document.querySelector('.content')?.style.display !== '') return 'card'
    if (document.getElementById('searchLanding')?.style.display === 'flex') return 'landing'
    if (document.getElementById('homeView')?.style.display === 'flex') return 'home'
    return 'grid'
  }

  _pushState(view, opts = {}) {
    if (opts.replace) {
      if (this._history.length > 0) this._history[this._history.length - 1] = view
      else this._history.push(view)
    } else {
      if (this._history[this._history.length - 1] !== view) {
        this._history.push(view)
      }
    }
  }

  get current() {
    return this._history.length > 0 ? this._history[this._history.length - 1] : 'grid'
  }

  get canGoBack() {
    return this._history.length > 1
  }

  navigate(view, opts = {}) {
    const prev = this.current
    this._pushState(view, opts)
    this.api.bus.emit('navigation:changed', { from: prev, to: view, replace: !!opts.replace })
  }

  replace(view) {
    this.navigate(view, { replace: true })
  }

  back() {
    if (!this.canGoBack) return
    const current = this._history.pop()
    const target = this._history[this._history.length - 1] || 'grid'
    this.api.bus.emit('navigation:back', { from: current, to: target })
    this._restoreView(target)
  }

  _restoreView(target) {
    const gv = document.getElementById('gridView')
    const sl = document.getElementById('searchLanding')
    const ct = document.querySelector('.content')
    const nv = document.getElementById('noteView')
    const hv = document.getElementById('homeView')
    const pv = document.getElementById('pageView')
    const pp = document.getElementById('pagePicker')
    const extTV = document.getElementById('extTextView')
    const extVV = document.getElementById('extVideoView')
    const extIV = document.getElementById('extImageView')
    const ve = document.getElementById('extVideoElement')
    const gb = document.getElementById('gridBtn')

    if (extIV) extIV.style.display = 'none'
    if (extVV) { extVV.style.display = 'none'; if (ve) ve.pause() }
    if (extTV) extTV.style.display = 'none'
    if (nv) nv.style.display = 'none'
    if (ct) ct.style.display = 'none'
    if (sl) sl.style.display = 'none'
    if (hv) hv.style.display = 'none'
    if (pv) pv.style.display = 'none'
    if (pp) pp.style.display = 'none'
    if (gv) gv.classList.remove('open')

    if (target === 'grid') {
      if (gv) gv.classList.add('open')
      if (gb) gb.classList.add('active')
      if (window.renderGridView) window.renderGridView()
      if (window.syncViewTabs) window.syncViewTabs('grid')
    } else if (target === 'home') {
      if (gv) gv.classList.add('open')
      if (window.renderGridView) window.renderGridView()
      if (gb) gb.classList.remove('active')
      if (window.syncViewTabs) window.syncViewTabs(target)
    } else if (target === 'card') {
      if (ct) ct.style.display = ''
      if (window.renderSidebar) window.renderSidebar()
      if (window.loadIcons) window.loadIcons()
    } else if (target === 'note') {
      if (nv) nv.style.display = 'flex'
    } else if (target === 'landing') {
      if (sl) sl.style.display = 'flex'
    } else if (target === 'page') {
      if (pv) pv.style.display = 'flex'
      if (window.__pageMobileAction) {
        const bar = document.querySelector('.mobile-nav-bar')
        if (bar) bar.classList.add('page-mode')
      }
    }

    if (window.renderSidebar) window.renderSidebar()
  }

  _bindBackButton() {
    if (window.Capacitor?.Plugins?.App) {
      try {
        window.Capacitor.Plugins.App.addListener('backButton', () => {
          this._handleBack()
        })
      } catch (e) {
        console.warn('[Nav] Capacitor back button not available:', e)
      }
    }

    window.addEventListener('popstate', (e) => {
      if (e.state?.view) {
        this._restoreView(e.state.view)
      }
    })
  }

  _bindEscapeKey() {
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) &&
          !e.target.closest('.note-view-content')) return

      const current = this._getViewName()
      if (current === 'extImage' || current === 'extVideo' || current === 'extText') {
        e.preventDefault()
        if (current === 'extImage' && window.closeExternalImage) window.closeExternalImage()
        else if (current === 'extVideo' && window.closeExternalVideo) window.closeExternalVideo()
        else if (current === 'extText' && window.closeExternalText) window.closeExternalText()
      } else if (current === 'note' && window.closeNoteView) {
        e.preventDefault()
        window.closeNoteView()
      }
    })
  }

  _handleBack() {
    const current = this._getViewName()

    if (current === 'pagePicker') {
      const picker = document.getElementById('pagePicker')
      if (picker) picker.style.display = 'none'
      return
    }
    if (current === 'page' && window.closePageView) {
      window.closePageView()
      return
    }
    if (current === 'extImage' && window.closeExternalImage) {
      window.closeExternalImage()
      return
    }
    if (current === 'extVideo' && window.closeExternalVideo) {
      window.closeExternalVideo()
      return
    }
    if (current === 'extText' && window.closeExternalText) {
      window.closeExternalText()
      return
    }
    if (current === 'note' && window.closeNoteView) {
      window.closeNoteView()
      return
    }
    if (document.getElementById('settingsOverlay')?.classList.contains('open')) {
      document.getElementById('settingsOverlay')?.classList.remove('open')
      return
    }
    if (document.getElementById('profileOverlay')?.classList.contains('open')) {
      document.getElementById('profileOverlay')?.classList.remove('open')
      return
    }
    if (document.getElementById('shortcutsOverlay')?.style.display === 'flex') {
      document.getElementById('shortcutsOverlay').style.display = 'none'
      return
    }

    if (this.canGoBack) {
      this.back()
    } else {
      if (window.Capacitor?.Plugins?.App) {
        window.Capacitor.Plugins.App.exitApp()
      }
    }
  }

  _exposeGlobals() {
    window.__navigation = {
      push: (view, opts) => this.navigate(view, opts),
      replace: (view) => this.replace(view),
      back: () => this.back(),
      current: () => this.current,
      canGoBack: () => this.canGoBack,
    }
  }
}
