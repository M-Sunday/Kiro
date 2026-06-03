import { Component } from './base/Component'

export interface ContextMenuState {
  x: number
  y: number
  videoId?: string | null
  bookmarkId?: string | null
  noteId?: string | null
  daId?: string | null
  extId?: string | null
  folderName?: string | null
}

type MenuAction =
  | 'delete' | 'archive' | 'pin' | 'blur'
  | 'rename-folder' | 'delete-folder'
  | 'open-link' | 'open-file-location'
  | 'move-up' | 'move-down'
  | 'move-to'
  | 'unassign-folder'

const MENU_ITEMS: { id: MenuAction; label: string; contexts: string[] }[] = [
  { id: 'delete', label: 'Delete', contexts: ['video', 'bookmark', 'note', 'da', 'ext'] },
  { id: 'archive', label: 'Archive', contexts: ['video'] },
  { id: 'pin', label: 'Pin', contexts: ['video'] },
  { id: 'blur', label: 'Blur', contexts: ['video', 'bookmark', 'da', 'ext'] },
  { id: 'open-link', label: 'Open link', contexts: ['video', 'bookmark', 'da'] },
  { id: 'open-file-location', label: 'Open file location', contexts: ['ext'] },
  { id: 'rename-folder', label: 'Rename folder', contexts: ['folder'] },
  { id: 'delete-folder', label: 'Delete folder', contexts: ['folder'] },
  { id: 'move-up', label: 'Move up', contexts: ['video', 'note', 'ext'] },
  { id: 'move-down', label: 'Move down', contexts: ['video', 'note', 'ext'] },
  { id: 'unassign-folder', label: 'Unassign folder', contexts: ['note', 'ext'] },
]

export class ContextMenu extends Component {
  private _ctxMenu: HTMLElement | null = null
  private _ctxMoveTo: HTMLElement | null = null
  private _ctxTarget: { type: string; id: string } | null = null
  private _ctxFolder: string | null = null
  private _ctxVideoId: string | null = null
  private _divs: HTMLElement[] = []

  override render(): void {
    if (!this.rootEl) return
    this.rootEl.innerHTML = `
      <div id="ctxMenu" data-ref="ctxMenu" style="display:none">
        <div id="ctxDiv1" data-ref="ctxDiv1" style="display:none"></div>
        <div id="ctxDiv2" data-ref="ctxDiv2" style="display:none"></div>
        <div id="ctxDiv3" data-ref="ctxDiv3" style="display:none"></div>
        <div id="ctxDiv4" data-ref="ctxDiv4" style="display:none"></div>
        <div id="ctxMoveTo" data-ref="ctxMoveTo" style="display:none">
          <div class="ctx-item" data-action="back">← Back</div>
        </div>
      </div>
    `
    this._ctxMenu = this.rootEl.querySelector('#ctxMenu')
    this._ctxMoveTo = this.rootEl.querySelector('#ctxMoveTo')
    this._divs = [
      this.rootEl.querySelector('#ctxDiv1')!,
      this.rootEl.querySelector('#ctxDiv2')!,
      this.rootEl.querySelector('#ctxDiv3')!,
      this.rootEl.querySelector('#ctxDiv4')!,
    ]

    this.listenTo(this._ctxMenu, 'click', this._onMenuClick as EventListener)
    this.listenTo(document, 'click', this._onDocClick as EventListener)
    this.listenTo(document, 'touchstart', this._onDocClick as EventListener)
    this.on('ui:context-menu:show', this._onShow.bind(this))
  }

  show(state: ContextMenuState): void {
    this._ctxTarget = null
    this._ctxFolder = state.folderName ?? null
    this._ctxVideoId = state.videoId ?? null

    const contextType = this._resolveContextType(state)
    if (!contextType) { this.hide(); return }
    this._ctxTarget = { type: contextType, id: this._resolveId(state) }

    this._populateMenu(contextType, state)
    this._positionMenu(state.x, state.y)
  }

  hide(): void {
    if (this._ctxMenu) this._ctxMenu.style.display = 'none'
    if (this._ctxMoveTo) this._ctxMoveTo.style.display = 'none'
    this._ctxTarget = null
    this._ctxFolder = null
    this._ctxVideoId = null
  }

  private _resolveContextType(state: ContextMenuState): string | null {
    if (state.folderName) return 'folder'
    if (state.videoId) return 'video'
    if (state.bookmarkId) return 'bookmark'
    if (state.noteId) return 'note'
    if (state.daId) return 'da'
    if (state.extId) return 'ext'
    return null
  }

  private _resolveId(state: ContextMenuState): string {
    return state.videoId ?? state.bookmarkId ?? state.noteId ?? state.daId ?? state.extId ?? ''
  }

  private _populateMenu(contextType: string, state: ContextMenuState): void {
    const items = MENU_ITEMS.filter(i => i.contexts.includes(contextType))
    const chunkSize = Math.ceil(items.length / 4)

    for (let i = 0; i < 4; i++) {
      const div = this._divs[i]
      if (!div) continue
      const chunk = items.slice(i * chunkSize, (i + 1) * chunkSize)
      if (chunk.length === 0) { div.style.display = 'none'; continue }
      div.style.display = ''
      div.innerHTML = chunk.map(item => {
        let label = item.label
        if (item.id === 'pin') {
          const pinned = this.state.get<string[]>('pins')
          const isPinned = pinned?.includes(this._resolveId(state))
          label = isPinned ? 'Unpin' : 'Pin'
        }
        if (item.id === 'blur') {
          const video = this.state.get<Record<string, unknown>>('videos')
          const vid = this._resolveId(state)
          const v = video?.[vid] as Record<string, unknown> | undefined
          const blurred = v?.['blurred'] as boolean | undefined
          label = blurred ? 'Unblur' : 'Blur'
        }
        return `<div class="ctx-item" data-action="${item.id}">${label}</div>`
      }).join('')
    }

    if (contextType !== 'folder') {
      this._populateMoveTo(state)
    }
  }

  private _populateMoveTo(state: ContextMenuState): void {
    const folders = this.state.get<Record<string, string[]>>('folders')
    const moveTo = this._ctxMoveTo
    if (!moveTo) return
    const vid = this._resolveId(state)
    let currentFolder: string | null = null
    if (vid && folders) {
      for (const [name, ids] of Object.entries(folders)) {
        if (ids.includes(vid)) { currentFolder = name; break }
      }
    }
    const folderNames = folders ? Object.keys(folders).filter(f => f !== currentFolder) : []
    if (folderNames.length === 0) return
    for (const name of folderNames) {
      const div = document.createElement('div')
      div.className = 'ctx-item'
      div.setAttribute('data-action', 'move-to')
      div.setAttribute('data-folder', name)
      div.textContent = `→ ${name}`
      moveTo.appendChild(div)
    }
  }

  private _positionMenu(x: number, y: number): void {
    if (!this._ctxMenu) return
    this._ctxMenu.style.display = 'block'
    this._ctxMenu.style.left = `${x}px`
    this._ctxMenu.style.top = `${y}px`

    requestAnimationFrame(() => {
      if (!this._ctxMenu) return
      const rect = this._ctxMenu.getBoundingClientRect()
      if (rect.right > window.innerWidth) {
        this._ctxMenu.style.left = `${window.innerWidth - rect.width - 10}px`
      }
      if (rect.bottom > window.innerHeight) {
        this._ctxMenu.style.top = `${window.innerHeight - rect.height - 10}px`
      }
    })
  }

  private _onMenuClick(e: Event): void {
    const target = e.target as HTMLElement
    const item = target.closest('[data-action]') as HTMLElement | null
    if (!item) return

    const action = item.getAttribute('data-action') as MenuAction | 'back'
    if (action === 'back') { this._showMainMenu(); return }
    if (action === 'move-to') {
      const folder = item.getAttribute('data-folder') ?? ''
      this._handleAction('move-to', folder)
      return
    }
    this._handleAction(action as MenuAction)
  }

  private _onDocClick(): void {
    this.hide()
  }

  private _showMainMenu(): void {
    if (this._ctxMoveTo) this._ctxMoveTo.style.display = 'none'
    for (const div of this._divs) {
      if (div) div.style.display = ''
    }
  }

  private _handleAction(action: MenuAction, targetFolder?: string): void {
    const target = this._ctxTarget
    if (!target) return

    switch (action) {
      case 'delete':
        this.emit('ui:video:delete', { id: target.id, folder: this._ctxFolder ?? undefined })
        break
      case 'archive':
        this.emit('ui:video:archive', { id: target.id })
        break
      case 'pin':
        this.emit('ui:video:pin', { id: target.id })
        break
      case 'blur':
        this.emit('ui:video:blur', { id: target.id })
        break
      case 'open-link':
        this.emit('ui:context-menu:open-link', { id: target.id, type: target.type })
        break
      case 'delete-folder':
        if (this._ctxFolder) this.emit('ui:folder:delete', { name: this._ctxFolder })
        break
      case 'rename-folder':
        if (this._ctxFolder) this.emit('ui:folder:rename-start', { name: this._ctxFolder })
        break
      case 'move-up':
        this.emit('ui:grid:reorder', { id: target.id, direction: 'up', folder: this._ctxFolder ?? '' })
        break
      case 'move-down':
        this.emit('ui:grid:reorder', { id: target.id, direction: 'down', folder: this._ctxFolder ?? '' })
        break
      case 'unassign-folder':
        this.emit('ui:note:move', { id: target.id, folder: null })
        break
      case 'move-to':
        if (targetFolder) {
          this.emit('ui:video:move', { id: target.id, from: this._ctxFolder ?? '', to: targetFolder })
        }
        break
    }
    this.hide()
  }

  private _onShow(payload: ContextMenuState): void {
    this.show(payload)
  }
}
