export class ViewManager {
  constructor() {
    this._exposeGlobals()
  }

  _exposeGlobals() {
    window.setView = (view) => this.setView(view)
    window.showCardView = () => this.showCardView()
    window.clearCard = () => this.clearCard()
    window.closeNoteView = () => this.closeNoteView()
    window.renderSearchLanding = () => this.renderSearchLanding()
    window.showSplashForUpdate = () => this.showSplashForUpdate()
  }

  setView(view) {
    const gv = document.getElementById('gridView')
    const sl = document.getElementById('searchLanding')
    const ct = document.querySelector('.content')
    const nv = document.getElementById('noteView')
    const dv = document.getElementById('deckView')
    const gb = document.getElementById('gridBtn')
    const db = document.getElementById('deckBtn')

    if (gv) gv.classList.remove('open')
    if (dv) dv.classList.remove('open')
    if (gb) gb.classList.remove('active')
    if (db) db.classList.remove('active')
    if (sl) sl.style.display = 'none'
    if (ct) ct.style.display = 'none'
    if (nv) nv.style.display = 'none'

    if (view === 'grid') {
      if (gv) gv.classList.add('open')
      if (gb) gb.classList.add('active')
    } else if (view === 'deck') {
      if (dv) dv.classList.add('open')
      if (db) db.classList.add('active')
    } else if (view === 'card') {
      if (ct) ct.style.display = ''
    } else if (view === 'landing') {
      if (sl) sl.style.display = 'flex'
    } else if (view === 'note') {
      if (nv) nv.style.display = 'flex'
    }
  }

  showCardView() {
    this.setView('card')
  }

  clearCard() {
    window.currentVideo = null
    const thumb = document.getElementById('thumbnail')
    const dur = document.getElementById('durationBadge')
    const title = document.getElementById('videoTitle')
    const channel = document.getElementById('channelName')
    const cardRow = document.getElementById('cardAddRow')
    const imageWrap = document.getElementById('imageWrap')

    if (thumb) thumb.src = ''
    if (dur) dur.textContent = '\u2013'
    if (title) title.textContent = 'Paste a video link above'
    if (channel) channel.textContent = ''
    if (cardRow) cardRow.style.display = 'none'
    const badge = imageWrap?.querySelector('.pin-badge')
    if (badge) badge.remove()

    this.setView('grid')
  }

  closeNoteView() {
    window.currentNoteId = null
    if (window.currentVideo) {
      this.setView('card')
      if (window.renderSidebar) window.renderSidebar()
    } else {
      this.clearCard()
    }
  }

  renderSearchLanding() {
    const el = document.getElementById('searchLandingHistory')
    if (!el) return

    let items = []
    const enabled = this._loadSetting('saveLinkHistory', true)
    if (enabled) {
      try { items = JSON.parse(localStorage.getItem('linkHistory') || '[]') } catch { items = [] }
    }

    if (!items.length) {
      const vs = window.getVideos?.() || {}
      const fs = window.getFolders?.() || {}
      const all = (fs['Videos'] || []).map(id =>
        vs[id] ? { id, title: vs[id].title, channel: vs[id].channel, added: vs[id].added } : null
      ).filter(Boolean)
      all.sort((a, b) => (b.added || 0) - (a.added || 0))
      items = all.slice(0, 10)
    }

    if (!items.length) {
      el.innerHTML = '<div style="padding:20px;text-align:center;font-size:12px;color:#8e8e93">No recent searches</div>'
      return
    }

    el.innerHTML = items.map(h =>
      `<div class="search-landing-item" data-id="${h.id}">
        <img class="search-landing-item-img" src="https://img.youtube.com/vi/${h.id}/hqdefault.jpg" loading="lazy" onerror="this.style.display='none'" />
        <div class="search-landing-item-meta">
          <span class="search-landing-item-title">${h.title}</span>
          <span class="search-landing-item-channel">${h.channel}</span>
        </div>
      </div>`
    ).join('')

    el.querySelectorAll('.search-landing-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.id
        if (id && window.loadVideoById) window.loadVideoById(id)
      })
    })
  }

  showSplashForUpdate() {
    const s = document.getElementById('splash')
    if (!s) return
    s.style.display = ''
    s.classList.remove('fade', 'onboarding')
    s.classList.add('info-bg')
    const img = s.querySelector('.splash-content img')
    if (img) { img.style.transition = 'none'; img.style.transform = 'rotate(0deg)' }
    const t = document.getElementById('splashText')
    if (t) { t.style.display = 'block'; t.textContent = navigator.onLine ? 'Updating\u2026' : "You're offline" }
    const step0 = document.getElementById('onbStep0')
    if (step0) step0.style.display = 'none'
  }

  _loadSetting(key, def) {
    try {
      const s = JSON.parse(localStorage.getItem('kiroSettings') || '{}')
      return s[key] !== undefined ? s[key] : def
    } catch { return def }
  }
}
