import { Component } from './base/Component.js'
import { Api } from '../core/Api.js'

export class Dialogs extends Component {
  constructor() {
    super()
    this.api = Api.getInstance()
  }

  mount(rootEl) {
    super.mount(rootEl)
    window.openBookmarkDialog = () => this._openBookmarkDialog()
    this._bindEvents()
  }

  _bindEvents() {
    // Folder dialog
    this.listenTo(document.getElementById('newFolderBtn'), 'click', () => this._openFolderDialog())
    this.listenTo(document.getElementById('folderDialogCancel'), 'click', () => this._closeDialog('folderDialog'))
    this.listenTo(document.getElementById('folderDialogConfirm'), 'click', () => this._createFolder())
    this.listenTo(document.getElementById('folderNameInput'), 'keydown', (e) => {
      if (e.key === 'Enter') this._createFolder()
      if (e.key === 'Escape') this._closeDialog('folderDialog')
    })
    document.querySelectorAll('.folder-color').forEach(c => {
      c.addEventListener('click', function () {
        document.querySelectorAll('.folder-color').forEach(x => x.classList.remove('active'))
        this.classList.add('active')
      })
    })
    this.listenTo(document.getElementById('folderDialog'), 'mousedown', (e) => {
      if (e.target === document.getElementById('folderDialog')) this._closeDialog('folderDialog')
    })

    // Bookmark dialog
    this.listenTo(document.getElementById('newBookmarkBtn'), 'click', () => this._openBookmarkDialog())
    this.listenTo(document.getElementById('bookmarkBtn'), 'click', () => this._openBookmarkDialog())
    this.listenTo(document.getElementById('bookmarkDialogCancel'), 'click', () => this._closeDialog('bookmarkDialog'))
    this.listenTo(document.getElementById('bookmarkDialogConfirm'), 'click', () => this._addBookmark())
    this.listenTo(document.getElementById('bookmarkUrlInput'), 'keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('bookmarkTitleInput')?.focus()
    })
    this.listenTo(document.getElementById('bookmarkTitleInput'), 'keydown', (e) => {
      if (e.key === 'Enter') this._addBookmark()
      if (e.key === 'Escape') this._closeDialog('bookmarkDialog')
    })
    this.listenTo(document.getElementById('bookmarkDialog'), 'mousedown', (e) => {
      if (e.target === document.getElementById('bookmarkDialog')) this._closeDialog('bookmarkDialog')
    })

    // Direct Access dialog
    this.listenTo(document.getElementById('daDialogCancel'), 'click', () => {
      this._closeDialog('daDialog')
      window._pendingDaUrl = ''
    })
    this.listenTo(document.getElementById('daDialogConfirm'), 'click', () => this._addDirectAccess())
    this.listenTo(document.getElementById('daTitleInput'), 'keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('daDialogConfirm')?.click()
      if (e.key === 'Escape') document.getElementById('daDialogCancel')?.click()
    })
    this.listenTo(document.getElementById('daDialog'), 'mousedown', (e) => {
      if (e.target === document.getElementById('daDialog')) {
        document.getElementById('daDialogCancel')?.click()
      }
    })
  }

  setPendingDaUrl(url) {
    window._pendingDaUrl = url
  }

  _openFolderDialog() {
    const input = document.getElementById('folderNameInput')
    if (input) input.value = ''
    document.querySelectorAll('.folder-color').forEach(c => c.classList.remove('active'))
    const first = document.querySelector('.folder-color')
    if (first) first.classList.add('active')
    document.getElementById('folderDialog')?.classList.add('open')
    setTimeout(() => input?.focus(), 100)
  }

  _openBookmarkDialog() {
    const urlInput = document.getElementById('bookmarkUrlInput')
    const titleInput = document.getElementById('bookmarkTitleInput')
    if (urlInput) urlInput.value = ''
    if (titleInput) titleInput.value = ''
    document.getElementById('bookmarkDialog')?.classList.add('open')
    setTimeout(() => urlInput?.focus(), 100)
  }

  _closeDialog(id) {
    const el = document.getElementById(id)
    if (el) el.classList.remove('open')
  }

  _createFolder() {
    const name = document.getElementById('folderNameInput')?.value.trim()
    if (!name) return
    const color = document.querySelector('.folder-color.active')?.dataset.color || ''
    const fs = window.getFolders?.() || {}
    const meta = window.getFolderMeta?.() || {}
    if (fs[name]) {
      const input = document.getElementById('folderNameInput')
      input?.focus()
      input?.select()
      return
    }
    fs[name] = []
    meta[name] = { color }
    window.saveFolders?.(fs)
    window.saveFolderMeta?.(meta)
    window.renderSidebar?.()
    this._closeDialog('folderDialog')
  }

  async _addBookmark() {
    const btn = document.getElementById('bookmarkDialogConfirm')
    const orig = btn?.innerHTML
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="loading-dots"><span></span><span></span><span></span></span>' }

    const url = document.getElementById('bookmarkUrlInput')?.value.trim()
    if (!url) { if (btn) { btn.disabled = false; btn.innerHTML = orig } return }
    const bms = window.getBookmarks?.() || []
    const id = '_bm_' + Date.now()
    const bm = { id, url, title: document.getElementById('bookmarkTitleInput')?.value.trim() || url, added: Date.now() }

    const proxyUrls = [
      `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      `https://corsproxy.io/?url=${encodeURIComponent(url)}`
    ]
    const twMatch = url.match(/https?:\/\/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/i)
    if (twMatch) {
      proxyUrls.push(`https://api.allorigins.win/raw?url=${encodeURIComponent(`https://api.vxtwitter.com/Twitter/status/${twMatch[1]}`)}`)
    }
    const imgPatterns = [
      /<meta\s+property="og:image"\s+content="([^"]+)"/i,
      /<meta\s+property="og:image:secure_url"\s+content="([^"]+)"/i,
      /<meta\s+name="twitter:image"\s+content="([^"]+)"/i,
      /<meta\s+name="twitter:image:src"\s+content="([^"]+)"/i,
      /<link\s+rel="image_src"\s+href="([^"]+)"/i,
      /<meta\s+property="og:image"[^>]+content="([^"]+)"/i
    ]
    for (const proxyUrl of proxyUrls) {
      try {
        const ctrl = new AbortController()
        const t = setTimeout(() => ctrl.abort(), 5000)
        const text = await (await fetch(proxyUrl, { signal: ctrl.signal })).text()
        clearTimeout(t)
        try {
          const json = JSON.parse(text)
          const mediaUrl = json?.media_extended?.[0]?.url || json?.media?.[0]?.url
          if (mediaUrl) { bm.image = mediaUrl; break }
        } catch {}
        for (const pat of imgPatterns) {
          const m = text.match(pat)
          if (m) { bm.image = m[1].replace(/&amp;/g, '&'); break }
        }
        if (bm.image) break
      } catch {}
    }

    for (const proxyUrl of proxyUrls) {
      try {
        const ctrl = new AbortController()
        const t = setTimeout(() => ctrl.abort(), 5000)
        const html = await (await fetch(proxyUrl, { signal: ctrl.signal })).text()
        clearTimeout(t)
        for (const pat of imgPatterns) {
          const m = html.match(pat)
          if (m) { bm.image = m[1].replace(/&amp;/g, '&'); break }
        }
        if (bm.image) break
      } catch {}
    }

    bms.push(bm)
    window.saveBookmarks?.(bms)

    if (btn) { btn.disabled = false; btn.innerHTML = orig }
    const urlInput = document.getElementById('bookmarkUrlInput')
    const titleInput = document.getElementById('bookmarkTitleInput')
    if (urlInput) urlInput.value = ''
    if (titleInput) titleInput.value = ''
    this._closeDialog('bookmarkDialog')
    window.renderSidebar?.()
    if (window.renderGridView) window.renderGridView()
  }

  _addDirectAccess() {
    const btn = document.getElementById('daDialogConfirm')
    const orig = btn?.innerHTML
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="loading-dots"><span></span><span></span><span></span></span>' }

    const url = window._pendingDaUrl || ''
    if (!url) { if (btn) { btn.disabled = false; btn.innerHTML = orig }; return }
    const das = window.getDirectAccess?.() || []
    const title = document.getElementById('daTitleInput')?.value.trim() || url
    let domain = ''
    try { domain = new URL(url).hostname } catch { domain = url.replace(/^https?:\/\//, '').split('/')[0] }
    const da = { id: '_da_' + Date.now(), url, title, added: Date.now(), image: `https://www.google.com/s2/favicons?domain=${domain}&sz=128` }
    das.push(da)
    window.saveDirectAccess?.(das)

    if (btn) { btn.disabled = false; btn.innerHTML = orig }
    const input = document.getElementById('kiroInput')
    if (input) input.value = ''
    this._closeDialog('daDialog')
    window._pendingDaUrl = ''
    window.renderSidebar?.()
    if (window.renderGridView) window.renderGridView()
    if (window.closeSidebarMobile) window.closeSidebarMobile()
  }
}
