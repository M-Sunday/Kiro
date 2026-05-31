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
    this.bus.on('search:complete', (e) => this._onSearchComplete(e.videoId, e.metadata))
    this.bus.on('search:failed', (e) => this._onSearchFailed(e.videoId))
    this.bus.on('search:not-youtube', (e) => this._onNonYouTubeUrl(e.url))
  }

  _bindDOMEvents() {
    this.listenTo(document.getElementById('kiroInput'), 'keydown', (e) => {
      if (e.key === 'Enter') this._handleSearch()
      if (e.key === 'Escape') e.target.blur()
    })

    this.listenTo(document.getElementById('kiroInput'), 'focus', () => {
      document.querySelector('.top-bar')?.classList.add('search-expanded')
      this.bus.emit('ui:view:set', { view: 'landing' })
    })

    this.listenTo(document.getElementById('kiroInput'), 'blur', (e) => {
      document.querySelector('.top-bar')?.classList.remove('search-expanded')
    })

    this.listenTo(document.getElementById('kiroBtn'), 'click', () => this._handleSearch())
  }

  _handleSearch() {
    const input = document.getElementById('kiroInput')
    if (!input) return
    const text = input.value.trim()
    if (!text) return

    const videoId = this.searchService.getVideoId(text)

    if (videoId) {
      this.bus.emit('ui:search:video', { url: text })
      return
    }

    if (/^https?:\/\//i.test(text) || /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(text)) {
      this._showDaDialog(text)
    } else {
      document.getElementById('videoTitle').textContent = 'Invalid video link'
    }
  }

  _onSearchComplete(videoId, metadata) {
    this.bus.emit('ui:view:set', { view: 'card' })
    document.getElementById('thumbnail').src = metadata.thumbnail
    document.getElementById('durationBadge').textContent = metadata.duration || '–'
    document.getElementById('videoTitle').textContent = metadata.title
    document.getElementById('channelName').textContent = metadata.channel

    if (metadata.pubDate) {
      this.bus.emit('ui:calendar:set-date', { date: new Date(metadata.pubDate) })
    }
    if (metadata.privacy) {
      this.bus.emit('ui:calendar:set-privacy', { status: metadata.privacy })
    }

    window.currentVideo = { id: videoId, ...metadata }
    if (window.updateCardAddBtn) window.updateCardAddBtn()
  }

  _onSearchFailed(videoId) {
    document.getElementById('durationBadge').textContent = '–'
    document.getElementById('videoTitle').textContent = 'Could not load video info'
    document.getElementById('channelName').textContent = 'Try again or check the link'
  }

  _onNonYouTubeUrl(url) {
    this._showDaDialog(url)
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
