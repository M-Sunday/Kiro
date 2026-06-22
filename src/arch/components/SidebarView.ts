import { Component } from './base/Component'

export class SidebarView extends Component {
  private _treeEl: HTMLElement | null = null
  private _searchInput: HTMLInputElement | null = null
  private _sidebarEl: HTMLElement | null = null
  private _filterText = ''

  override render(): void {
    if (!this.rootEl) return
    this._sidebarEl = this.rootEl
    this._treeEl = this.rootEl.querySelector('#sidebarTree')
    this._searchInput = this.rootEl.querySelector('#searchInput')

    this._searchInput && this.listenTo(this._searchInput, 'input', this._onFilter.bind(this) as EventListener)

    this.subscribe('folders', () => this._rerenderTree())
    this.subscribe('videos', () => this._rerenderTree())
    this.subscribe('notes', () => this._rerenderTree())
    this.subscribe('bookmarks', () => this._rerenderTree())
    this.subscribe('directAccess', () => this._rerenderTree())
    this.subscribe('externalFiles', () => this._rerenderTree())
    this.subscribe('pins', () => this._rerenderTree())
    this.subscribe('collapsed', () => this._rerenderTree())
    this.subscribe('ui.currentVideoId', () => this._rerenderTree())
    this.subscribe('ui.currentNoteId', () => this._rerenderTree())

    // Hook into existing sidebar footer buttons
    const newFolderBtn = this.rootEl.querySelector('#newFolderBtn')
    const newBookmarkBtn = this.rootEl.querySelector('#newBookmarkBtn')
    const newNoteBtn = this.rootEl.querySelector('#newNoteBtn')
    if (newFolderBtn) this.listenTo(newFolderBtn, 'click', () => this.emit('ui:folder:create-dialog'))
    if (newBookmarkBtn) this.listenTo(newBookmarkBtn, 'click', () => this.emit('ui:bookmark:create-dialog'))
    if (newNoteBtn) this.listenTo(newNoteBtn, 'click', () => this.emit('ui:note:create', { data: { title: 'Untitled' } }))
    const settingsBtn = this.rootEl.querySelector('#settingsBtn')
    if (settingsBtn) this.listenTo(settingsBtn, 'click', () => this.emit('ui:settings:open'))

    this._rerenderTree()
  }

  toggle(force?: boolean): void {
    if (!this._sidebarEl) return
    if (force !== undefined) {
      this._sidebarEl.classList.toggle('closed', !force)
    } else {
      this._sidebarEl.classList.toggle('closed')
    }
    this.state.set('ui.sidebarClosed', this._sidebarEl.classList.contains('closed'))
  }

  override destroy(): void {
    this._treeEl = null
    this._searchInput = null
    this._sidebarEl = null
    super.destroy()
  }

  private _onFilter(): void {
    this._filterText = this._searchInput?.value?.toLowerCase() ?? ''
    this._rerenderTree()
  }

  private _rerenderTree(): void {
    if (!this._treeEl || !this.isMounted) return
    const state = this.state.fullState
    const folders = state.folders
    const folderMeta = state.folderMeta
    const collapsed = state.collapsed
    const pins = state.pins
    const videos = state.videos
    const notes = state.notes
    const bookmarks = state.bookmarks
    const directAccess = state.directAccess
    const externalFiles = state.externalFiles
    const currentVideoId = state.ui.currentVideoId
    const currentNoteId = state.ui.currentNoteId

    const filter = this._filterText
    const matchesFilter = (text: string): boolean => !filter || text.toLowerCase().includes(filter)

    let html = ''

    // Pages section (always shown at top)
    const pages = state.pages
    html += `<div class="tree-folder" data-pages="true">
      <div class="tree-folder-header" data-pages="true">
        <span class="tree-caret">▼</span>
        <span class="tree-label">📄 Pages</span>
        <span class="tree-count">${pages.length}</span>
      </div>
      <div class="tree-children">`
    for (const p of pages) {
      if (filter && !matchesFilter(p.title)) continue
      html += `<div class="tree-file" data-page-id="${p.id}">
        <span class="tree-file-icon">${p.heroImage ? `<img src="${this._escapeAttr(p.heroImage)}" />` : '📄'}</span>
        <span class="tree-label">${this._escapeHtml(p.title || 'Untitled')}</span>
      </div>`
    }
    html += `</div></div>`

    // Root folders (Videos, Archived) + custom folders
    const rootFolders = ['Videos', 'Archived']
    const customFolders = Object.keys(folders).filter(f => !rootFolders.includes(f))

    for (const name of [...rootFolders, ...customFolders]) {
      const ids = folders[name] ?? []
      const meta = folderMeta[name]
      const isCollapsed = collapsed[name]
      const hasFilterMatch = ids.some(id => {
        const v = videos[id]
        return v && matchesFilter(v.title)
      })
      const folderMatch = matchesFilter(name)

      if (filter && !folderMatch && !hasFilterMatch) continue

      html += `<div class="tree-folder" data-folder="${this._escapeAttr(name)}">
        <div class="tree-folder-header" data-folder="${this._escapeAttr(name)}">
          <span class="tree-caret">${isCollapsed ? '▶' : '▼'}</span>
          <span class="tree-label" style="${meta?.color ? `color:${meta.color}` : ''}">${this._escapeHtml(name)}</span>
          <span class="tree-count">${ids.length}</span>
        </div>
        <div class="tree-children" style="${isCollapsed ? 'display:none' : ''}">`

      for (const id of ids) {
        const video = videos[id]
        if (!video) continue
        if (filter && !matchesFilter(video.title)) continue

        const isPinned = pins.includes(id)
        const isActive = id === currentVideoId
        const blurred = video.blurred && state.blurAllNSFW
        html += `<div class="tree-file${isActive ? ' active' : ''}" data-video-id="${id}">
          <span class="tree-file-icon">${video.thumbnail ? `<img src="${this._escapeAttr(video.thumbnail)}" />` : '🎬'}</span>
          <span class="tree-label${blurred ? ' nsfw-blur' : ''}">${this._escapeHtml(video.title)}</span>
          ${isPinned ? '<span class="tree-pin">📌</span>' : ''}
        </div>`
      }

      html += `</div></div>`
    }

    // Pinned section
    if (pins.length > 0 && (!filter || pins.some(id => matchesFilter(videos[id]?.title ?? '')))) {
      html += `<div class="tree-folder">
        <div class="tree-folder-header">
          <span class="tree-caret">▼</span>
          <span class="tree-label">📌 Pinned</span>
        </div>
        <div class="tree-children">`
      for (const id of pins) {
        const video = videos[id]
        if (!video) continue
        if (filter && !matchesFilter(video.title)) continue
        html += `<div class="tree-file" data-video-id="${id}">
          <span class="tree-file-icon">📌</span>
          <span class="tree-label">${this._escapeHtml(video.title)}</span>
        </div>`
      }
      html += `</div></div>`
    }

    // Notes section
    const matchedNotes = notes.filter(n => !filter || matchesFilter(n.title))
    if (matchedNotes.length > 0 || !filter) {
      html += `<div class="tree-folder">
        <div class="tree-folder-header">
          <span class="tree-caret">▼</span>
          <span class="tree-label">📝 Notes</span>
          <span class="tree-count">${notes.length}</span>
        </div>
        <div class="tree-children">`
      for (const note of matchedNotes) {
        const isActive = note.id === currentNoteId
        html += `<div class="tree-file${isActive ? ' active' : ''}" data-note-id="${note.id}">
          <span class="tree-label">${this._escapeHtml(note.title)}</span>
        </div>`
      }
      html += `</div></div>`
    }

    // Bookmarks section
    const matchedBookmarks = bookmarks.filter(b => !filter || matchesFilter(b.title))
    if (matchedBookmarks.length > 0 || !filter) {
      html += `<div class="tree-folder">
        <div class="tree-folder-header">
          <span class="tree-caret">▼</span>
          <span class="tree-label">🔖 Bookmarks</span>
          <span class="tree-count">${bookmarks.length}</span>
        </div>
        <div class="tree-children">`
      for (const bm of matchedBookmarks) {
        html += `<div class="tree-file" data-bookmark-id="${bm.id}">
          <span class="tree-label">${this._escapeHtml(bm.title)}</span>
        </div>`
      }
      html += `</div></div>`
    }

    // Direct Access section
    const matchedDA = directAccess.filter(d => !filter || matchesFilter(d.title))
    if (matchedDA.length > 0 || !filter) {
      html += `<div class="tree-folder">
        <div class="tree-folder-header">
          <span class="tree-caret">▼</span>
          <span class="tree-label">⚡ Direct Access</span>
          <span class="tree-count">${directAccess.length}</span>
        </div>
        <div class="tree-children">`
      for (const da of matchedDA) {
        html += `<div class="tree-file" data-da-id="${da.id}">
          <span class="tree-label">${this._escapeHtml(da.title)}</span>
        </div>`
      }
      html += `</div></div>`
    }

    // External Files section
    const matchedExt = externalFiles.filter(e => !filter || matchesFilter(e.name))
    if (matchedExt.length > 0 || !filter) {
      html += `<div class="tree-folder">
        <div class="tree-folder-header">
          <span class="tree-caret">▼</span>
          <span class="tree-label">📁 External Files</span>
          <span class="tree-count">${externalFiles.length}</span>
        </div>
        <div class="tree-children">`
      for (const ext of matchedExt) {
        html += `<div class="tree-file" data-ext-id="${ext.id}">
          <span class="tree-label">${this._escapeHtml(ext.name)}</span>
        </div>`
      }
      html += `</div></div>`
    }

    this._treeEl.innerHTML = html
    this._bindTreeEvents()
  }

  private _bindTreeEvents(): void {
    if (!this._treeEl) return

    // Folder header click to toggle collapse
    const headers = this._treeEl.querySelectorAll('.tree-folder-header')
    for (const header of headers) {
      this.listenTo(header, 'click', ((e: Event) => {
        const folder = (e.currentTarget as HTMLElement).getAttribute('data-folder')
        if (!folder) return
        const collapsed = this.state.get<Record<string, boolean>>('collapsed') ?? {}
        collapsed[folder] = !collapsed[folder]
        this.state.set('collapsed', collapsed)
      }) as EventListener)
    }

    // File click to open
    const files = this._treeEl.querySelectorAll('[data-video-id], [data-note-id], [data-bookmark-id], [data-da-id], [data-ext-id], [data-page-id]')
    for (const file of files) {
      this.listenTo(file, 'click', ((e: Event) => {
        const el = e.currentTarget as HTMLElement
        const videoId = el.getAttribute('data-video-id')
        const noteId = el.getAttribute('data-note-id')
        const bookmarkId = el.getAttribute('data-bookmark-id')
        const daId = el.getAttribute('data-da-id')
        const extId = el.getAttribute('data-ext-id')
        const pageId = el.getAttribute('data-page-id')

        if (videoId) {
          this.emit('ui:card:load-video', { id: videoId })
          this.emit('ui:view:set', { view: 'card' })
        } else if (noteId) {
          this.emit('ui:note:open', { id: noteId })
        } else if (bookmarkId) {
          const bm = this.state.get<Array<Record<string, string>>>('bookmarks')?.find((b: Record<string, string>) => b['id'] === bookmarkId)
          if (bm?.['url']) window.open(bm['url'], '_blank')
        } else if (daId) {
          const da = this.state.get<Array<Record<string, string>>>('directAccess')?.find((d: Record<string, string>) => d['id'] === daId)
          if (da?.['url']) window.open(da['url'], '_blank')
        } else if (extId) {
          this.emit('ui:ext:open', { id: extId })
        } else if (pageId) {
          this.emit('ui:page:open', { id: pageId })
        }
      }) as EventListener)
    }

    // Context menu on right-click
    for (const file of files) {
      this.listenTo(file, 'contextmenu', ((e: Event) => {
        e.preventDefault()
        const el = e.currentTarget as HTMLElement
        const rect = el.getBoundingClientRect()
        const payload: Record<string, unknown> = { x: e instanceof MouseEvent ? e.clientX : rect.left, y: e instanceof MouseEvent ? e.clientY : rect.bottom }
        const attrs = ['video-id', 'note-id', 'bookmark-id', 'da-id', 'ext-id', 'folder']
        for (const attr of attrs) {
          const val = el.getAttribute(`data-${attr}`)
          if (val) payload[attr.replace(/-/g, '')] = val
        }
        this.emit('ui:context-menu:show', payload as any)
      }) as EventListener)
    }
  }

  private _escapeHtml(str: string): string {
    const div = document.createElement('div')
    div.textContent = str
    return div.innerHTML
  }

  private _escapeAttr(str: string): string {
    return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;')
  }
}
