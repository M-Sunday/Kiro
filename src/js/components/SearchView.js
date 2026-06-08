import { Component } from './base/Component.js'
import { Api } from '../core/Api.js'

export class SearchView extends Component {
  constructor() {
    super()
    this.api = Api.getInstance()
    this.searchService = this.api.services.get('searchService')
    this._bindEvents()
  }

  mount(rootEl) {
    super.mount(rootEl)
    this._bindDOMEvents()
  }

  _bindEvents() {
    this.bus.on('search:started', (e) => this._onSearchStarted(e.videoId))
    this.bus.on('search:complete', (e) => this._onSearchComplete(e.videoId, e.metadata))
    this.bus.on('search:enriched', (e) => this._onSearchEnriched(e.videoId, e.metadata))
    this.bus.on('search:failed', (e) => this._onSearchFailed(e.videoId))
    this.bus.on('search:not-youtube', (e) => this._onNonYouTubeUrl(e.url))
  }

  _bindDOMEvents() {
    this.listenTo(document.getElementById('kiroInput'), 'keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); this._handleSearch() }
      if (e.key === 'Escape') e.target.blur()
    })

    this.listenTo(document.getElementById('kiroInput'), 'focus', () => {
      this.bus.emit('ui:view:set', { view: 'landing' })
    })

    this.listenTo(document.getElementById('kiroInput'), 'blur', (e) => {
      if (!e.target.value.trim()) {
        const landing = document.getElementById('searchLanding')
        if (landing?.style.display === 'flex') {
          this.bus.emit('ui:view:set', { view: 'grid' })
        }
      }
    })

  }

  _handleSearch() {
    const input = document.getElementById('kiroInput')
    const mobileInput = document.getElementById('mobileKiroInput')
    const text = (input?.value || mobileInput?.value || '').trim()
    if (!text) return

    this.bus.emit('ui:search:video', { url: text })
  }

  _onSearchStarted(videoId) {
    this._searchText = (document.getElementById('kiroInput')?.value || document.getElementById('mobileKiroInput')?.value || '')
    this.bus.emit('ui:view:set', { view: 'card' })
    document.getElementById('thumbnail').src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    document.getElementById('durationBadge').textContent = ''
    document.getElementById('durationBadge').className = 'badge searching'
    document.getElementById('videoTitle').textContent = 'Searching'
    document.getElementById('videoTitle').className = 'searching-title'
    document.getElementById('channelName').textContent = ''
  }

  _restoreSearchText() {
    const input = document.getElementById('kiroInput')
    const mobileInput = document.getElementById('mobileKiroInput')
    if (this._searchText) {
      if (input && !input.value) input.value = this._searchText
      if (mobileInput && !mobileInput.value) mobileInput.value = this._searchText
    }
  }

  _onSearchComplete(videoId, metadata) {
    this._restoreSearchText()
    document.getElementById('thumbnail').src = metadata.thumbnail
    document.getElementById('durationBadge').textContent = metadata.duration || '–'
    document.getElementById('durationBadge').className = 'badge'
    document.getElementById('videoTitle').textContent = metadata.title
    document.getElementById('videoTitle').className = ''
    document.getElementById('channelName').textContent = metadata.channel

    window.currentVideo = { id: videoId, ...metadata }
    if (window.updateCardAddBtn) window.updateCardAddBtn()
  }

  _onSearchEnriched(videoId, metadata) {
    this._restoreSearchText()
    document.getElementById('durationBadge').textContent = metadata.duration || '–'
    document.getElementById('videoTitle').textContent = metadata.title
    document.getElementById('channelName').textContent = metadata.channel

    window.currentVideo = { id: videoId, ...metadata }
    if (window.updateCardAddBtn) window.updateCardAddBtn()
  }

  _onSearchFailed(videoId) {
    document.getElementById('durationBadge').textContent = '–'
    document.getElementById('durationBadge').className = 'badge'
    document.getElementById('videoTitle').textContent = 'Could not load video info'
    document.getElementById('videoTitle').className = ''
    document.getElementById('channelName').textContent = 'Try again or check the link'
  }

  _onNonYouTubeUrl(url) {
    if (/^https?:\/\//i.test(url) || /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(url)) {
      this._showDaDialog(url)
    } else {
      document.getElementById('videoTitle').textContent = 'Invalid video link'
    }
  }

  _showDaDialog(url) {
    window._pendingDaUrl = url.match(/^https?:\/\//i) ? url : 'https://' + url
    const display = document.getElementById('daUrlDisplay')
    const titleInput = document.getElementById('daTitleInput')
    const dialog = document.getElementById('daDialog')
    if (display) display.textContent = window._pendingDaUrl
    if (titleInput) titleInput.value = ''
    if (dialog) {
      dialog.classList.add('open')
      setTimeout(() => titleInput?.focus(), 100)
    }
  }
}
