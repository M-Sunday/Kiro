import { Component } from './base/Component.js'
import { Api } from '../core/Api.js'

export class ContextMenu extends Component {
  constructor() {
    super()
    this.api = Api.getInstance()
    this._ctxTarget = null
    this._ctxFolder = null
    this._ctxBookmark = null
    this._ctxNote = null
    this._ctxDA = null
    this._ctxExt = null
    this._exposeGlobals()
  }

  _exposeGlobals() {
    window.showContextMenu = (x, y, videoId, folderName, bookmarkId, noteId, daId, extId) =>
      this.show(x, y, videoId, folderName, bookmarkId, noteId, daId, extId)
  }

  mount(rootEl) {
    super.mount(rootEl)
    this._createBackdrop()
    this._bindEvents()
  }

  _createBackdrop() {
    if (document.getElementById('ctxBackdrop')) return
    const bd = document.createElement('div')
    bd.id = 'ctxBackdrop'
    bd.style.cssText = 'position:fixed;inset:0;z-index:199;display:none;background:rgba(0,0,0,0.001)'
    bd.addEventListener('click', () => this._close())
    bd.addEventListener('touchstart', (e) => { e.preventDefault(); this._close() }, { passive: false })
    document.body.appendChild(bd)
    this._backdrop = bd
  }

  _close() {
    const menu = document.getElementById('ctxMenu')
    if (menu) menu.classList.remove('open')
    if (this._backdrop) this._backdrop.style.display = 'none'
  }

  _bindEvents() {
    this._ctxMoveToFolder = ''
    this.listenTo(document.getElementById('ctxMenu'), 'click', (e) => {
      const item = e.target.closest('.ctx-item')
      if (!item) return
      if (item.dataset.action === 'move-to') this._ctxMoveToFolder = item.dataset.folder || ''
      e.stopPropagation()
      this._handleAction(item.dataset.action)
      this._close()
    })

    this.bus.on('ui:context-menu:show', (e) => {
      this.show(e.x, e.y, e.videoId, null, e.bookmarkId, e.noteId, e.daId, e.extId)
    })
  }

  show(x, y, videoId, folderName, bookmarkId, noteId, daId, extId) {
    const menu = document.getElementById('ctxMenu')
    if (!menu) return

    document.querySelectorAll('.grid-item.dragging').forEach(el => el.classList.remove('dragging'))
    document.querySelectorAll('.grid-item.drag-before, .grid-item.drag-after').forEach(el => el.classList.remove('drag-before', 'drag-after'))
    this._ctxTarget = videoId
    this._ctxFolder = folderName
    this._ctxBookmark = bookmarkId
    this._ctxNote = noteId
    this._ctxDA = daId
    this._ctxExt = extId

    const isTouch = 'ontouchstart' in window
    menu.style.left = (isTouch ? x - 40 : x) + 'px'
    menu.style.top = (isTouch ? y - 40 : y) + 'px'
    menu.classList.add('open')
    if (this._backdrop) this._backdrop.style.display = 'block'

    const mw = menu.offsetWidth, mh = menu.offsetHeight
    const pad = 8
    let left = parseInt(menu.style.left), top = parseInt(menu.style.top)
    if (left + mw > window.innerWidth - pad) left = window.innerWidth - mw - pad
    if (top + mh > window.innerHeight - pad) top = window.innerHeight - mh - pad
    if (left < pad) left = pad
    if (top < pad) top = pad
    menu.style.left = left + 'px'
    menu.style.top = top + 'px'

    const isExt = extId != null
    const isBm = bookmarkId != null
    const isNote = noteId != null
    const isDA = daId != null
    const showVideo = videoId != null
    const renameEl = menu.querySelector('[data-action="rename-folder"]')
    renameEl.style.display = (showVideo || isBm || isNote || isDA || isExt || folderName) ? '' : 'none'
    if (folderName) renameEl.innerHTML = '<i data-lucide="edit-3" class="ctx-icon"></i> Rename folder'
    else if (showVideo) renameEl.innerHTML = '<i data-lucide="edit-3" class="ctx-icon"></i> Rename video'
    else if (isNote) renameEl.innerHTML = '<i data-lucide="edit-3" class="ctx-icon"></i> Rename note'
    else if (isBm) renameEl.innerHTML = '<i data-lucide="edit-3" class="ctx-icon"></i> Rename bookmark'
    else if (isDA) renameEl.innerHTML = '<i data-lucide="edit-3" class="ctx-icon"></i> Rename direct access'
    else if (isExt) renameEl.innerHTML = '<i data-lucide="edit-3" class="ctx-icon"></i> Rename file'

    menu.querySelector('[data-action="delete-folder"]').style.display = videoId ? 'none' : (isBm || isNote || isDA || isExt) ? 'none' : ''
    menu.querySelector('[data-action="open-link"]').style.display = (showVideo || isBm || isDA) ? '' : 'none'
    menu.querySelector('[data-action="archive"]').style.display = showVideo ? '' : 'none'
    menu.querySelector('[data-action="open-file-location"]').style.display = isExt ? '' : 'none'

    menu.querySelector('[data-action="blur"]').style.display = showVideo || isBm || isDA || isExt ? '' : 'none'
    {
      let manualBlurred = false
      let isAutoBlurred = false
      if (showVideo) { const v = window.getVideos?.()?.[videoId]; manualBlurred = !!v?.blurred; isAutoBlurred = window.getBlurAllNSFW?.() && !manualBlurred && v && window.isNSFW?.(v) }
      else if (isBm) { const b = window.getBookmarks?.()?.filter(x => x.id === bookmarkId)[0]; manualBlurred = !!b?.blurred; isAutoBlurred = window.getBlurAllNSFW?.() && !manualBlurred && b && window.isNSFW?.(b) }
      else if (isDA) { const d = window.getDirectAccess?.()?.filter(x => x.id === daId)[0]; manualBlurred = !!d?.blurred; isAutoBlurred = window.getBlurAllNSFW?.() && !manualBlurred && d && window.isNSFW?.(d) }
      else if (isExt) { const f = window.getExternalFiles?.()?.filter(x => x.id === extId)[0]; manualBlurred = !!f?.blurred; isAutoBlurred = false }
      const blurEl = menu.querySelector('[data-action="blur"]')
      blurEl.innerHTML = `<i data-lucide="${manualBlurred ? 'eye-off' : 'eye'}" class="ctx-icon"></i> ${manualBlurred ? 'Unblur' : 'Blur'}`
      if (isAutoBlurred) blurEl.classList.add('disabled'); else blurEl.classList.remove('disabled')
    }

    menu.querySelector('[data-action="pin"]').style.display = showVideo ? '' : 'none'
    menu.querySelector('[data-action="mark-stale"]').style.display = showVideo ? '' : 'none'
    if (showVideo) {
      const v = window.getVideos?.()?.[videoId]
      const staleEl = menu.querySelector('[data-action="mark-stale"]')
      if (v && v._stale) {
        staleEl.innerHTML = '<i data-lucide="refresh-cw" class="ctx-icon"></i> Mark as found'
      } else {
        staleEl.innerHTML = '<i data-lucide="alert-circle" class="ctx-icon"></i> Mark not found'
      }
    }
    menu.querySelector('[data-action="move-up"]').style.display = (showVideo || isBm || isNote || isDA || isExt) ? '' : 'none'
    menu.querySelector('[data-action="move-down"]').style.display = (showVideo || isBm || isNote || isDA || isExt) ? '' : 'none'
    menu.querySelector('[data-action="delete"]').style.display = (showVideo || isBm || isNote || isDA || isExt) ? '' : 'none'

    const delItem = menu.querySelector('[data-action="delete"]')
    delItem.innerHTML = `<i data-lucide="trash-2" class="ctx-icon"></i> ${isNote ? 'Delete note' : isBm ? 'Delete bookmark' : isDA ? 'Delete direct access' : isExt ? 'Delete file' : 'Delete'}`
    delItem.className = 'ctx-item ctx-danger'

    document.getElementById('ctxDiv1').style.display = (showVideo || isBm || isDA) ? '' : 'none'
    document.getElementById('ctxDiv2').style.display = showVideo ? '' : 'none'
    document.getElementById('ctxDiv3').style.display = (showVideo || isNote || isExt) ? '' : 'none'

    const moveToEl = document.getElementById('ctxMoveTo')
    moveToEl.classList.remove('show')
    document.getElementById('ctxDiv4').style.display = 'none'

    if (videoId || isNote || isExt) {
      const pinItem = menu.querySelector('[data-action="pin"]')
      if (videoId) {
        const isPinned = (window.getPins?.() || []).includes(videoId)
        pinItem.innerHTML = `<i data-lucide="${isPinned ? 'pin-off' : 'pin'}" class="ctx-icon"></i> ${isPinned ? 'Unpin' : 'Pin'}`
      }
      const folders = window.getFolders?.() || {}
      const currentFolder = isNote ? (window.getNotes?.()?.filter(n => n.id === noteId)[0]?.folder || null) : isExt ? (window.getExternalFiles?.()?.filter(f => f.id === extId)[0]?.folder || null) : folderName
      const folderEntries = Object.keys(folders).filter(n => n !== currentFolder && n !== 'Archived')
      const moveDiv4 = document.getElementById('ctxDiv4')
      if (folderEntries.length) {
        let mHtml = ''
        if ((isNote || isExt) && currentFolder) {
          mHtml += `<div class="ctx-item" data-action="unassign-folder"><i data-lucide="x" class="ctx-icon"></i> Remove from folder</div><div class="ctx-divider" style="margin:4px 8px"></div>`
        }
        for (const name of folderEntries) {
          const color = (window.getFolderMeta?.()?.[name]?.color || '')
          const f = window.getFolders?.() || {}
          const hasContents = (f[name] || []).length || (window.getNotes?.()?.filter(n2 => n2.folder === name).length || 0) || (window.getExternalFiles?.()?.filter(x => x.folder === name).length || 0)
          mHtml += `<div class="ctx-item" data-action="move-to" data-folder="${name}"><i data-lucide="${hasContents ? 'folder-fill' : 'folder'}" class="ctx-icon"${color ? ` style="color:${color}"` : ''}></i> Move to ${name}</div>`
        }
        moveToEl.innerHTML = mHtml
        moveToEl.classList.add('show')
        moveDiv4.style.display = ''
      } else {
        moveToEl.classList.remove('show')
        moveDiv4.style.display = 'none'
      }
    } else {
      document.getElementById('ctxDiv3').style.display = 'none'
      moveToEl.classList.remove('show')
      document.getElementById('ctxDiv4').style.display = 'none'
    }

    this._loadIcons()
  }

  _loadIcons() {
    if (window.loadIcons) window.loadIcons()
  }

  _handleAction(a) {
    if (a === 'delete' && this._ctxTarget) {
      const fs = window.getFolders?.() || {}
      for (const ids of Object.values(fs)) { const i = ids.indexOf(this._ctxTarget); if (i > -1) ids.splice(i, 1) }
      window.saveFolders?.(fs)
      const vs = window.getVideos?.() || {}
      delete vs[this._ctxTarget]
      window.saveVideos?.(vs)
      window.renderSidebar?.()
      if (window.currentVideo?.id === this._ctxTarget) {
        window.currentVideo = null
        if (window.clearCard) window.clearCard()
      }
    }
    if (a === 'delete' && this._ctxBookmark && !this._ctxTarget) {
      const bms = (window.getBookmarks?.() || []).filter(b => b.id !== this._ctxBookmark)
      window.saveBookmarks?.(bms)
      window.renderSidebar?.()
    }
    if (a === 'delete' && this._ctxNote && !this._ctxTarget && !this._ctxBookmark) {
      const ns = (window.getNotes?.() || []).filter(n => n.id !== this._ctxNote)
      window.saveNotes?.(ns)
      window.renderSidebar?.()
      if (window.currentNoteId === this._ctxNote) {
        window.currentNoteId = null
        if (window.closeNoteView) window.closeNoteView()
      }
    }
    if (a === 'delete' && this._ctxDA && !this._ctxTarget && !this._ctxBookmark && !this._ctxNote) {
      const das = (window.getDirectAccess?.() || []).filter(d => d.id !== this._ctxDA)
      window.saveDirectAccess?.(das)
      window.renderSidebar?.()
    }
    if (a === 'delete' && this._ctxExt && !this._ctxTarget && !this._ctxBookmark && !this._ctxNote && !this._ctxDA) {
      const files = (window.getExternalFiles?.() || []).filter(f => f.id !== this._ctxExt)
      window.saveExternalFiles?.(files)
      this.state.setState('externalFiles', files)
      window.renderSidebar?.()
      window.renderGridView?.()
    }
    if (a === 'archive' && this._ctxTarget) {
      const fs = window.getFolders?.() || {}
      for (const ids of Object.values(fs)) { const i = ids.indexOf(this._ctxTarget); if (i > -1) ids.splice(i, 1) }
      if (!fs['Archived']) fs['Archived'] = []
      fs['Archived'].push(this._ctxTarget)
      window.saveFolders?.(fs)
      window.renderSidebar?.()
    }
    if (a === 'pin') {
      const pins = window.getPins?.() || []
      const idx = pins.indexOf(this._ctxTarget)
      if (idx > -1) pins.splice(idx, 1); else pins.push(this._ctxTarget)
      window.savePins?.(pins)
      window.renderSidebar?.()
      if (window.currentVideo?.id === this._ctxTarget && window.updatePinBadge) window.updatePinBadge(this._ctxTarget)
    }
    if (a === 'blur') {
      const item = document.querySelector(`.ctx-item[data-action="blur"]`)
      if (item?.classList.contains('disabled')) return
      if (this._ctxTarget) {
        const vs = window.getVideos?.() || {}
        const v = vs[this._ctxTarget]
        if (v) { v.blurred = !v.blurred; window.saveVideos?.(vs); window.renderSidebar?.(); if (window.currentVideo?.id === this._ctxTarget && window.loadVideoById) window.loadVideoById(this._ctxTarget) }
      } else if (this._ctxBookmark) {
        const bms = window.getBookmarks?.() || []
        const b = bms.filter(x => x.id === this._ctxBookmark)[0]
        if (b) { b.blurred = !b.blurred; window.saveBookmarks?.(bms); window.renderSidebar?.() }
      } else if (this._ctxDA) {
        const das = window.getDirectAccess?.() || []
        const d = das.filter(x => x.id === this._ctxDA)[0]
        if (d) { d.blurred = !d.blurred; window.saveDirectAccess?.(das); window.renderSidebar?.() }
      } else if (this._ctxExt) {
        const files = window.getExternalFiles?.() || []
        const f = files.filter(x => x.id === this._ctxExt)[0]
        if (f) { f.blurred = !f.blurred; window.saveExternalFiles?.(files); this.state.setState('externalFiles', files); window.renderSidebar?.(); window.renderGridView?.() }
      }
    }
    if (a === 'mark-stale' && this._ctxTarget) {
      const vs = window.getVideos?.() || {}
      const v = vs[this._ctxTarget]
      if (v) { v._stale = !v._stale; window.saveVideos?.(vs); window.renderGridView?.(); window.renderSidebar?.() }
    }
    if (a === 'rename-folder') {
      this._handleRename()
    }
    if (a === 'delete-folder' && this._ctxFolder) {
      const fs = window.getFolders?.() || {}
      const meta = window.getFolderMeta?.() || {}
      if (!fs['Videos']) fs['Videos'] = []
      for (const id of (fs[this._ctxFolder] || [])) { if (!fs['Videos'].includes(id)) fs['Videos'].push(id) }
      delete fs[this._ctxFolder]
      delete meta[this._ctxFolder]
      window.saveFolders?.(fs)
      window.saveFolderMeta?.(meta)
      window.renderSidebar?.()
    }
    if (a === 'open-link' && this._ctxTarget) {
      const v = (window.getVideos?.() || {})[this._ctxTarget]
      if (v?.url) window.open(v.url)
    }
    if (a === 'open-link' && this._ctxBookmark && !this._ctxTarget && !this._ctxDA) {
      const bm = (window.getBookmarks?.() || []).filter(b => b.id === this._ctxBookmark)[0]
      if (bm?.url) window.open(bm.url)
    }
    if (a === 'open-link' && this._ctxDA && !this._ctxTarget && !this._ctxBookmark) {
      const da = (window.getDirectAccess?.() || []).filter(d => d.id === this._ctxDA)[0]
      if (da?.url) window.open(da.url)
    }
    if (a === 'open-file-location' && this._ctxExt) {
      const files = window.getExternalFiles?.() || []
      const f = files.filter(x => x.id === this._ctxExt)[0]
      if (f?.path) {
        const isElectron = typeof process !== 'undefined' && process.versions?.electron
        if (isElectron) {
          window.require('electron').shell.showItemInFolder(f.path)
        }
      }
    }
    if (a === 'move-up' || a === 'move-down') {
      const dir = a === 'move-up' ? -1 : 1
      if (this._ctxTarget) {
        const fs = window.getFolders?.() || {}
        for (const ids of Object.values(fs)) {
          const idx = ids.indexOf(this._ctxTarget)
          if (idx > -1) {
            const swap = idx + dir
            if (swap >= 0 && swap < ids.length) {
              [ids[idx], ids[swap]] = [ids[swap], ids[idx]]
              window.saveFolders?.(fs); window.renderSidebar?.()
            }
            break
          }
        }
      } else if (this._ctxBookmark) {
        const bms = window.getBookmarks?.() || []
        const idx = bms.findIndex(x => x.id === this._ctxBookmark)
        const swap = idx + dir
        if (swap >= 0 && swap < bms.length) {
          [bms[idx], bms[swap]] = [bms[swap], bms[idx]]
          window.saveBookmarks?.(bms); window.renderSidebar?.()
        }
      } else if (this._ctxNote) {
        const notes = window.getNotes?.() || []
        const idx = notes.findIndex(x => x.id === this._ctxNote)
        const swap = idx + dir
        if (swap >= 0 && swap < notes.length) {
          [notes[idx], notes[swap]] = [notes[swap], notes[idx]]
          window.saveNotes?.(notes); window.renderSidebar?.()
        }
      } else if (this._ctxDA) {
        const das = window.getDirectAccess?.() || []
        const idx = das.findIndex(x => x.id === this._ctxDA)
        const swap = idx + dir
        if (swap >= 0 && swap < das.length) {
          [das[idx], das[swap]] = [das[swap], das[idx]]
          window.saveDirectAccess?.(das); window.renderSidebar?.()
        }
      } else if (this._ctxExt) {
        const files = window.getExternalFiles?.() || []
        const idx = files.findIndex(x => x.id === this._ctxExt)
        const swap = idx + dir
        if (swap >= 0 && swap < files.length) {
          [files[idx], files[swap]] = [files[swap], files[idx]]
          window.saveExternalFiles?.(files)
          this.state.setState('externalFiles', files)
          window.renderSidebar?.()
          window.renderGridView?.()
        }
      }
    }
    if (a === 'move-to' && this._ctxTarget) {
      const target = this._ctxMoveToFolder
      if (!target) return
      const fs = window.getFolders?.() || {}
      if (!fs[target]) fs[target] = []
      if (!fs[target].includes(this._ctxTarget)) fs[target].push(this._ctxTarget)
      window.saveFolders?.(fs)
      window.renderSidebar?.()
    }
    if (a === 'move-to' && this._ctxNote && !this._ctxTarget) {
      const target = this._ctxMoveToFolder
      if (!target) return
      const notes = window.getNotes?.() || []
      const n = notes.filter(x => x.id === this._ctxNote)[0]
      if (n) { n.folder = target; window.saveNotes?.(notes); window.renderSidebar?.() }
    }
    if (a === 'unassign-folder' && this._ctxNote) {
      const notes = window.getNotes?.() || []
      const n = notes.filter(x => x.id === this._ctxNote)[0]
      if (n) { delete n.folder; window.saveNotes?.(notes); window.renderSidebar?.() }
    }
    if (a === 'move-to' && this._ctxExt && !this._ctxTarget && !this._ctxNote) {
      const target = this._ctxMoveToFolder
      if (!target) return
      const files = window.getExternalFiles?.() || []
      const f = files.filter(x => x.id === this._ctxExt)[0]
      if (f) { f.folder = target; window.saveExternalFiles?.(files); this.state.setState('externalFiles', files); window.renderSidebar?.(); window.renderGridView?.() }
    }
    if (a === 'unassign-folder' && this._ctxExt) {
      const files = window.getExternalFiles?.() || []
      const f = files.filter(x => x.id === this._ctxExt)[0]
      if (f) { delete f.folder; window.saveExternalFiles?.(files); this.state.setState('externalFiles', files); window.renderSidebar?.(); window.renderGridView?.() }
    }
  }

  _handleRename() {
    let selector
    if (this._ctxFolder) selector = `[data-folder="${this._ctxFolder}"] .tree-label`
    else if (this._ctxTarget) selector = `[data-video-id="${this._ctxTarget}"] .tree-label`
    else if (this._ctxNote) selector = `[data-note-id="${this._ctxNote}"] .tree-label`
    else if (this._ctxBookmark) selector = `[data-bookmark-id="${this._ctxBookmark}"] .tree-label`
    else if (this._ctxDA) selector = `[data-da-id="${this._ctxDA}"] .tree-label`
    else if (this._ctxExt) selector = `[data-ext-id="${this._ctxExt}"] .grid-item-title, [data-ext-id="${this._ctxExt}"] .tree-label`
    if (!selector) return

    const label = document.querySelector(selector)
    if (!label) return
    const old = label.textContent
    const input = document.createElement('input')
    input.className = 'folder-rename'
    input.value = old
    input.autofocus = true
    label.replaceWith(input)
    input.focus()
    input.select()

    const done = () => {
      const name = input.value.trim() || old
      if (name === old) { window.renderSidebar?.(); return }
      if (this._ctxFolder) {
        const fs = window.getFolders?.() || {}
        const meta = window.getFolderMeta?.() || {}
        fs[name] = fs[old]
        meta[name] = meta[old] || {}
        delete fs[old]
        delete meta[old]
        window.saveFolders?.(fs)
        window.saveFolderMeta?.(meta)
      } else if (this._ctxTarget) {
        const vs = window.getVideos?.() || {}
        const v = vs[this._ctxTarget]
        if (v) { v.title = name; window.saveVideos?.(vs) }
        if (window.currentVideo?.id === this._ctxTarget) {
          const titleEl = document.getElementById('videoTitle')
          if (titleEl) titleEl.textContent = name
        }
      } else if (this._ctxNote) {
        const notes = window.getNotes?.() || []
        const n = notes.filter(x => x.id === this._ctxNote)[0]
        if (n) { n.title = name; window.saveNotes?.(notes) }
        if (window.currentNoteId === this._ctxNote) {
          const titleEl = document.getElementById('noteViewTitle')
          if (titleEl) titleEl.value = name
        }
      } else if (this._ctxBookmark) {
        const bms = window.getBookmarks?.() || []
        const b = bms.filter(x => x.id === this._ctxBookmark)[0]
        if (b) { b.title = name; window.saveBookmarks?.(bms) }
      } else if (this._ctxDA) {
        const das = window.getDirectAccess?.() || []
        const d = das.filter(x => x.id === this._ctxDA)[0]
        if (d) { d.title = name; window.saveDirectAccess?.(das) }
      } else if (this._ctxExt) {
        const files = window.getExternalFiles?.() || []
        const f = files.filter(x => x.id === this._ctxExt)[0]
        if (f) { f.name = name; window.saveExternalFiles?.(files); this.state.setState('externalFiles', files); window.renderGridView?.() }
      }
      window.renderSidebar?.()
    }
    input.addEventListener('blur', done)
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') input.blur()
      if (e.key === 'Escape') { input.value = old; input.blur() }
    })
  }
}
