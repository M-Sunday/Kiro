import { Component } from './base/Component'
import type { Video, Note, Bookmark, DirectAccess, ExternalFile } from '../../shared/types'

type SectionItem = {
  type: 'video' | 'note' | 'bookmark' | 'da' | 'ext'
  id: string
  title: string
  subtitle: string
  image?: string
  blurred?: boolean
}

export class GridView extends Component {
  private _gridEl: HTMLElement | null = null
  private _batchBarEl: HTMLElement | null = null
  private _batchCountEl: HTMLElement | null = null

  override render(): void {
    if (!this.rootEl) return
    this._gridEl = this.rootEl
    this._batchBarEl = this.rootEl.querySelector('#batchBar')
    this._batchCountEl = this.rootEl.querySelector('#batchCount')

    this.subscribe('videos', () => this._rerender())
    this.subscribe('folders', () => this._rerender())
    this.subscribe('notes', () => this._rerender())
    this.subscribe('bookmarks', () => this._rerender())
    this.subscribe('directAccess', () => this._rerender())
    this.subscribe('externalFiles', () => this._rerender())
    this.subscribe('pins', () => this._rerender())
    this.subscribe('nsfw', () => this._rerender())
    this.subscribe('blurAllNSFW', () => this._rerender())

    this.on('ui:grid:refresh', () => this._rerender())

    this._rerender()
  }

  open(): void {
    if (this._gridEl) this._gridEl.classList.add('open')
    this._rerender()
  }

  close(): void {
    if (this._gridEl) this._gridEl.classList.remove('open')
  }

  override destroy(): void {
    this._gridEl = null
    this._batchBarEl = null
    this._batchCountEl = null
    super.destroy()
  }

  private _rerender(): void {
    if (!this._gridEl || !this.isMounted) return
    const state = this.state.fullState

    let html = ''

    // Workbench toolbar
    html += this._workbenchHTML(state.userName)

    // Sections: Pinned, Folders, Notes, Bookmarks, Direct Access, External Files
    const pins = state.pins
    if (pins.length > 0) {
      html += this._sectionHTML('Pinned', this._itemsFromIds(pins, 'video', state.videos), 'pinned', undefined, true)
    }

    // Custom folders
    const folderNames = Object.keys(state.folders).filter(f => f !== 'Videos' && f !== 'Archived')
    const mainFolders = ['Videos', 'Archived']
    for (const name of [...mainFolders, ...folderNames]) {
      const ids = state.folders[name] ?? []
      if (ids.length === 0) continue
      const meta = state.folderMeta[name]
      const items = this._itemsFromIds(ids, 'video', state.videos)
      html += this._sectionHTML(name, items, name, meta?.color)
    }

    // Notes section
    if (state.notes.length > 0) {
      const items: SectionItem[] = state.notes.map(n => ({
        type: 'note',
        id: n.id,
        title: n.title,
        subtitle: `${n.todos.filter(t => t.done).length}/${n.todos.length} todos`,
      }))
      html += this._sectionHTML('Notes', items, 'notes')
    }

    // Bookmarks section
    if (state.bookmarks.length > 0) {
      const items: SectionItem[] = state.bookmarks.map(b => ({
        type: 'bookmark',
        id: b.id,
        title: b.title,
        subtitle: b.url,
        image: b.image,
        blurred: b.blurred,
      }))
      html += this._sectionHTML('Bookmarks', items, 'bookmarks')
    }

    // Direct Access section
    if (state.directAccess.length > 0) {
      const items: SectionItem[] = state.directAccess.map(d => ({
        type: 'da',
        id: d.id,
        title: d.title,
        subtitle: d.url,
        image: d.image,
        blurred: d.blurred,
      }))
      html += this._sectionHTML('Direct Access', items, 'da')
    }

    // External Files section
    if (state.externalFiles.length > 0) {
      const items: SectionItem[] = state.externalFiles.map(e => ({
        type: 'ext',
        id: e.id ?? '',
        title: e.name,
        subtitle: this._formatSize(e.size),
        image: e.thumbnail,
        blurred: e.blurred,
      }))
      html += this._sectionHTML('External Files', items, 'ext')
    }

    this._gridEl.innerHTML = html
    this._bindItemEvents()
  }

  private _workbenchHTML(userName: string): string {
    return `
      <div class="grid-workbench">
        <div class="grid-greeting">${userName ? `Hello, ${this._escapeHtml(userName)}` : ''}</div>
        <div class="grid-clock" data-ref="gridClock"></div>
        <div class="wb-actions">
          <button class="wb-btn" data-action="new-note">+ Note</button>
          <button class="wb-btn" data-action="new-bookmark">+ Bookmark</button>
          <button class="wb-btn" data-action="new-folder">+ Folder</button>
          <button class="wb-btn" data-action="import-file">+ File</button>
          <button class="wb-btn" data-action="camera">📷 Camera</button>
        </div>
      </div>
    `
  }

  private _sectionHTML(name: string, items: SectionItem[], sectionId: string, color?: string, noCollapse = false): string {
    if (items.length === 0) return ''
    const collapsed = this.state.get<Record<string, boolean>>('collapsed')?.[sectionId]

    return `
      <div class="grid-section" data-section="${sectionId}">
        <div class="grid-section-header" data-section="${sectionId}">
          <span class="grid-section-caret">${collapsed ? '▶' : '▼'}</span>
          <span class="grid-section-title" style="${color ? `color:${color}` : ''}">${this._escapeHtml(name)}</span>
          <span class="grid-section-count">${items.length}</span>
          ${!noCollapse ? `<button class="grid-section-close">×</button>` : ''}
        </div>
        <div class="grid-section-items" style="${collapsed ? 'display:none' : ''}">
          ${items.map(item => this._itemCardHTML(item)).join('')}
        </div>
      </div>
    `
  }

  private _itemCardHTML(item: SectionItem): string {
    const attr = `data-${item.type}-id="${item.id}"`
    const blurred = item.blurred && this.state.get<boolean>('blurAllNSFW')
    const nsfwClass = blurred ? ' nsfw-blur' : ''
    const icon = item.type === 'video' ? '🎬' : item.type === 'note' ? '📝' : item.type === 'bookmark' ? '🔖' : item.type === 'da' ? '⚡' : '📁'

    return `
      <div class="grid-item${nsfwClass}" ${attr} draggable="true">
        <div class="grid-item-thumb">
          ${item.image ? `<img src="${item.image}" alt="" loading="lazy" onerror="this.style.display='none'" />` : `<div class="grid-item-icon">${icon}</div>`}
        </div>
        <div class="grid-item-info">
          <div class="grid-item-title">${this._escapeHtml(item.title)}</div>
          <div class="grid-item-subtitle">${this._escapeHtml(item.subtitle)}</div>
        </div>
      </div>
    `
  }

  private _itemsFromIds(ids: string[], type: string, videos: Record<string, Video>): SectionItem[] {
    return ids
      .map(id => videos[id])
      .filter((v): v is Video => !!v)
      .map(v => ({
        type: type as 'video',
        id: v.videoId,
        title: v.title,
        subtitle: v.channel,
        image: v.thumbnail,
        blurred: v.blurred,
      }))
  }

  private _bindItemEvents(): void {
    if (!this._gridEl) return

    // Workbench button clicks
    const wbBtns = this._gridEl.querySelectorAll('.wb-btn')
    for (const btn of wbBtns) {
      this.listenTo(btn, 'click', ((e: Event) => {
        const action = (e.currentTarget as HTMLElement).getAttribute('data-action')
        if (!action) return
        switch (action) {
          case 'new-note':
            this.emit('ui:note:create', { data: { title: 'Untitled' } })
            break
          case 'new-bookmark':
            this.emit('ui:bookmark:create-dialog')
            break
          case 'new-folder':
            this.emit('ui:folder:create-dialog')
            break
          case 'import-file':
            this.emit('ui:file:import')
            break
          case 'camera':
            this.emit('ui:camera:open')
            break
        }
      }) as EventListener)
    }

    // Section header toggle
    const headers = this._gridEl.querySelectorAll('.grid-section-header')
    for (const hdr of headers) {
      this.listenTo(hdr, 'click', ((e: Event) => {
        const target = e.target as HTMLElement
        if (target.closest('.grid-section-close')) return
        const section = (e.currentTarget as HTMLElement).getAttribute('data-section')
        if (!section) return
        const collapsed = this.state.get<Record<string, boolean>>('collapsed') ?? {}
        collapsed[section] = !collapsed[section]
        this.state.set('collapsed', collapsed)
      }) as EventListener)
    }

    // Item click to open
    const items = this._gridEl.querySelectorAll('[data-video-id], [data-note-id], [data-bookmark-id], [data-da-id], [data-ext-id]')
    for (const item of items) {
      this.listenTo(item, 'click', ((e: Event) => {
        const el = e.currentTarget as HTMLElement
        const videoId = el.getAttribute('data-video-id')
        const noteId = el.getAttribute('data-note-id')
        const bookmarkId = el.getAttribute('data-bookmark-id')
        const daId = el.getAttribute('data-da-id')
        const extId = el.getAttribute('data-ext-id')

        if (videoId) {
          this.emit('ui:card:load-video', { id: videoId })
          this.emit('ui:view:set', { view: 'card' })
        } else if (noteId) {
          this.emit('ui:note:open', { id: noteId })
        } else if (bookmarkId) {
          const bm = this.state.get<Bookmark[]>('bookmarks')?.find(b => b.id === bookmarkId)
          if (bm?.url) window.open(bm.url, '_blank')
        } else if (daId) {
          const da = this.state.get<DirectAccess[]>('directAccess')?.find(d => d.id === daId)
          if (da?.url) window.open(da.url, '_blank')
        } else if (extId) {
          this.emit('ui:ext:open', { id: extId })
        }
      }) as EventListener)
    }

    // Context menu
    for (const item of items) {
      this.listenTo(item, 'contextmenu', ((e: Event) => {
        e.preventDefault()
        const el = e.currentTarget as HTMLElement
        const rect = el.getBoundingClientRect()
        const payload: Record<string, unknown> = {
          x: e instanceof MouseEvent ? e.clientX : rect.left,
          y: e instanceof MouseEvent ? e.clientY : rect.bottom,
        }
        const attrs = ['video-id', 'note-id', 'bookmark-id', 'da-id', 'ext-id']
        for (const attr of attrs) {
          const val = el.getAttribute(attr)
          if (val) payload[attr.replace(/-/g, '')] = val
        }
        this.emit('ui:context-menu:show', payload as any)
      }) as EventListener)
    }
  }

  private _formatSize(bytes: number): string {
    if (!bytes || bytes === 0) return ''
    const units = ['B', 'KB', 'MB', 'GB']
    let i = 0
    let size = bytes
    while (size >= 1024 && i < units.length - 1) { size /= 1024; i++ }
    return `${size.toFixed(1)} ${units[i]}`
  }

  private _escapeHtml(str: string): string {
    const div = document.createElement('div')
    div.textContent = str
    return div.innerHTML
  }
}
