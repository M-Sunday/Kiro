import { Component } from './base/Component.js'

let _pageIdCounter = Date.now()
function genPageId() { return '_page_' + (_pageIdCounter++) }
function genBlockId() { return '_blk_' + (_pageIdCounter++) }

const PICKER_TYPES = {
  note: { label: 'Select notes', dataAttr: 'data-note-id', blockType: 'note' },
  photo: { label: 'Select photos', dataAttr: 'data-da-id', blockType: 'photo' },
  video: { label: 'Select videos', dataAttr: 'data-video-id', blockType: 'video' }
}

export class PagesView extends Component {
  constructor() {
    super()
    this._currentPageId = null
    this._pickerType = null
    this._selectedIds = new Set()
  }

  mount(rootEl) {
    super.mount(rootEl)
    window.closePageView = () => this.closePageView()
    this._bindEvents()
  }

  _bindEvents() {
    this.listenTo(document.getElementById('pageBackBtn'), 'click', () => this._close())
    this.bus.on('ui:page:close', () => {
      this._currentPageId = null
      const popup = document.getElementById('pageFabPopup')
      if (popup) popup.classList.remove('open')
    })
    this.listenTo(document.getElementById('pageDeleteBtn'), 'click', () => this._deleteCurrent())
    this.listenTo(document.getElementById('pageTitleInput'), 'input', () => this._saveTitle())

    const pageView = document.getElementById('pageView')
    const header = document.getElementById('pageHeader')
    const hero = document.getElementById('pageHero')
    pageView.addEventListener('scroll', () => {
      if (!hero.classList.contains('has-image')) { header.classList.remove('stuck'); return }
      header.classList.toggle('stuck', pageView.scrollTop >= hero.offsetHeight - header.offsetHeight)
    })

    /* Swipe navigation on mobile */
    let touchStartX = 0, touchStartY = 0
    pageView.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX
      touchStartY = e.touches[0].clientY
    }, { passive: true })
    pageView.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX
      const dy = e.changedTouches[0].clientY - touchStartY
      if (Math.abs(dx) < 80 || Math.abs(dx) < Math.abs(dy) * 1.5) return
      window.Capacitor?.Plugins?.Haptics?.selectionChanged()
      if (dx > 0) this._close() /* swipe right → grid */
      else this._goHome()        /* swipe left → home */
    }, { passive: true })

    window.__pageMobileAction = () => {
      const popup = document.getElementById('pageFabPopup')
      if (!popup) return
      popup.classList.toggle('open')
    }
    this.listenTo(document.getElementById('pageFabPopup'), 'click', (e) => {
      const item = e.target.closest('[data-page-action], .page-fab-grid-close')
      if (!item) return
      if (item.classList.contains('page-fab-grid-close')) {
        document.getElementById('pageFabPopup')?.classList.remove('open')
        return
      }
      const action = item.dataset.pageAction
      const popupAction = item.dataset.pagePopupAction
      if (!action || !popupAction) return
      document.getElementById('pageFabPopup')?.classList.remove('open')
      if (popupAction === 'new') {
        if (action === 'note') this._addNoteBlock()
        else if (action === 'photo') this._addPhotoBlock()
        else if (action === 'video') this._addVideoBlock()
      } else if (popupAction === 'pick') {
        this._openPicker(action)
      }
    })
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.page-fab-set')) {
        document.getElementById('pageFabPopup')?.classList.remove('open')
      }
    })

    this.listenTo(document.getElementById('pageHeroPlaceholder'), 'click', () => this._setHeroImage())
    this.listenTo(document.getElementById('pageHeroRemove'), 'click', (e) => { e.stopPropagation(); this._removeHeroImage() })

    document.getElementById('pickerDone')?.addEventListener('click', () => this._pickerDone())
    document.getElementById('pickerSelectAll')?.addEventListener('click', () => this._pickerToggleAll())
  }

  createNewPage() {
    const page = {
      id: genPageId(),
      title: '',
      heroImage: '',
      blocks: [],
      added: Date.now(),
      updated: Date.now()
    }
    const pages = window.getPages()
    pages.unshift(page)
    window.savePages(pages)
    this.state.setState('pages', pages)
    this._openPage(page.id)
  }

  openPage(pageId) {
    this._openPage(pageId)
  }

  _openPage(pageId) {
    this._currentPageId = pageId
    const pages = window.getPages()
    const page = pages.find(p => p.id === pageId)
    if (!page) return
    document.getElementById('pageTitleInput').value = page.title || ''
    this._renderHero(page.heroImage)
    this._renderBlocks(page.blocks)
    this._show()
    window.__navigation?.push('page')
  }

  _show() {
    this._hideOtherViews()
    document.getElementById('pageView').style.display = 'flex'
    this._toggleMobileNav(true)
  }

  _toggleMobileNav(pageMode) {
    const bar = document.querySelector('.mobile-nav-bar')
    const addBtn = document.getElementById('mobileAddBtn')
    if (!bar) return
    bar.classList.toggle('page-mode', pageMode)
    if (addBtn) addBtn.classList.toggle('page-close', pageMode)
  }

  _hideOtherViews() {
    document.getElementById('noteView').style.display = 'none'
    document.getElementById('gridView')?.classList.remove('open')
    document.getElementById('extTextView').style.display = 'none'
    document.getElementById('extVideoView').style.display = 'none'
    document.getElementById('extImageView').style.display = 'none'
    const ct = document.querySelector('.content')
    if (ct) ct.style.display = 'none'
    const sl = document.getElementById('searchLanding')
    if (sl) sl.style.display = 'none'
    const ve = document.getElementById('extVideoElement')
    if (ve) ve.pause()
  }

  _close() {
    document.getElementById('pageView').style.display = 'none'
    this._currentPageId = null
    this._toggleMobileNav(false)
    window.__navigation?.replace('grid')
    document.getElementById('gridView')?.classList.add('open')
    if (window.renderGridView) window.renderGridView()
    if (window.syncViewTabs) window.syncViewTabs('grid')
  }

  closePageView() {
    this._close()
  }

  _goHome() {
    document.getElementById('pageView').style.display = 'none'
    this._currentPageId = null
    this._toggleMobileNav(false)
    window.__navigation?.replace('home')
    document.getElementById('gridView')?.classList.add('open')
    if (window.renderGridView) window.renderGridView()
    if (window.syncViewTabs) window.syncViewTabs('home')
  }

  _deleteCurrent() {
    if (!this._currentPageId) return
    if (!confirm('Delete this page?')) return
    let pages = window.getPages()
    pages = pages.filter(p => p.id !== this._currentPageId)
    window.savePages(pages)
    this.state.setState('pages', pages)
    this._close()
  }

  _saveTitle() {
    if (!this._currentPageId) return
    const title = document.getElementById('pageTitleInput').value.trim()
    let pages = window.getPages()
    const page = pages.find(p => p.id === this._currentPageId)
    if (!page) return
    page.title = title
    page.updated = Date.now()
    window.savePages(pages)
    clearTimeout(this._saveTitleTimer)
    this._saveTitleTimer = setTimeout(() => {
      this.state.setState('pages', pages)
    }, 300)
  }

  _addNoteBlock() {
    const block = { id: genBlockId(), type: 'note', content: '' }
    this._addBlock(block)
  }

  _addPhotoBlock() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        this._addBlock({ id: genBlockId(), type: 'photo', dataUrl: ev.target.result, fileName: file.name })
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  _addVideoBlock() {
    const url = prompt('Paste a YouTube link:')
    if (!url) return
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    if (!match) { alert('Invalid YouTube link'); return }
    this._addBlock({ id: genBlockId(), type: 'video', videoId: match[1], title: '', thumbnail: `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` })
  }

  _addBlock(block) {
    if (!this._currentPageId) return
    let pages = window.getPages()
    const page = pages.find(p => p.id === this._currentPageId)
    if (!page) return
    page.blocks.push(block)
    page.updated = Date.now()
    window.savePages(pages)
    this.state.setState('pages', pages)
    this._renderBlocks(page.blocks)
  }

  _renderBlocks(blocks) {
    const container = document.getElementById('pageBlocks')
    if (!container) return
    if (!blocks.length) {
      container.innerHTML = ''
      return
    }
    container.innerHTML = blocks.map((block, i) => this._blockHTML(block, i)).join('')
    container.querySelectorAll('.page-block-note').forEach(el => {
      const id = el.dataset.blockId
      el.addEventListener('input', () => this._updateNoteBlock(id, el.innerHTML))
    })
    container.querySelectorAll('.page-block-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        this._removeBlock(btn.dataset.blockId)
      })
    })
  }

  _blockHTML(block) {
    switch (block.type) {
      case 'note':
        return `<div class="page-block" data-block-id="${block.id}">
          <button class="page-block-remove" data-block-id="${block.id}">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
          <div class="page-block-label">Note</div>
          <div class="page-block-note" data-block-id="${block.id}" contenteditable="true" spellcheck="false">${block.content || ''}</div>
        </div>`
      case 'photo':
        return `<div class="page-block" data-block-id="${block.id}">
          <button class="page-block-remove" data-block-id="${block.id}">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
          <div class="page-block-label">Photo</div>
          <img class="page-block-photo" src="${block.dataUrl}" alt="${block.fileName || ''}" loading="lazy">
        </div>`
      case 'video':
        return `<div class="page-block" data-block-id="${block.id}">
          <button class="page-block-remove" data-block-id="${block.id}">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
          <div class="page-block-label">Video</div>
          <img class="page-block-video-thumb" src="${block.thumbnail}" alt="" loading="lazy">
          <a class="page-block-video-link" href="https://youtube.com/watch?v=${block.videoId}" target="_blank" rel="noopener">Open on YouTube</a>
        </div>`
      default:
        return ''
    }
  }

  _updateNoteBlock(id, content) {
    if (!this._currentPageId) return
    let pages = window.getPages()
    const page = pages.find(p => p.id === this._currentPageId)
    if (!page) return
    const block = page.blocks.find(b => b.id === id)
    if (!block || block.type !== 'note') return
    block.content = content
    page.updated = Date.now()
    window.savePages(pages)
    this.state.setState('pages', pages)
  }

  _removeBlock(blockId) {
    if (!this._currentPageId) return
    let pages = window.getPages()
    const page = pages.find(p => p.id === this._currentPageId)
    if (!page) return
    page.blocks = page.blocks.filter(b => b.id !== blockId)
    page.updated = Date.now()
    window.savePages(pages)
    this.state.setState('pages', pages)
    this._renderBlocks(page.blocks)
  }

  /* ─── HERO IMAGE ──────────────────────────────────── */

  _renderHero(dataUrl) {
    const hero = document.getElementById('pageHero')
    const img = document.getElementById('pageHeroImg')
    if (dataUrl) {
      img.src = dataUrl
      hero.classList.add('has-image')
    } else {
      hero.classList.remove('has-image')
    }
  }

  _setHeroImage() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        const dataUrl = ev.target.result
        if (!this._currentPageId) return
        let pages = window.getPages()
        const page = pages.find(p => p.id === this._currentPageId)
        if (!page) return
        page.heroImage = dataUrl
        page.updated = Date.now()
        window.savePages(pages)
        this.state.setState('pages', pages)
        this._renderHero(dataUrl)
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  _removeHeroImage() {
    if (!this._currentPageId) return
    let pages = window.getPages()
    const page = pages.find(p => p.id === this._currentPageId)
    if (!page) return
    page.heroImage = ''
    page.updated = Date.now()
    window.savePages(pages)
    this.state.setState('pages', pages)
    this._renderHero('')
  }

  /* ─── PICKER (grid import) ─────────────────────────── */

  _openPicker(type) {
    this._pickerType = type
    this._selectedIds = new Set()
    const config = PICKER_TYPES[type]
    if (!config) return
    document.getElementById('pickerTitle').textContent = config.label
    this._renderPickerItems(type)
    document.getElementById('pagePicker').style.display = 'flex'
  }

  _closePicker() {
    document.getElementById('pagePicker').style.display = 'none'
    this._pickerType = null
    this._selectedIds.clear()
  }

  _renderPickerItems(type) {
    const container = document.getElementById('pickerItems')
    if (!container) return
    const config = PICKER_TYPES[type]
    const allItems = container.closest('.page-view') ? this._collectItems(type) : []
    if (!allItems.length) {
      container.innerHTML = '<div style="padding:24px;text-align:center;color:#86868b;font-size:14px">No items found</div>'
      return
    }
    container.innerHTML = allItems.map(item => {
      const id = item.dataset.noteId || item.dataset.daId || item.dataset.videoId
      const img = item.querySelector('.grid-item-img') || item.querySelector('img')
      const titleEl = item.querySelector('.grid-item-title')
      const title = titleEl ? titleEl.textContent : ''
      const imgSrc = img ? (img.src || '') : ''
      return `<div class="page-picker-item" data-item-id="${id}">
        <img class="page-picker-item-img" src="${imgSrc}" alt="" loading="lazy" onerror="this.style.display='none'">
        <div class="page-picker-item-title">${title || 'Untitled'}</div>
        <div class="page-picker-circle">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
      </div>`
    }).join('')
    container.querySelectorAll('.page-picker-item').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset.itemId
        if (this._selectedIds.has(id)) this._selectedIds.delete(id)
        else this._selectedIds.add(id)
        el.classList.toggle('selected')
      })
    })
  }

  _collectItems(type) {
    const sections = document.querySelectorAll('#gridSections .grid-item')
    const config = PICKER_TYPES[type]
    return Array.from(sections).filter(item => item.querySelector(`[${config.dataAttr}]`) || item.hasAttribute(config.dataAttr))
  }

  _pickerToggleAll() {
    const items = document.querySelectorAll('#pickerItems .page-picker-item')
    if (this._selectedIds.size === items.length) {
      this._selectedIds.clear()
      items.forEach(el => el.classList.remove('selected'))
    } else {
      this._selectedIds = new Set(Array.from(items).map(el => el.dataset.itemId))
      items.forEach(el => el.classList.add('selected'))
    }
  }

  _pickerDone() {
    const type = this._pickerType
    const config = PICKER_TYPES[type]
    if (!config) return
    const allItems = document.querySelectorAll('#gridSections .grid-item')
    const selected = Array.from(allItems).filter(item => {
      const id = item.dataset.noteId || item.dataset.daId || item.dataset.videoId
      return id && this._selectedIds.has(id)
    })
    for (const item of selected) {
      this._importGridItem(item, config.blockType)
    }
    this._closePicker()
  }

  _importGridItem(item, blockType) {
    const noteId = item.dataset.noteId
    const daId = item.dataset.daId
    const videoId = item.dataset.videoId
    const titleEl = item.querySelector('.grid-item-title')
    const title = titleEl ? titleEl.textContent : ''
    const img = item.querySelector('.grid-item-img') || item.querySelector('img')
    let block
    if (noteId && blockType === 'note') {
      const notes = window.getNotes ? window.getNotes() : []
      const note = notes.find(n => n.id === noteId)
      block = { id: genBlockId(), type: 'note', content: note ? note.content : '' }
    } else if (daId && blockType === 'photo') {
      block = { id: genBlockId(), type: 'photo', dataUrl: img ? img.src : '', fileName: title || '' }
    } else if (videoId && blockType === 'video') {
      block = { id: genBlockId(), type: 'video', videoId, title, thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` }
    }
    if (block) this._addBlock(block)
  }
}
