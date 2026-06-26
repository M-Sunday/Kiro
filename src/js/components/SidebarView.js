import { Component } from './base/Component.js'
import { Api } from '../core/Api.js'

export class SidebarView extends Component {
  constructor() {
    super()
    this.api = Api.getInstance()
    this._exposeGlobals()
  }

  _exposeGlobals() {
    window.renderSidebar = () => this.render()
    window.closeSidebar = () => document.getElementById('sidebar')?.classList.add('closed')
  }

  mount(rootEl) {
    super.mount(rootEl)
    this._bindEvents()
    this.render()
  }

  _bindEvents() {
    let _lastMenuToggle = 0
    this.listenTo(document.getElementById('menuBtn'), 'click', (e) => {
      e.stopPropagation()
      _lastMenuToggle = Date.now()
      document.getElementById('sidebar')?.classList.toggle('closed')
    })
    this.listenTo(document.getElementById('sidebarCloseBtn'), 'click', () => {
      document.getElementById('sidebar')?.classList.add('closed')
    })
    this.listenTo(document.getElementById('sidebarBackdrop'), 'click', () => {
      if (Date.now() - _lastMenuToggle < 400) return
      document.getElementById('sidebar')?.classList.add('closed')
    })
    this.listenTo(document.getElementById('searchInput'), 'input', () => this.render())

    /* Edge swipe to open (left edge) */
    let edgeStartX = 0, edgeStartY = 0, edgeActive = false
    document.addEventListener('touchstart', (e) => {
      const sidebar = document.getElementById('sidebar')
      if (!sidebar?.classList.contains('closed')) { edgeActive = false; return }
      const t = e.touches[0]
      if (t.clientX <= 24) {
        edgeActive = true
        edgeStartX = t.clientX
        edgeStartY = t.clientY
      }
    }, { passive: true })
    document.addEventListener('touchmove', (e) => {
      if (!edgeActive) return
      const t = e.touches[0]
      const dx = t.clientX - edgeStartX
      const dy = Math.abs(t.clientY - edgeStartY)
      if (dy > dx) { edgeActive = false; return }
      if (dx > 30) {
        edgeActive = false
        document.getElementById('sidebar')?.classList.remove('closed')
        _lastMenuToggle = Date.now()
      }
    }, { passive: true })
    document.addEventListener('touchend', () => { edgeActive = false }, { passive: true })
  }

  render() {
    const tree = document.getElementById('sidebarTree')
    if (!tree) return

    const folders = window.getFolders?.() || {}
    const meta = window.getFolderMeta?.() || {}
    const videos = window.getVideos?.() || {}
    const pins = window.getPins?.() || []
    const notes = window.getNotes?.() || []
    const bookmarks = window.getBookmarks?.() || []
    const directAccess = window.getDirectAccess?.() || []
    const externalFiles = window.getExternalFiles?.() || []
    const collapsed = window.getCollapsed?.() || {}
    const query = (document.getElementById('searchInput')?.value || '').toLowerCase().trim()

    let html = ''

    const pages = window.getPages?.() || []
    const pCollapsed = collapsed['section:pages'] === true
    html += '<div class="tree-item ' + (pCollapsed ? '' : 'expanded') + '" data-pages="true"><div class="tree-folder" draggable="false"><i data-lucide="chevron-down" class="tree-chevron"></i><i data-lucide="layout-dashboard" class="tree-folder-icon"></i><span class="tree-label">Pages</span></div><div class="tree-children">'
    for (const p of pages) {
      if (query && !p.title.toLowerCase().includes(query)) continue
      const preview = this._stripHtml((p.blocks || []).map(b => b.content || '').join(' ')).replace(/\n/g, ' ').substring(0, 50)
      html += '<div class="tree-item" data-page-id="' + p.id + '" draggable="true"><div class="tree-file"><div class="bm-thumb-wrap">' + (p.heroImage ? '<img class="bm-thumb" src="' + p.heroImage + '" onerror="this.style.display=\'none\'" loading="lazy">' : '<i data-lucide="layout-dashboard" class="tree-file-icon" style="margin:4px"></i>') + '</div><div class="tree-file-meta"><span class="tree-label">' + (p.title || 'Untitled') + '</span><span class="tree-sublabel">' + preview + (preview.length >= 50 ? '…' : '') + '</span></div><button class="tree-file-btn"><i data-lucide="ellipsis-vertical" style="width:14px;height:14px"></i></button></div></div>'
    }
    html += '</div></div>'

    for (const [name, ids] of Object.entries(folders)) {
      if (name === 'Archived' && !ids.length) continue
      let showAll = query && name.toLowerCase().includes(query)
      if (query && !showAll) {
        let folderHasMatch = ids.some(id => {
          const v = videos[id]
          return v && (v.title.toLowerCase().includes(query) || v.channel.toLowerCase().includes(query))
        })
        if (!folderHasMatch) {
          folderHasMatch = notes.some(n =>
            n.folder === name && (n.title.toLowerCase().includes(query) || (n.content || '').toLowerCase().includes(query))
          )
        }
        if (!folderHasMatch) {
          folderHasMatch = externalFiles.some(f =>
            f.folder === name && f.name.toLowerCase().includes(query)
          )
        }
        if (!folderHasMatch) continue
      }
      const color = meta[name]?.color || ''
      const hasContents = ids.length || notes.filter(n => n.folder === name).length || externalFiles.filter(f => f.folder === name).length
      const icon = name === 'Archived' ? 'archive' : (hasContents ? 'folder-fill' : 'folder')
      const isCollapsed = collapsed['folder:' + name]
      html += '<div class="tree-item ' + (isCollapsed ? '' : 'expanded') + '" data-folder="' + name + '"><div class="tree-folder" draggable="false"' + (color ? ' data-color="' + color + '" style="--folder-color:' + color + '"' : '') + '><i data-lucide="chevron-down" class="tree-chevron"></i><i data-lucide="' + icon + '" class="tree-folder-icon"></i><span class="tree-label">' + name + '</span></div><div class="tree-children">'

      let entryIds = [...ids]
      if (pins.length) {
        const pinned = entryIds.filter(id => pins.includes(id))
        const unpinned = entryIds.filter(id => !pins.includes(id))
        entryIds = [...pinned, ...unpinned]
      }

      for (const id of entryIds) {
        const v = videos[id]
        if (!v) continue
        if (!showAll && query && !v.title.toLowerCase().includes(query) && !v.channel.toLowerCase().includes(query)) continue
        const isPinned = pins.includes(id)
        const isActive = window.currentVideo?.id === id
        const vt = v.thumbnail || `https://img.youtube.com/vi/${id}/hqdefault.jpg`
        html += '<div class="tree-item" data-video-id="' + id + '" draggable="true"><div class="tree-file' + (isActive ? ' active' : '') + (isPinned ? ' pinned' : '') + '"><div class="bm-thumb-wrap"><img class="bm-thumb" src="' + vt + '" onerror="this.style.display=\'none\'" loading="lazy"></div><div class="tree-file-meta"><span class="tree-label">' + this._escapeHtml(v.title) + '</span><span class="tree-sublabel">' + this._escapeHtml(v.channel) + '</span></div><button class="tree-file-btn"><i data-lucide="ellipsis-vertical" style="width:14px;height:14px"></i></button></div></div>'
      }

      for (const n of notes) {
        if (n.folder !== name) continue
        if (!showAll && query && !n.title.toLowerCase().includes(query) && !(n.content || '').toLowerCase().includes(query)) continue
        const preview = this._stripHtml(n.content || '').replace(/\n/g, ' ').substring(0, 50)
        const noteIcon = n.todos && n.todos.length ? 'list-todo' : 'file-text'
        html += '<div class="tree-item" data-note-id="' + n.id + '" draggable="true"><div class="tree-file"><i data-lucide="' + noteIcon + '" class="tree-file-icon"></i><div class="tree-file-meta"><span class="tree-label">' + (n.title || 'Untitled') + '</span><span class="tree-sublabel">' + preview + (this._stripHtml(n.content || '').length > 50 ? 'ÔÇª' : '') + '</span></div><button class="tree-file-btn"><i data-lucide="ellipsis-vertical" style="width:14px;height:14px"></i></button></div></div>'
      }

      for (const f of externalFiles) {
        if (f.folder !== name) continue
        if (!showAll && query && !f.name.toLowerCase().includes(query)) continue
        const nsfw = f.blurred || false
        const isVideo = /\.(mp4|webm|mkv|avi|mov|flv|wmv)$/i.test(f.name)
        const isImage = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(f.name)
        const isText = /\.(txt|md|json|xml|html|css|js|py|java|c|cpp|h|ts)$/i.test(f.name)
        const icon = isVideo ? 'file-video-2' : isImage ? 'image' : isText ? 'file-text' : 'file'
        html += '<div class="tree-item" data-ext-id="' + f.id + '" draggable="true"><div class="tree-file"><div class="bm-thumb-wrap">' + (f.thumbnail ? '<img class="bm-thumb' + (nsfw ? ' nsfw-blur' : '') + '" src="' + f.thumbnail + '" onerror="this.style.display=\'none\'" />' : '<i data-lucide="' + icon + '" class="tree-file-icon" style="margin:4px"></i>') + '</div><div class="tree-file-meta"><span class="tree-label">' + this._escapeHtml(f.name) + '</span><span class="tree-sublabel">' + this._formatSize(f.size) + '</span></div><button class="tree-file-btn"><i data-lucide="ellipsis-vertical" style="width:14px;height:14px"></i></button></div></div>'
      }

      html += '</div></div>'
    }

    if (bookmarks.length) {
      const bmCollapsed = collapsed['section:bookmarks']
      html += '<div class="tree-item ' + (bmCollapsed ? '' : 'expanded') + '" data-bookmarks="true"><div class="tree-folder" draggable="false"><i data-lucide="chevron-down" class="tree-chevron"></i><i data-lucide="bookmark-fill" class="tree-folder-icon"></i><span class="tree-label">Bookmarks</span></div><div class="tree-children">'
      for (const bm of bookmarks) {
        if (query && !bm.title.toLowerCase().includes(query) && !bm.url.toLowerCase().includes(query)) continue
        const bmNsfw = window.isNSFW?.(bm) || bm.blurred
        html += '<div class="tree-item" data-bookmark-id="' + bm.id + '" draggable="true"><div class="tree-file"><div class="bm-thumb-wrap">' + (bm.image ? '<img class="bm-thumb' + (bmNsfw ? ' nsfw-blur' : '') + '" src="' + bm.image + '" onerror="this.style.display=\'none\'" />' : '<i data-lucide="external-link" class="tree-file-icon" style="margin:4px"></i>') + '</div><div class="tree-file-meta"><span class="tree-label">' + (bm.title || bm.url) + '</span><span class="tree-sublabel">' + bm.url + '</span></div><button class="tree-file-btn"><i data-lucide="ellipsis-vertical" style="width:14px;height:14px"></i></button></div></div>'
      }
      html += '</div></div>'
    }

    const unassignedNotes = notes.filter(n => !n.folder)
    if (unassignedNotes.length) {
      const nCollapsed = collapsed['section:notes']
      html += '<div class="tree-item ' + (nCollapsed ? '' : 'expanded') + '" data-notes="true"><div class="tree-folder" draggable="false"><i data-lucide="chevron-down" class="tree-chevron"></i><i data-lucide="file-text-fill" class="tree-folder-icon"></i><span class="tree-label">Notes</span></div><div class="tree-children">'
      for (const n of unassignedNotes) {
        if (query && !n.title.toLowerCase().includes(query) && !(n.content || '').toLowerCase().includes(query)) continue
        const preview = this._stripHtml(n.content || '').replace(/\n/g, ' ').substring(0, 50)
        const noteIcon = n.todos && n.todos.length ? 'list-todo' : 'file-text'
        html += '<div class="tree-item" data-note-id="' + n.id + '" draggable="true"><div class="tree-file"><i data-lucide="' + noteIcon + '" class="tree-file-icon"></i><div class="tree-file-meta"><span class="tree-label">' + (n.title || 'Untitled') + '</span><span class="tree-sublabel">' + preview + (this._stripHtml(n.content || '').length > 50 ? 'ÔÇª' : '') + '</span></div><button class="tree-file-btn"><i data-lucide="ellipsis-vertical" style="width:14px;height:14px"></i></button></div></div>'
      }
      html += '</div></div>'
    }

    if (directAccess.length) {
      const daCollapsed = collapsed['section:directaccess']
      html += '<div class="tree-item ' + (daCollapsed ? '' : 'expanded') + '" data-directaccess="true"><div class="tree-folder" draggable="false"><i data-lucide="chevron-down" class="tree-chevron"></i><i data-lucide="link" class="tree-folder-icon"></i><span class="tree-label">Direct Access</span></div><div class="tree-children">'
      for (const d of directAccess) {
        if (query && !d.title.toLowerCase().includes(query) && !d.url.toLowerCase().includes(query)) continue
        const nsfw = window.isNSFW?.(d) || d.blurred
        html += '<div class="tree-item" data-da-id="' + d.id + '" draggable="true"><div class="tree-file"><div class="bm-thumb-wrap">' + (d.image ? '<img class="bm-thumb' + (nsfw ? ' nsfw-blur' : '') + '" src="' + d.image + '" onerror="this.style.display=\'none\'" />' : '<i data-lucide="external-link" class="tree-file-icon" style="margin:4px"></i>') + '</div><div class="tree-file-meta"><span class="tree-label">' + d.title + '</span><span class="tree-sublabel">' + d.url + '</span></div><button class="tree-file-btn"><i data-lucide="ellipsis-vertical" style="width:14px;height:14px"></i></button></div></div>'
      }
      html += '</div></div>'
    }

    const unassignedExt = externalFiles.filter(f => !f.folder)
    if (unassignedExt.length) {
      const efCollapsed = collapsed['section:externalfiles']
      const extIcon = externalFiles.length ? 'folder-fill' : 'folder'
      html += '<div class="tree-item ' + (efCollapsed ? '' : 'expanded') + '" data-externalfiles="true"><div class="tree-folder" draggable="false"><i data-lucide="chevron-down" class="tree-chevron"></i><i data-lucide="' + extIcon + '" class="tree-folder-icon"></i><span class="tree-label">External Files</span></div><div class="tree-children">'
      for (const f of unassignedExt) {
        if (query && !f.name.toLowerCase().includes(query)) continue
        const nsfw = f.blurred || false
        const isVideo = /\.(mp4|webm|mkv|avi|mov|flv|wmv)$/i.test(f.name)
        const isImage = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(f.name)
        const isText = /\.(txt|md|json|xml|html|css|js|py|java|c|cpp|h|ts)$/i.test(f.name)
        const icon = isVideo ? 'file-video-2' : isImage ? 'image' : isText ? 'file-text' : 'file'
        html += '<div class="tree-item" data-ext-id="' + f.id + '" draggable="true"><div class="tree-file"><div class="bm-thumb-wrap">' + (f.thumbnail ? '<img class="bm-thumb' + (nsfw ? ' nsfw-blur' : '') + '" src="' + f.thumbnail + '" onerror="this.style.display=\'none\'" />' : '<i data-lucide="' + icon + '" class="tree-file-icon" style="margin:4px"></i>') + '</div><div class="tree-file-meta"><span class="tree-label">' + this._escapeHtml(f.name) + '</span><span class="tree-sublabel">' + this._formatSize(f.size) + '</span></div><button class="tree-file-btn"><i data-lucide="ellipsis-vertical" style="width:14px;height:14px"></i></button></div></div>'
      }
      html += '</div></div>'
    }

    tree.innerHTML = html || '<div style="padding:20px;text-align:center;font-size:12px;color:#8e8e93">' + (query ? 'Nothing matches your search.' : 'No videos yet.') + '</div>'
    if (window.loadIcons) window.loadIcons()
    this._bindTreeEvents()

    if (document.getElementById('gridView')?.classList.contains('open')) {
      if (window.renderGridView) window.renderGridView()
    }
  }

  _bindTreeEvents() {
    document.querySelectorAll('.tree-item[data-folder]').forEach(item => {
      item.addEventListener('dragover', (e) => { e.preventDefault(); item.querySelector('.tree-folder')?.classList.add('drop-zone') })
      item.addEventListener('dragleave', () => item.querySelector('.tree-folder')?.classList.remove('drop-zone'))
      item.addEventListener('drop', (e) => {
        e.preventDefault()
        item.querySelector('.tree-folder')?.classList.remove('drop-zone')
        const id = e.dataTransfer.getData('text/plain')
        const type = e.dataTransfer.getData('type')
        if (!id) return
        const folderName = item.dataset.folder
        if (!folderName) return
        if (type === 'video') {
          const folders = window.getFolders?.() || {}
          for (const ids of Object.values(folders)) {
            const idx = ids.indexOf(id)
            if (idx > -1) ids.splice(idx, 1)
          }
          if (!folders[folderName]) folders[folderName] = []
          if (!folders[folderName].includes(id)) folders[folderName].push(id)
          window.saveFolders?.(folders)
          this.render()
          if (window.renderGridView) window.renderGridView()
        } else if (type === 'note') {
          let notes = window.getNotes?.() || []
          const note = notes.find(n => n.id === id)
          if (note) {
            note.folder = folderName
            window.saveNotes?.(notes)
            this.render()
            if (window.renderGridView) window.renderGridView()
          }
        } else if (type === 'ext') {
          let exts = window.getExternalFiles?.() || []
          const f = exts.find(x => x.id === id)
          if (f) {
            f.folder = folderName
            window.saveExternalFiles?.(exts)
            this.render()
            if (window.renderGridView) window.renderGridView()
          }
        }
      })
    })

    document.querySelectorAll('.tree-folder').forEach(f => {
      f.addEventListener('click', (e) => {
        if (e.target.closest('.folder-rename')) return
        const item = f.closest('.tree-item')
        if (!item) return
        const collapsed = window.getCollapsed?.() || {}
        const folder = item.dataset.folder
        const bm = item.dataset.bookmarks
        const nt = item.dataset.notes
        const da = item.dataset.directaccess
        const ef = item.dataset.externalfiles
        const pg = item.dataset.pages
        const key = folder ? 'folder:' + folder : bm ? 'section:bookmarks' : nt ? 'section:notes' : da ? 'section:directaccess' : ef ? 'section:externalfiles' : pg ? 'section:pages' : null
        if (key) {
          collapsed[key] = item.classList.contains('expanded')
          window.saveCollapsed?.(collapsed)
        }
        item.classList.toggle('expanded')
      })
    })

    document.querySelectorAll('.tree-file').forEach(file => {
      file.addEventListener('click', () => {
        const id = file.closest('[data-video-id]')?.dataset.videoId
        if (id && id !== 'placeholder') {
          const v = (window.getVideos?.() || {})[id]
          if (v) {
            if (window.loadVideoById) window.loadVideoById(id)
            if (window.showCardView) window.showCardView()
            window.closeSidebar?.()
          }
        }
        const bm = file.closest('[data-bookmark-id]')
        if (bm) {
          const bms = (window.getBookmarks?.() || []).filter(b => b.id === bm.dataset.bookmarkId)
          if (bms[0]?.url) { window.open(bms[0].url); window.closeSidebar?.() }
        }
        const note = file.closest('[data-note-id]')
        if (note) {
          if (window.openNote) window.openNote(note.dataset.noteId)
          window.closeSidebar?.()
        }
        const da = file.closest('[data-da-id]')
        if (da) {
          const das = (window.getDirectAccess?.() || []).filter(d => d.id === da.dataset.daId)
          if (das[0]?.url) { window.open(das[0].url); window.closeSidebar?.() }
        }
        const pg = file.closest('[data-page-id]')
        if (pg) {
          if (window.openPage) window.openPage(pg.dataset.pageId)
          window.closeSidebar?.()
        }
        const ext = file.closest('[data-ext-id]')
        if (ext) {
          const extId = ext.dataset.extId
          if (window.openExternalText || window.openExternalVideo) {
            const files = window.getExternalFiles?.() || []
            const f = files.find(x => x.id === extId)
            if (f) {
              const isVideo = /\.(mp4|webm|mkv|avi|mov|flv|wmv)$/i.test(f.name)
              const isText = /\.(txt|md|json|xml|html|css|js|py|java|c|cpp|h|ts)$/i.test(f.name)
              const isImage = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(f.name)
              if (isText && window.openExternalText) window.openExternalText(f)
              else if (isVideo && window.openExternalVideo) window.openExternalVideo(f)
              else if (isImage && window.openExternalImage) window.openExternalImage(f)
              else if (f.path) {
                const isElectron = typeof process !== 'undefined' && process.versions?.electron
                if (isElectron) window.require('electron').shell.openPath(f.path)
                else window.open(f.path)
              }
            }
          }
          window.closeSidebar?.()
        }
      })
    })

    document.querySelectorAll('.tree-item[draggable]').forEach(el => {
      el.addEventListener('dragstart', (e) => {
        const vid = el.dataset.videoId
        const bm = el.dataset.bookmarkId
        const nt = el.dataset.noteId
        const da = el.dataset.daId
        const ext = el.dataset.extId
        window.dragVideoId = vid || null
        e.dataTransfer.setData('text/plain', vid || bm || nt || da || ext || '')
        e.dataTransfer.setData('type', vid ? 'video' : bm ? 'bookmark' : nt ? 'note' : da ? 'da' : ext ? 'ext' : '')
        e.dataTransfer.effectAllowed = 'move'
      })
    })

    document.querySelectorAll('.tree-item[data-bookmark-id], .tree-item[data-note-id], .tree-item[data-da-id], .tree-item[data-ext-id], .tree-item[data-video-id]').forEach(el => {
      el.addEventListener('dragover', (e) => { e.preventDefault(); el.querySelector('.tree-file')?.classList.add('drop-zone') })
      el.addEventListener('dragleave', () => el.querySelector('.tree-file')?.classList.remove('drop-zone'))
      el.addEventListener('drop', (e) => {
        e.preventDefault()
        el.querySelector('.tree-file')?.classList.remove('drop-zone')
        const draggedId = e.dataTransfer.getData('text/plain')
        const draggedType = e.dataTransfer.getData('type')
        if (!draggedId) return
        const targetId = el.dataset.bookmarkId || el.dataset.noteId || el.dataset.daId || el.dataset.extId || el.dataset.videoId
        const targetType = el.dataset.bookmarkId ? 'bookmark' : el.dataset.noteId ? 'note' : el.dataset.daId ? 'da' : el.dataset.extId ? 'ext' : 'video'
        if (draggedType !== targetType || draggedId === targetId) return
        if (targetType === 'bookmark') {
          let bms = window.getBookmarks?.() || []
          const from = bms.findIndex(b => b.id === draggedId)
          const to = bms.findIndex(b => b.id === targetId)
          if (from > -1 && to > -1) { const [item] = bms.splice(from, 1); bms.splice(to, 0, item); window.saveBookmarks?.(bms); this.render() }
        } else if (targetType === 'note') {
          let notes = window.getNotes?.() || []
          const from = notes.findIndex(n => n.id === draggedId)
          const to = notes.findIndex(n => n.id === targetId)
          if (from > -1 && to > -1) { const [item] = notes.splice(from, 1); notes.splice(to, 0, item); window.saveNotes?.(notes); this.render() }
        } else if (targetType === 'da') {
          let das = window.getDirectAccess?.() || []
          const from = das.findIndex(d => d.id === draggedId)
          const to = das.findIndex(d => d.id === targetId)
          if (from > -1 && to > -1) { const [item] = das.splice(from, 1); das.splice(to, 0, item); window.saveDirectAccess?.(das); this.render() }
        } else if (targetType === 'ext') {
          let exts = window.getExternalFiles?.() || []
          const from = exts.findIndex(x => x.id === draggedId)
          const to = exts.findIndex(x => x.id === targetId)
          if (from > -1 && to > -1) { const [item] = exts.splice(from, 1); exts.splice(to, 0, item); window.saveExternalFiles?.(exts); this.render(); if (window.renderGridView) window.renderGridView() }
        } else if (targetType === 'video') {
          const folderEl = el.closest('[data-folder]')
          const folderName = folderEl?.dataset.folder
          if (!folderName) return
          const folders = window.getFolders?.() || {}
          const ids = folders[folderName]
          if (!ids) return
          const from = ids.indexOf(draggedId)
          const to = ids.indexOf(targetId)
          if (from > -1 && to > -1) { const [item] = ids.splice(from, 1); ids.splice(to, 0, item); window.saveFolders?.(folders); this.render(); if (window.renderGridView) window.renderGridView() }
        }
      })
    })

    document.querySelectorAll('.tree-file').forEach(file => {
      file.addEventListener('contextmenu', (e) => {
        e.preventDefault()
        const entry = file.closest('[data-video-id]'), folder = file.closest('[data-folder]'), bm = file.closest('[data-bookmark-id]'), note = file.closest('[data-note-id]'), da = file.closest('[data-da-id]'), ext = file.closest('[data-ext-id]')
        if (window.showContextMenu) {
          if (ext) window.showContextMenu(e.clientX, e.clientY, null, null, null, null, null, ext.dataset.extId)
          else if (da) window.showContextMenu(e.clientX, e.clientY, null, null, null, null, da.dataset.daId)
          else if (bm) window.showContextMenu(e.clientX, e.clientY, null, null, bm.dataset.bookmarkId)
          else if (note) window.showContextMenu(e.clientX, e.clientY, null, null, null, note.dataset.noteId)
          else if (entry) window.showContextMenu(e.clientX, e.clientY, entry?.dataset.videoId, folder?.dataset.folder)
        }
      })
    })

    document.querySelectorAll('.tree-folder').forEach(folder => {
      folder.addEventListener('contextmenu', (e) => {
        e.preventDefault()
        const item = folder.closest('[data-folder]')
        if (window.showContextMenu && item && item.dataset.folder !== 'Videos' && item.dataset.folder !== 'Archived') {
          window.showContextMenu(e.clientX, e.clientY, null, item.dataset.folder)
        }
      })
    })

    document.querySelectorAll('.tree-file-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        const file = btn.closest('.tree-file')
        const entry = file?.closest('[data-video-id]'), folder = file?.closest('[data-folder]'), bm = file?.closest('[data-bookmark-id]'), note = file?.closest('[data-note-id]'), da = file?.closest('[data-da-id]'), ext = file?.closest('[data-ext-id]')
        const rect = btn.getBoundingClientRect()
        const x = rect.right, y = rect.bottom
        if (window.showContextMenu) {
          if (ext) window.showContextMenu(x, y, null, null, null, null, null, ext.dataset.extId)
          else if (da) window.showContextMenu(x, y, null, null, null, null, da.dataset.daId)
          else if (bm) window.showContextMenu(x, y, null, null, bm.dataset.bookmarkId)
          else if (note) window.showContextMenu(x, y, null, null, null, note.dataset.noteId)
          else if (entry) window.showContextMenu(x, y, entry.dataset.videoId, folder?.dataset.folder)
        }
      })
    })

    document.querySelectorAll('.tree-folder, .tree-file').forEach(el => {
      let longTimer = null, longPressed = false
      el.addEventListener('touchstart', (e) => {
        if (el.closest('.folder-rename')) return
        if (document.getElementById('ctxMenu')?.classList.contains('open')) return
        longPressed = false
        longTimer = setTimeout(() => {
          longPressed = true
          const touch = e.touches[0]
          const item = el.closest('[data-folder]'), video = el.closest('[data-video-id]'), bm = el.closest('[data-bookmark-id]'), note = el.closest('[data-note-id]'), da = el.closest('[data-da-id]'), ext = el.closest('[data-ext-id]')
          if (window.showContextMenu) {
            if (ext) window.showContextMenu(touch.clientX, touch.clientY, null, null, null, null, null, ext.dataset.extId)
            else if (da) window.showContextMenu(touch.clientX, touch.clientY, null, null, null, null, da.dataset.daId)
            else if (video) window.showContextMenu(touch.clientX, touch.clientY, video.dataset.videoId, item?.dataset.folder || null)
            else if (bm) window.showContextMenu(touch.clientX, touch.clientY, null, null, bm.dataset.bookmarkId)
            else if (note) window.showContextMenu(touch.clientX, touch.clientY, null, null, null, note.dataset.noteId)
            else if (item && item.dataset.folder !== 'Videos' && item.dataset.folder !== 'Archived') window.showContextMenu(touch.clientX, touch.clientY, null, item.dataset.folder)
          }
        }, 500)
      }, { passive: true })
      el.addEventListener('touchmove', () => { clearTimeout(longTimer) }, { passive: true })
      el.addEventListener('touchend', () => { clearTimeout(longTimer) })
      el.addEventListener('touchcancel', () => { clearTimeout(longTimer) })
      el.addEventListener('click', (e) => { if (longPressed) { e.preventDefault(); e.stopPropagation(); longPressed = false } })
    })
  }

  _formatSize(bytes) {
    if (!bytes || bytes === 0) return ''
    const units = ['B', 'KB', 'MB', 'GB']
    let i = 0
    let size = bytes
    while (size >= 1024 && i < units.length - 1) { size /= 1024; i++ }
    return (i === 0 ? size : size.toFixed(1)) + ' ' + units[i]
  }

  _escapeHtml(str) {
    if (typeof str !== 'string') return ''
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
    return str.replace(/[&<>"']/g, ch => map[ch])
  }

  _stripHtml(str) {
    return str.replace(/<[^>]*>/g, '')
  }
}

