import { Component } from './base/Component.js'
import { Api } from '../core/Api.js'

export class CardView extends Component {
  constructor() {
    super()
    this.api = Api.getInstance()
    this._exposeGlobals()
  }

  _exposeGlobals() {
    window.loadVideoById = (id) => this.loadVideoById(id)
    window.addCurrentVideo = () => this.addCurrentVideo()
    window.unlinkCurrentVideo = () => this.unlinkCurrentVideo()
    window.updateCardAddBtn = () => this.updateCardAddBtn()
    window.updatePinBadge = (id) => this.updatePinBadge(id)
  }

  mount(rootEl) {
    super.mount(rootEl)
    this._bindDOMEvents()
  }

  _bindDOMEvents() {
    this.listenTo(document.getElementById('copyLinkBtn'), 'click', (e) => {
      e.stopPropagation()
      if (!window.currentVideo?.url) return
      navigator.clipboard.writeText(window.currentVideo.url).then(() => {
        const toast = document.getElementById('updateToast')
        if (toast) {
          toast.textContent = 'Copied to clipboard'
          toast.classList.add('show')
          setTimeout(() => toast.classList.remove('show'), 2000)
        }
      }).catch(() => {})
    })

    this.listenTo(document.getElementById('imageWrap'), 'click', () => {
      if (window.currentVideo?.url) window.open(window.currentVideo.url)
    })

    this.listenTo(document.getElementById('cardAddBtn'), 'click', () => this.addCurrentVideo())
  }

  async loadVideoById(id) {
    const v = (window.getVideos?.() || {})[id]
    if (!v) return
    window.currentVideo = { ...v, id }

    const thumb = document.getElementById('thumbnail')
    if (thumb) thumb.src = v.thumbnail || `https://img.youtube.com/vi/${id}/maxresdefault.jpg`
    const dur = document.getElementById('durationBadge')
    if (dur) dur.textContent = v.duration || '–'
    const title = document.getElementById('videoTitle')
    if (title) title.textContent = v.title
    const channel = document.getElementById('channelName')
    if (channel) channel.textContent = v.channel

    if (v.pubDate) {
      if (window.setPublishedDate) window.setPublishedDate(new Date(v.pubDate))
    } else {
      try {
        const piped = await (await fetch(`https://pipedapi.kavin.rocks/streams/${id}`)).json()
        if (piped.uploadDate) {
          const d = new Date(piped.uploadDate)
          if (window.setPublishedDate) window.setPublishedDate(d)
          const vs = window.getVideos?.() || {}
          if (vs[id]) { vs[id].pubDate = d.toISOString(); window.saveVideos?.(vs) }
        }
      } catch {}
    }

    if (window.updatePrivacy) window.updatePrivacy(v.privacy || 'PUBLIC')
    if (window.currentNoteId && window.closeNoteView) window.closeNoteView()
    this.updatePinBadge(id)
    if (window.showCardView) window.showCardView()
    if (window.renderSidebar) window.renderSidebar()
    this.updateCardAddBtn()

    this.bus.emit('ui:card:loaded', { id, video: v })
  }

  updatePinBadge(id) {
    const wrap = document.getElementById('imageWrap')
    if (!wrap) return
    const old = wrap.querySelector('.pin-badge')
    if (old) old.remove()
    if ((window.getPins?.() || []).includes(id)) {
      const badge = document.createElement('div')
      badge.className = 'pin-badge'
      badge.innerHTML = '<i data-lucide="pin-off" style="width:14px;height:14px"></i>'
      wrap.appendChild(badge)
      if (window.loadIcons) window.loadIcons()
    }
  }

  updateCardAddBtn() {
    const row = document.getElementById('cardAddRow')
    const btn = document.getElementById('cardAddBtn')
    const copyBtn = document.getElementById('copyLinkBtn')
    const dlBtn = document.getElementById('dlBtn')
    if (!window.currentVideo) {
      if (row) row.style.display = 'none'
      if (dlBtn) dlBtn.style.display = 'none'
      return
    }
    const vs = window.getVideos?.() || {}
    if (vs[window.currentVideo.id]) {
      if (row) row.style.display = 'flex'
      if (btn) {
        btn.classList.add('saved')
        btn.innerHTML = '<i data-lucide="check" class="card-add-icon"></i> Saved'
        btn.onmouseover = () => {
          btn.innerHTML = '<i data-lucide="trash-2" class="card-add-icon"></i> Unlink'
          if (window.loadIcons) window.loadIcons()
        }
        btn.onmouseout = () => {
          btn.innerHTML = '<i data-lucide="check" class="card-add-icon"></i> Saved'
          if (window.loadIcons) window.loadIcons()
        }
        btn.onclick = (e) => { e.stopPropagation(); if (window.currentVideo) this.unlinkCurrentVideo() }
      }
      if (copyBtn) copyBtn.style.display = 'inline-flex'
      if (dlBtn) {
        dlBtn.style.display = 'inline-flex'
        const isElectron = typeof process !== 'undefined' && process.versions?.electron
        dlBtn.classList.toggle('desktop-only', !isElectron)
        dlBtn.innerHTML = '<i data-lucide="download" class="card-add-icon"></i> ' + (isElectron ? 'Download' : 'Desktop exclusive')
      }
      if (window.loadIcons) window.loadIcons()
    } else {
      if (row) row.style.display = 'flex'
      if (btn) {
        btn.classList.remove('saved')
        btn.innerHTML = '<i data-lucide="plus" class="card-add-icon"></i> Add video'
        btn.onmouseover = btn.onmouseout = btn.onclick = null
      }
      if (copyBtn) copyBtn.style.display = 'none'
      if (dlBtn) dlBtn.style.display = 'none'
      if (window.loadIcons) window.loadIcons()
    }
  }

  addCurrentVideo() {
    if (!window.currentVideo) {
      const title = document.getElementById('videoTitle')
      if (title) title.textContent = 'Load a video first'
      return
    }
    const { id, title, channel, duration, pubDate, privacy, url } = window.currentVideo
    const vs = window.getVideos?.() || {}
    if (vs[id]) return
    vs[id] = {
      title, channel, duration,
      pubDate: pubDate?.toISOString?.(),
      privacy: privacy || 'PUBLIC',
      url: url || '',
      thumbnail: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
      added: Date.now()
    }
    window.saveVideos?.(vs)

    const fs = window.getFolders?.() || {}
    if (!fs['Videos']) fs['Videos'] = []
    if (!fs['Videos'].includes(id)) fs['Videos'].push(id)
    window.saveFolders?.(fs)

    if (window.renderSidebar) window.renderSidebar()
    this.updateCardAddBtn()
    if (window.closeSidebarMobile) window.closeSidebarMobile()

    const historyToggle = document.querySelector('#pane-history .settings-toggle:first-child')
    if (historyToggle?.classList.contains('on')) {
      const h = (window.loadHistory?.() || []).filter(x => x.id !== id)
      h.unshift({ id, title, channel })
      if (window.saveHistory) window.saveHistory(h)
    }

    if (document.getElementById('searchLanding')?.style.display === 'flex') {
      if (window.renderSearchLanding) window.renderSearchLanding()
    }

    this.bus.emit('ui:video:added', { id, video: vs[id] })
  }

  unlinkCurrentVideo() {
    if (!window.currentVideo) return
    const id = window.currentVideo.id
    const vs = window.getVideos?.() || {}
    if (!vs[id]) return
    delete vs[id]
    window.saveVideos?.(vs)

    const fs = window.getFolders?.() || {}
    for (const ids of Object.values(fs)) {
      const i = ids.indexOf(id)
      if (i > -1) ids.splice(i, 1)
    }
    window.saveFolders?.(fs)

    const pins = window.getPins?.() || []
    const pi = pins.indexOf(id)
    if (pi > -1) { pins.splice(pi, 1); window.savePins?.(pins) }

    if (window.renderSidebar) window.renderSidebar()
    this.updateCardAddBtn()
  }
}
