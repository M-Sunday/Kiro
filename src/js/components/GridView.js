import { Component } from './base/Component.js'
import { Api } from '../core/Api.js'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

const SVG = {
  play: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"/></svg>',
  pause: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="14" y="3" width="5" height="18" rx="1"/><rect x="5" y="3" width="5" height="18" rx="1"/></svg>',
  'volume-2': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>',
  'volume-1': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>',
  'volume-x': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>',
  'picture-in-picture-2': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 9V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10c0 1.1.9 2 2 2h4"/><rect width="10" height="7" x="12" y="13" rx="2"/></svg>',
  'picture-in-picture': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 10V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/><path d="M10 10v5a1 1 0 0 0 1 1h5"/><rect x="2" y="10" width="6" height="7" rx="1"/></svg>',
  'maximize': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/></svg>',
  'skip-back': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.971 4.285A2 2 0 0 1 21 6v12a2 2 0 0 1-3.029 1.715l-9.997-5.998a2 2 0 0 1-.003-3.432z"/><path d="M3 20V4"/></svg>',
  'skip-forward': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 4v16"/><path d="M6.029 4.285A2 2 0 0 0 3 6v12a2 2 0 0 0 3.029 1.715l9.997-5.998a2 2 0 0 0 .003-3.432z"/></svg>',
}

export class GridView extends Component {
  constructor() {
    super()
    this.api = Api.getInstance()
    this.selectedItems = new Set()
    this._animDone = false
    this._clockInterval = null

    this.state.subscribe('videos', () => this.render())
    this.state.subscribe('folders', () => this.render())
    this.state.subscribe('notes', () => this.render())
    this.state.subscribe('bookmarks', () => this.render())
    this.state.subscribe('directAccess', () => this.render())
    this.state.subscribe('pins', () => this.render())
    this.state.subscribe('userName', () => this.render())
    this.state.subscribe('externalFiles', () => this.render())

    this.on('ui:grid:refresh', () => this.render())

    this._exposeGlobals()
  }

  _exposeGlobals() {
    window.renderGridView = () => this.render()
    window.startGridAnim = () => this._startAnim()
    window.takePicture = () => this._takePicture()
    window.renderProgressBar = (c, t, l) => this._renderProgressBar(c, t, l)
    window.renderNoteTodoPreview = (n) => this._renderNoteTodoPreview(n)
    window.burstParticles = (x, y, c) => this._burstParticles(x, y, c)
    window.todoBurst = (e) => this._todoBurst(e)
    window.openExternalText = (f) => this._openExternalText(f)
    window.openExternalVideo = (f) => this._openExternalVideo(f)
    window.closeExternalText = () => this._closeExternalText()
    window.closeExternalVideo = () => this._closeExternalVideo()
    window.backfillExtThumbnails = () => this._backfillThumbnails()
  }

  mount(rootEl) {
    super.mount(rootEl)
    this._bindDOMEvents()
    this.render()
    this._backfillThumbnails()
  }

  _bindDOMEvents() {
    this.listenTo(document.getElementById('gridBtn'), 'click', () => {
      const gv = this.rootEl
      if (gv.classList.contains('open')) return
      this._hideAllViews()
      gv.classList.add('open')
      document.getElementById('gridBtn')?.classList.add('active')
      document.getElementById('deckBtn')?.classList.remove('active')
      this.bus.emit('ui:view:set', { view: 'grid' })
      const input = document.getElementById('kiroInput')
      if (input) input.value = ''
      this.render()
    })

    this.listenTo(document.getElementById('deckBtn'), 'click', () => {
      const dv = document.getElementById('deckView')
      if (dv.classList.contains('open')) return
      this._hideAllViews()
      dv.classList.add('open')
      document.getElementById('deckBtn')?.classList.add('active')
      this.bus.emit('ui:view:set', { view: 'deck' })
      const input = document.getElementById('kiroInput')
      if (input) input.value = ''
    })

    this.listenTo(document.getElementById('extTextClose'), 'click', () => this._closeExternalText())
    this.listenTo(document.getElementById('extVideoClose'), 'click', () => this._closeExternalVideo())

    this.listenTo(document.getElementById('extVideoPlayBtn'), 'click', () => this._toggleVideoPlay())
    this.listenTo(document.getElementById('extVideoSkipBackBtn'), 'click', () => { this._videoSkip(-10); this._showSkipOverlay('skip-back') })
    this.listenTo(document.getElementById('extVideoSkipFwdBtn'), 'click', () => { this._videoSkip(10); this._showSkipOverlay('skip-forward') })
    this.listenTo(document.getElementById('extVideoMuteBtn'), 'click', () => this._toggleVideoMute())
    this.listenTo(document.getElementById('extVideoVolume'), 'input', (e) => this._videoVolume(e))
    this.listenTo(document.getElementById('extVideoFullscreenBtn'), 'click', () => this._toggleVideoFullscreen())
    this.listenTo(document.getElementById('extVideoPipBtn'), 'click', () => this._toggleVideoPip())
    this.listenTo(document.getElementById('extVideoProgress'), 'click', (e) => this._videoSeek(e))
    this.listenTo(document.getElementById('extVideoElement'), 'timeupdate', () => this._updateVideoControls())
    this.listenTo(document.getElementById('extVideoElement'), 'play', () => this._updateVideoPlayIcon(true))
    this.listenTo(document.getElementById('extVideoElement'), 'pause', () => this._updateVideoPlayIcon(false))
    this.listenTo(document.getElementById('extVideoElement'), 'volumechange', () => this._updateVideoVolumeUI())
    this.listenTo(document.getElementById('extVideoElement'), 'loadedmetadata', () => this._updateVideoControls())
    this.listenTo(document.getElementById('extVideoElement'), 'enterpictureinpicture', () => this._updatePipIcon(true))
    this.listenTo(document.getElementById('extVideoElement'), 'leavepictureinpicture', () => this._updatePipIcon(false))
    this.listenTo(document.getElementById('extVideoElement'), 'click', (e) => {
      if (this._extVideoDbl) {
        clearTimeout(this._extVideoDbl)
        this._extVideoDbl = null
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const edge = rect.width * 0.3
        if (x < edge) { this._videoSkip(-10); this._showSkipOverlay('skip-back') }
        else if (x > rect.width - edge) { this._videoSkip(10); this._showSkipOverlay('skip-forward') }
        return
      }
      this._extVideoDbl = setTimeout(() => {
        this._extVideoDbl = null
        this._toggleVideoPlay()
      }, 220)
    })

    this.listenTo(document, 'click', (e) => {
      const btn = e.target.closest('.wb-btn')
      if (!btn) return
      const action = btn.dataset.action
      if (action === 'note') this._handleNewNote()
      else if (action === 'import-file') this._importFile()
      else if (action === 'camera') this._takePicture()
    })

    this.listenTo(document.getElementById('cameraClose'), 'click', () => this._closeCamera())
    this.listenTo(document.getElementById('cameraCaptureBtn'), 'click', () => this._capturePhoto())
    this.listenTo(document.getElementById('cameraFlipBtn'), 'click', () => this._flipCamera())
    this.listenTo(document.getElementById('cameraRetakeBtn'), 'click', () => this._retakePhoto())
    this.listenTo(document.getElementById('cameraUseBtn'), 'click', () => this._usePhoto())

  }

  render() {
    if (!this.rootEl) return
    const el = this.rootEl
    const folders = this.state.getState('folders') || {}
    const folderMeta = this.state.getState('folderMeta') || {}
    const videos = this.state.getState('videos') || {}
    const notes = this.state.getState('notes') || []
    const bookmarks = this.state.getState('bookmarks') || []
    const directAccess = this.state.getState('directAccess') || []
    const externalFiles = this.state.getState('externalFiles') || []
    const pins = this.state.getState('pins') || []
    const userName = this.state.getState('userName') || ''

    let html = ''

    for (const [name, ids] of Object.entries(folders)) {
      const folderNotes = notes.filter(n => n.folder === name)
      const folderExt = externalFiles.filter(f => f.folder === name)
      if (!ids.length && !folderNotes.length && !folderExt.length) continue
      const color = folderMeta[name]?.color || ''
      const hasContents = ids.length || folderNotes.length || folderExt.length

      html += `<div class="grid-section"><div class="grid-section-header"${color ? ` style="color:${color}"` : ''}><i data-lucide="${hasContents ? 'folder-fill' : 'folder'}" style="width:16px;height:16px;flex-shrink:0"></i> ${name}</div><div class="grid-items">`

      for (const id of ids) {
        const v = videos[id]
        if (!v) continue
        const thumb = v.thumbnail || `https://img.youtube.com/vi/${id}/maxresdefault.jpg`
        const pinned = pins.includes(id)
        html += this._videoCard(id, v, thumb, pinned)
      }

      for (const n of folderNotes) {
        html += this._noteCard(n)
      }

      for (const f of folderExt) {
        html += this._externalFileCard(f)
      }

      html += '</div></div>'
    }

    if (bookmarks.length) {
      html += `<div class="grid-section"><div class="grid-section-header"><i data-lucide="bookmark-fill" style="width:16px;height:16px;flex-shrink:0"></i> Bookmarks</div><div class="grid-items">`
      for (const bm of bookmarks) html += this._bookmarkCard(bm)
      html += '</div></div>'
    }

    const unassignedNotes = notes.filter(x => !x.folder)
    if (unassignedNotes.length) {
      html += `<div class="grid-section"><div class="grid-section-header"><i data-lucide="file-text-fill" style="width:16px;height:16px;flex-shrink:0"></i> Notes</div><div class="grid-items">`
      for (const n of unassignedNotes) html += this._noteCard(n)
      html += '</div></div>'
    }

    const unassignedExt = externalFiles.filter(f => !f.folder)
    if (unassignedExt.length) {
      html += `<div class="grid-section"><div class="grid-section-header"><i data-lucide="folder" style="width:16px;height:16px;flex-shrink:0"></i> External Files</div><div class="grid-items">`
      for (const f of unassignedExt) html += this._externalFileCard(f)
      html += '</div></div>'
    }

    if (directAccess.length) {
      html += `<div class="grid-section"><div class="grid-section-header"><i data-lucide="link" style="width:16px;height:16px;flex-shrink:0"></i> Direct Access</div><div class="grid-items">`
      for (const d of directAccess) html += this._daCard(d)
      html += '</div></div>'
    }

    el.innerHTML = this._workbenchHTML(userName) + html

    if (!this._animDone) {
      el.querySelectorAll('.grid-section').forEach(s => s.classList.add('grid-section-anim'))
      el.querySelectorAll('.grid-item').forEach(s => s.classList.add('grid-item-anim'))
      const wb = el.querySelector('.grid-workbench')
      if (wb) wb.classList.add('grid-section-anim')
    }

    this._updateClock()
    if (!this._clockInterval) {
      this._clockInterval = setInterval(() => this._updateClock(), 30000)
    }

    this._attachItemEvents(el, videos, bookmarks, directAccess, notes, externalFiles)
    this._attachDropEvents(el, folders)
    this._updateBatchBar()

    this.bus.emit('ui:icons:load-needed')
  }

  _workbenchHTML(userName) {
    const now = new Date()
    const dayName = DAYS[now.getDay()].toUpperCase()
    const monthName = MONTHS[now.getMonth()].toUpperCase()
    const clock = `${dayName} • ${monthName} ${now.getDate()} • ${now.getFullYear()}`
    return `<div class="grid-workbench">
      <div class="grid-workbench-text">${userName ? userName + "'s Workbench" : ''}</div>
      <div class="grid-clock">${clock}</div>
      <div class="grid-workbench-actions">
        <button class="wb-btn" data-action="note" title="New Note"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/></svg> New Note</button>
        <button class="wb-btn" data-action="import-file" title="Import File"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg> Import File</button>
        <button class="wb-btn" data-action="camera" title="Take Picture"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z"/><circle cx="12" cy="13" r="3"/></svg> Take Picture</button>
      </div>
    </div>`
  }

  _videoCard(id, v, thumb, pinned) {
    return `<div class="grid-item" data-video-id="${id}">
      <button class="grid-item-menu"><i data-lucide="ellipsis" style="width:14px;height:14px"></i></button>
      ${pinned ? '<div class="pin-badge"><i data-lucide="pin-off" style="width:14px;height:14px"></i></div>' : ''}
      <div style="position:relative"><img class="grid-item-img" src="${thumb}" loading="lazy" onerror="this.src='https://img.youtube.com/vi/${id}/hqdefault.jpg'" /></div>
      <div class="grid-item-info"><div class="grid-item-title">${v.title}</div><div class="grid-item-sublabel">${v.channel}</div></div>
    </div>`
  }

  _noteCard(n) {
    const preview = this._stripHtml(n.content || '').replace(/\n/g, ' ').substring(0, 80)
    const hasTodos = n.todos && n.todos.length
    const noteIcon = hasTodos ? 'list-todo' : 'file-text'
    const todoHtml = this._renderNoteTodoPreview(n)
    return `<div class="grid-item note" data-note-id="${n.id}">
      <button class="grid-item-menu"><i data-lucide="ellipsis" style="width:14px;height:14px"></i></button>
      <div class="grid-item-img" style="display:flex;align-items:center;justify-content:center;background:#e8e8ed;aspect-ratio:auto;height:60px"><i data-lucide="${noteIcon}" style="width:24px;height:24px;color:#8e8e93"></i></div>
      <div class="grid-item-info"><div class="grid-item-title">${n.title || 'Untitled'}</div><div class="grid-item-sublabel">${preview}${this._stripHtml(n.content || '').length > 80 ? '…' : ''}</div>${todoHtml}</div>
    </div>`
  }

  _externalFileCard(f) {
    const nsfw = f.blurred || false
    const isVideo = /\.(mp4|webm|mkv|avi|mov|flv|wmv)$/i.test(f.name)
    const isAudio = /\.(mp3|wav|ogg|flac|m4a)$/i.test(f.name)
    const isImage = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(f.name)
    const isText = /\.(txt|md|json|xml|html|css|js|py|java|c|cpp|h|ts)$/i.test(f.name)
    const thumb = f.thumbnail || ''
    if (thumb) {
      return `<div class="grid-item ext-file" data-ext-id="${f.id}">
        <button class="grid-item-menu"><i data-lucide="ellipsis" style="width:14px;height:14px"></i></button>
        <div style="position:relative"><img class="grid-item-img${nsfw ? ' nsfw-blur' : ''}" src="${thumb}" loading="lazy" onerror="this.style.display='none'" /></div>
        <div class="grid-item-info${nsfw ? ' nsfw-blur' : ''}"><div class="grid-item-title" style="font-size:12px">${this._escapeHtml(f.name)}</div><div class="grid-item-sublabel" style="font-size:10px">${this._formatSize(f.size)}</div></div>
      </div>`
    }
    let icon = 'file'
    if (isVideo) icon = 'file-video-2'
    else if (isAudio) icon = 'music'
    else if (isImage) icon = 'image'
    else if (isText) icon = 'file-text'
    return `<div class="grid-item ext-file" data-ext-id="${f.id}">
      <button class="grid-item-menu"><i data-lucide="ellipsis" style="width:14px;height:14px"></i></button>
      <div class="grid-item-img${nsfw ? ' nsfw-blur' : ''}" style="display:flex;align-items:center;justify-content:center;background:#e8e8ed;aspect-ratio:auto;height:70px"><i data-lucide="${icon}" style="width:28px;height:28px;color:#8e8e93"></i></div>
      <div class="grid-item-info${nsfw ? ' nsfw-blur' : ''}"><div class="grid-item-title" style="font-size:12px">${this._escapeHtml(f.name)}</div><div class="grid-item-sublabel" style="font-size:10px">${this._formatSize(f.size)}</div></div>
    </div>`
  }

  _bookmarkCard(bm) {
    const nsfw = bm.blurred || false
    return `<div class="grid-item bm" data-bookmark-id="${bm.id}">
      <button class="grid-item-menu"><i data-lucide="ellipsis" style="width:14px;height:14px"></i></button>
      ${bm.image ? `<div style="position:relative"><img class="grid-item-img${nsfw ? ' nsfw-blur' : ''}" src="${bm.image}" loading="lazy" onerror="this.style.display='none'" /></div>` : `<div class="grid-item-img" style="display:flex;align-items:center;justify-content:center;background:#e8e8ed"><i data-lucide="external-link" style="width:24px;height:24px;color:#8e8e93"></i></div>`}
      <div class="grid-item-info${nsfw ? ' nsfw-blur' : ''}"><div class="grid-item-title">${bm.title || bm.url}</div><div class="grid-item-sublabel">${bm.url}</div></div>
    </div>`
  }

  _daCard(d) {
    return `<div class="grid-item bm" data-da-id="${d.id}">
      <button class="grid-item-menu"><i data-lucide="ellipsis" style="width:14px;height:14px"></i></button>
      ${d.image ? `<div style="position:relative"><img class="grid-item-img" src="${d.image}" loading="lazy" onerror="this.style.display='none'" /></div>` : `<div class="grid-item-img" style="display:flex;align-items:center;justify-content:center;background:#e8e8ed"><i data-lucide="external-link" style="width:24px;height:24px;color:#8e8e93"></i></div>`}
      <div class="grid-item-info"><div class="grid-item-title">${d.title}</div><div class="grid-item-sublabel">${d.url}</div></div>
    </div>`
  }

  _updateClock() {
    const c = this.rootEl?.querySelector('.grid-clock')
    if (!c) return
    const d = new Date()
    c.textContent = `${DAYS[d.getDay()].toUpperCase()} • ${MONTHS[d.getMonth()].toUpperCase()} ${d.getDate()} • ${d.getFullYear()}`
  }

  _attachItemEvents(el, videos, bookmarks, directAccess, notes, externalFiles) {
    el.querySelectorAll('[data-video-id]').forEach(item => {
      this._addDragEvents(item, 'video', el)
      item.addEventListener('click', () => {
        const id = item.dataset.videoId
        if (id) this.bus.emit('ui:card:load-video', { id })
      })
    })

    el.querySelectorAll('[data-bookmark-id]').forEach(item => {
      const bm = bookmarks.find(b => b.id === item.dataset.bookmarkId)
      if (bm?.url) item.addEventListener('click', () => window.open(bm.url))
    })

    el.querySelectorAll('[data-da-id]').forEach(item => {
      const d = directAccess.find(x => x.id === item.dataset.daId)
      if (d?.url) item.addEventListener('click', () => window.open(d.url))
    })

    el.querySelectorAll('[data-note-id]').forEach(item => {
      item.addEventListener('click', () => {
        const nid = item.dataset.noteId
        if (nid) this.bus.emit('ui:note:open', { id: nid })
      })
    })

    el.querySelectorAll('[data-ext-id]').forEach(item => {
      item.addEventListener('click', () => {
        const f = externalFiles.find(x => x.id === item.dataset.extId)
        if (!f) return
        const isVideo = /\.(mp4|webm|mkv|avi|mov|flv|wmv)$/i.test(f.name)
        const isText = /\.(txt|md|json|xml|html|css|js|py|java|c|cpp|h|ts)$/i.test(f.name)
        const isElectron = typeof process !== 'undefined' && process.versions?.electron
        if (isText && isElectron && f.path) {
          this._openExternalText(f)
        } else if (isVideo && f.path) {
          this._openExternalVideo(f)
        } else if (f.path) {
          if (isElectron) {
            window.require('electron').shell.openPath(f.path)
          } else if (window.cordova || window.Capacitor) {
            window.open(f.path)
          }
        }
      })
    })

    el.querySelectorAll('.grid-item-menu').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        const item = btn.closest('.grid-item')
        const rect = btn.getBoundingClientRect()
        this.bus.emit('ui:context-menu:show', {
          x: rect.right, y: rect.bottom,
          videoId: item.dataset.videoId || null,
          bookmarkId: item.dataset.bookmarkId || null,
          noteId: item.dataset.noteId || null,
          daId: item.dataset.daId || null,
          extId: item.dataset.extId || null,
        })
      })
    })

    el.querySelectorAll('.grid-item').forEach(item => {
      item.addEventListener('contextmenu', (e) => {
        e.preventDefault()
        this.bus.emit('ui:context-menu:show', {
          x: e.clientX, y: e.clientY,
          videoId: item.dataset.videoId || null,
          bookmarkId: item.dataset.bookmarkId || null,
          noteId: item.dataset.noteId || null,
          daId: item.dataset.daId || null,
          extId: item.dataset.extId || null,
        })
      })
    })

    el.addEventListener('click', (e) => {
      if (!e.ctrlKey && !e.metaKey) return
      const item = e.target.closest('.grid-item')
      if (!item) return
      e.preventDefault(); e.stopPropagation()
      const id = item.dataset.videoId || item.dataset.bookmarkId || item.dataset.noteId || item.dataset.daId || item.dataset.extId
      if (!id) return
      if (this.selectedItems.has(id)) { this.selectedItems.delete(id); item.classList.remove('selected') }
      else { this.selectedItems.add(id); item.classList.add('selected') }
      this._updateBatchBar()
    })
  }

  _addDragEvents(item, type, container) {
    item.setAttribute('draggable', 'true')
    let tdState = null

    item.addEventListener('touchstart', (e) => {
      const t = e.touches[0]
      tdState = {
        dragId: item.dataset.videoId || item.dataset.bookmarkId || item.dataset.noteId || item.dataset.daId || item.dataset.extId,
        dragType: type,
        folder: (item.closest('.grid-section')?.querySelector('.grid-section-header')?.textContent?.trim()) || '',
        startX: t.clientX, startY: t.clientY, lastX: t.clientX, lastY: t.clientY,
        active: false,
        timer: setTimeout(() => { tdState.active = true; item.classList.add('dragging'); if (navigator.vibrate) navigator.vibrate(8) }, 500)
      }
    }, { passive: true })

    item.addEventListener('touchmove', (e) => {
      if (!tdState) return
      const t = e.touches[0]; tdState.lastX = t.clientX; tdState.lastY = t.clientY
      if (!tdState.active) { if (Math.abs(t.clientX - tdState.startX) > 12 || Math.abs(t.clientY - tdState.startY) > 12) { clearTimeout(tdState.timer); tdState = null } return }
      e.preventDefault()
      container.querySelectorAll('.grid-item.drag-before, .grid-item.drag-after').forEach(i => i.classList.remove('drag-before', 'drag-after'))
      const target = document.elementFromPoint(t.clientX, t.clientY)
      const targetItem = target?.closest('.grid-item')
      if (!targetItem || targetItem === item) return
      const rect = targetItem.getBoundingClientRect()
      targetItem.classList.toggle('drag-before', t.clientY < rect.top + rect.height / 2)
      targetItem.classList.toggle('drag-after', t.clientY >= rect.top + rect.height / 2)
    }, { passive: false })

    item.addEventListener('touchend', () => {
      if (!tdState) return
      clearTimeout(tdState.timer)
      if (tdState.active) this._handleDropReorder(tdState.dragId, tdState.dragType, tdState.folder, tdState.lastX, tdState.lastY, container)
      tdState = null
    })

    item.addEventListener('touchcancel', () => {
      if (tdState) { clearTimeout(tdState.timer); if (tdState.active) container.querySelectorAll('.grid-item.drag-before, .grid-item.drag-after, .grid-item.dragging').forEach(i => i.classList.remove('drag-before', 'drag-after', 'dragging')); tdState = null }
    })

    item.addEventListener('dragstart', (e) => {
      const id = item.dataset.videoId || item.dataset.bookmarkId || item.dataset.noteId || item.dataset.daId || item.dataset.extId
      const section = item.closest('.grid-section')
      const folder = section?.querySelector('.grid-section-header')?.textContent?.trim() || ''
      e.dataTransfer.setData('text/plain', id || '')
      e.dataTransfer.setData('type', type)
      e.dataTransfer.setData('folder', folder)
      e.dataTransfer.effectAllowed = 'move'
      item.classList.add('dragging')
    })

    item.addEventListener('dragover', (e) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      const t = e.dataTransfer.getData('type')
      const myId = item.dataset.videoId || item.dataset.bookmarkId || item.dataset.noteId || item.dataset.daId || item.dataset.extId
      if (t === type && e.dataTransfer.getData('text/plain') !== myId) {
        const rect = item.getBoundingClientRect()
        item.classList.toggle('drag-before', e.clientY < rect.top + rect.height / 2)
        item.classList.toggle('drag-after', e.clientY >= rect.top + rect.height / 2)
      }
    })

    item.addEventListener('dragleave', () => item.classList.remove('drag-before', 'drag-after'))

    item.addEventListener('drop', (e) => {
      e.preventDefault()
      item.classList.remove('drag-before', 'drag-after')
      const draggedId = e.dataTransfer.getData('text/plain')
      const draggedType = e.dataTransfer.getData('type')
      const folderName = e.dataTransfer.getData('folder')
      if (!draggedId || draggedType !== type) return
      this._handleDropReorder(draggedId, draggedType, folderName, e.clientX, e.clientY, container)
    })

    item.addEventListener('dragend', () => {
      item.classList.remove('dragging', 'drag-before', 'drag-after')
      container.querySelectorAll('.grid-item.drag-before, .grid-item.drag-after, .grid-item.dragging').forEach(i => i.classList.remove('drag-before', 'drag-after', 'dragging'))
    })
  }

  _handleDropReorder(dragId, dragType, folderName, clientX, clientY, container) {
    const target = document.elementFromPoint(clientX, clientY)
    const targetItem = target?.closest('.grid-item')
    if (!targetItem) return

    const targetId = targetItem.dataset.videoId || targetItem.dataset.bookmarkId || targetItem.dataset.noteId || targetItem.dataset.daId || targetItem.dataset.extId
    if (!targetId || dragId === targetId) return

    const rect = targetItem.getBoundingClientRect()
    const insertBefore = clientY < rect.top + rect.height / 2

    this.bus.emit('ui:grid:reorder', { dragId, dragType, folderName, targetId, insertBefore })
  }

  _attachDropEvents(el) {
    el.querySelectorAll('.grid-section-header').forEach(header => {
      header.addEventListener('dragover', function(e) { e.preventDefault(); this.classList.add('drop-zone') })
      header.addEventListener('dragleave', function() { this.classList.remove('drop-zone') })
      header.addEventListener('drop', (e) => {
        e.preventDefault(); header.classList.remove('drop-zone')
        const id = e.dataTransfer.getData('text/plain')
        const type = e.dataTransfer.getData('type')
        if (!id) return
        const text = header.textContent.trim()
        this.bus.emit('ui:grid:drop-on-folder', { id, type, folderName: text })
      })
    })
  }

  _updateBatchBar() {
    const bar = document.getElementById('batchBar')
    const count = document.getElementById('batchCount')
    const len = this.selectedItems.size
    if (bar && count) {
      if (len) { bar.style.display = 'flex'; count.textContent = len + ' selected' }
      else bar.style.display = 'none'
    }
  }

  _handleNewNote() {
    const notes = window.getNotes?.() || []
    const id = '_nt_' + Date.now()
    notes.push({ id, title: 'Untitled', content: '', added: Date.now() })
    window.saveNotes?.(notes)
    if (window.renderSidebar) window.renderSidebar()
    if (window.openNote) window.openNote(id)
  }

  async _importFile() {
    // Capacitor native (Android, iOS, macOS via Mac Catalyst)
    if (window.Capacitor?.isNativePlatform?.()) {
      try {
        const fp = window.Capacitor.Plugins.FilePicker
        if (!fp) throw new Error('FilePicker plugin not available')
        // Only Android needs explicit permission requests
        if (window.Capacitor.getPlatform() === 'android') {
          try {
            const permResult = await fp.checkPermissions()
            if (permResult.readExternalStorage !== 'granted') {
              const reqResult = await fp.requestPermissions({ permissions: ['readExternalStorage'] })
              if (reqResult.readExternalStorage !== 'granted') {
                console.warn('[Import] Storage permission denied')
                return
              }
            }
          } catch (permErr) {
            // checkPermissions/requestPermissions only work on Android; carry on
          }
        }
        const result = await fp.pickFiles({ limit: 1 })
        if (!result?.files?.length) return
        const file = result.files[0]
        const path = file.path || file.uri || file.name
        this._addExternalFile(file.name, path, file.size || 0, file.mimeType || '')
      } catch (e) {
        if (e.message?.includes?.('canceled')) return
        console.warn('[Import] Capacitor file-picker failed:', e)
      }
      return
    }

    // Electron (macOS, Windows, Linux)
    const isElectron = typeof process !== 'undefined' && process.versions?.electron
    if (isElectron) {
      try {
        const { dialog } = window.require('@electron/remote') || {}
        if (dialog) {
          const result = await dialog.showOpenDialog({ properties: ['openFile'] })
          if (!result.canceled && result.filePaths?.length) {
            const path = result.filePaths[0]
            this._addExternalFile(path.split(/[/\\]/).pop(), path)
          }
          return
        }
      } catch {}
      try {
        const result = await window.require('electron').ipcRenderer.invoke('open-file-dialog')
        if (result?.filePaths?.length) {
          const path = result.filePaths[0]
          this._addExternalFile(path.split(/[/\\]/).pop(), path)
        }
      } catch {}
      return
    }

    // Web / PWA fallback
    const input = document.createElement('input')
    input.type = 'file'
    input.onchange = (e) => {
      const file = e.target.files?.[0]
      if (!file) return
      const isVideo = file.type.startsWith('video/')
      const isImage = file.type.startsWith('image/')
      const path = isVideo || isImage ? URL.createObjectURL(file) : file.name
      this._addExternalFile(file.name, path, file.size, file.type)
    }
    input.click()
  }

  _addExternalFile(name, path, size, mimeType) {
    const ext = window.getExternalFiles?.() || []
    const id = '_ext_' + Date.now()
    const entry = { id, name, path, size: size || 0, mimeType: mimeType || '', added: Date.now(), blurred: false }
    ext.push(entry)
    window.saveExternalFiles?.(ext)
    this.state.setState('externalFiles', ext)
    this._generateThumbnail(entry)
    if (window.renderSidebar) window.renderSidebar()
    if (window.renderGridView) window.renderGridView()
  }

  _generateThumbnail(entry) {
    const isImage = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(entry.name)
    const isVideo = /\.(mp4|webm|mkv|avi|mov|flv|wmv)$/i.test(entry.name)
    if (!entry.path || !(isImage || isVideo)) return
    const isElectron = typeof process !== 'undefined' && process.versions?.electron

    if (isImage) {
      if (isElectron) {
        try {
          const fs = window.require('fs')
          const stat = fs.statSync(entry.path)
          if (stat.size > 2 * 1024 * 1024) {
            entry.thumbnail = encodeURI('file:///' + entry.path.replace(/\\/g, '/'))
            this._saveThumbnail(entry)
            return
          }
          const buf = fs.readFileSync(entry.path)
          const ext = entry.name.split('.').pop().toLowerCase()
          const mime = ext === 'jpg' ? 'jpeg' : ext === 'svg' ? 'svg+xml' : ext
          entry.thumbnail = 'data:image/' + mime + ';base64,' + buf.toString('base64')
          this._saveThumbnail(entry)
        } catch (e) {
          console.warn('[Thumbnail] Failed to read image:', e)
        }
      } else {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          try {
            const c = document.createElement('canvas')
            c.width = Math.min(img.naturalWidth, 320)
            c.height = Math.min(img.naturalHeight, 180)
            const ctx = c.getContext('2d')
            if (ctx) { ctx.drawImage(img, 0, 0, c.width, c.height); entry.thumbnail = c.toDataURL('image/jpeg', 0.6); this._saveThumbnail(entry) }
          } catch (e) { console.warn('[Thumbnail] Image canvas failed:', e) }
        }
        img.onerror = () => {}
        img.src = entry.path
      }
      return
    }

    if (isVideo) {
      const vid = document.createElement('video')
      vid.muted = true
      vid.playsInline = true
      vid.preload = 'metadata'
      if (isElectron) {
        vid.src = encodeURI('file:///' + entry.path.replace(/\\/g, '/'))
      } else {
        vid.src = entry.path
      }
      vid.style.position = 'absolute'
      vid.style.left = '-9999px'
      document.body.appendChild(vid)
      const cleanup = () => { try { vid.remove() } catch {} }
      vid.addEventListener('loadeddata', () => {
        if (vid.duration) vid.currentTime = Math.min(vid.duration * 0.3, 5)
      })
      vid.addEventListener('seeked', () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = vid.videoWidth || 320
          canvas.height = vid.videoHeight || 180
          const ctx = canvas.getContext('2d')
          if (ctx) { ctx.drawImage(vid, 0, 0, canvas.width, canvas.height); entry.thumbnail = canvas.toDataURL('image/jpeg', 0.6) }
        } catch (e) { console.warn('[Thumbnail] seeked drawImage failed:', e) }
        cleanup()
        if (entry.thumbnail) this._saveThumbnail(entry)
      })
      vid.addEventListener('error', () => cleanup())
      vid.load()
    }
  }

  _saveThumbnail(entry) {
    const ext = window.getExternalFiles?.() || []
    const f = ext.filter(x => x.id === entry.id)[0]
    if (!f) return
    f.thumbnail = entry.thumbnail
    window.saveExternalFiles?.(ext)
    this.state.setState('externalFiles', ext)
    if (window.renderGridView) window.renderGridView()
  }

  _backfillThumbnails() {
    const ext = window.getExternalFiles?.() || []
    let dirty = false
    for (const entry of ext) {
      if (entry.thumbnail) continue
      const isImage = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(entry.name)
      const isVideo = /\.(mp4|webm|mkv|avi|mov|flv|wmv)$/i.test(entry.name)
      if (!isImage && !isVideo) continue
      dirty = true
      this._generateThumbnail(entry)
    }
    if (dirty && window.renderSidebar) window.renderSidebar()
  }

  _hideAllViews() {
    document.getElementById('noteView').style.display = 'none'
    document.getElementById('gridView').classList.remove('open')
    document.getElementById('deckView')?.classList.remove('open')
    document.getElementById('extTextView').style.display = 'none'
    document.getElementById('extVideoView').style.display = 'none'
    const ct = document.querySelector('.content')
    if (ct) ct.style.display = 'none'
    const sl = document.getElementById('searchLanding')
    if (sl) sl.style.display = 'none'
    const ve = document.getElementById('extVideoElement')
    if (ve) { ve.pause(); ve.src = '' }
  }

  _openExternalText(f) {
    if (!f.path) return
    const isElectron = typeof process !== 'undefined' && process.versions?.electron
    if (!isElectron) return
    try {
      const fs = window.require('fs')
      const content = fs.readFileSync(f.path, 'utf-8')
      document.getElementById('extTextTitle').textContent = f.name
      document.getElementById('extTextContent').textContent = content
      this._hideAllViews()
      document.getElementById('extTextView').style.display = 'flex'
    } catch (e) {
      console.warn('[ExtText] Failed to read:', e)
    }
  }

  _closeExternalText() {
    document.getElementById('extTextContent').textContent = ''
    this._hideAllViews()
    document.getElementById('gridView').classList.add('open')
  }

  async _takePicture() {
    try {
      if (this._cameraStream) {
        this._cameraStream.getTracks().forEach(t => t.stop())
        this._cameraStream = null
      }
      const constraints = { video: { facingMode: 'environment' }, audio: false }
      this._cameraStream = await navigator.mediaDevices.getUserMedia(constraints)
      const video = document.getElementById('cameraPreview')
      video.srcObject = this._cameraStream
      this._cameraFacing = 'environment'
      document.getElementById('cameraOverlay').style.display = 'flex'
      document.getElementById('cameraPreviewShot').style.display = 'none'
      if (window.loadIcons) window.loadIcons()
    } catch (e) {
      if (e.name === 'NotAllowedError') {
        alert('Camera permission denied. Please allow camera access in your browser settings.')
      } else {
        console.warn('[Camera] Failed to open:', e)
        alert('Could not open camera: ' + e.message)
      }
    }
  }

  _closeCamera() {
    document.getElementById('cameraOverlay').style.display = 'none'
    document.getElementById('cameraPreviewShot').style.display = 'none'
    if (this._cameraStream) {
      this._cameraStream.getTracks().forEach(t => t.stop())
      this._cameraStream = null
    }
  }

  _capturePhoto() {
    const video = document.getElementById('cameraPreview')
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)
    this._capturedDataUrl = canvas.toDataURL('image/jpeg', 0.92)
    document.getElementById('cameraShotImg').src = this._capturedDataUrl
    document.getElementById('cameraPreviewShot').style.display = 'flex'
  }

  _retakePhoto() {
    document.getElementById('cameraPreviewShot').style.display = 'none'
    this._capturedDataUrl = null
  }

  _usePhoto() {
    if (!this._capturedDataUrl) return
    const now = Date.now()
    const name = 'Photo_' + new Date().toISOString().slice(0, 10) + '_' + now + '.jpg'
    const ext = window.getExternalFiles?.() || []
    const id = '_ext_' + now
    const mimeType = 'image/jpeg'
    const data = this._capturedDataUrl.split(',')[1]
    const size = Math.round(data.length * 0.75)
    const entry = { id, name, path: this._capturedDataUrl, size, mimeType, added: now, blurred: false, thumbnail: this._capturedDataUrl }
    ext.push(entry)
    window.saveExternalFiles?.(ext)
    this.state.setState('externalFiles', ext)
    if (window.renderSidebar) window.renderSidebar()
    if (window.renderGridView) window.renderGridView()
    this._closeCamera()
  }

  async _flipCamera() {
    const newFacing = this._cameraFacing === 'environment' ? 'user' : 'environment'
    if (this._cameraStream) {
      this._cameraStream.getTracks().forEach(t => t.stop())
      this._cameraStream = null
    }
    try {
      const constraints = { video: { facingMode: newFacing }, audio: false }
      this._cameraStream = await navigator.mediaDevices.getUserMedia(constraints)
      document.getElementById('cameraPreview').srcObject = this._cameraStream
      this._cameraFacing = newFacing
    } catch (e) {
      console.warn('[Camera] Flip failed:', e)
    }
  }

  _openExternalVideo(f) {
    if (!f.path) return
    const isElectron = typeof process !== 'undefined' && process.versions?.electron
    const el = document.getElementById('extVideoElement')
    const errEl = document.getElementById('extVideoError')
    this._hideAllViews()
    if (errEl) errEl.style.display = 'none'
    if (isElectron) {
      el.src = encodeURI('file:///' + f.path.replace(/\\/g, '/'))
    } else {
      el.src = f.path
    }
    document.getElementById('extVideoTitle').textContent = f.name
    document.getElementById('extVideoView').style.display = 'flex'
    this._updateVideoPlayIcon(false)
    this._updateVideoVolumeUI()
    this._updatePipIcon(false)
    this._updateVideoControls()
    el.play().catch(() => {})
    el.addEventListener('error', function () {
      console.warn('[Video] Failed to load:', el.error?.message, el.src)
      if (errEl) errEl.style.display = 'block'
    }, { once: true })
  }

  _closeExternalVideo() {
    const el = document.getElementById('extVideoElement')
    el.pause()
    el.src = ''
    this._hideAllViews()
    document.getElementById('gridView').classList.add('open')
  }

  _toggleVideoPlay() {
    const el = document.getElementById('extVideoElement')
    if (el.paused) el.play().catch(() => {})
    else el.pause()
    this._showPlayPauseOverlay()
  }

  _showPlayPauseOverlay() {
    const el = document.getElementById('extVideoElement')
    if (!el) return
    this._showOverlay(el.paused ? 'pause' : 'play')
  }

  _showSkipOverlay(dir) {
    const pos = dir === 'skip-back' ? 'skip-left' : dir === 'skip-forward' ? 'skip-right' : ''
    this._showOverlay(dir, pos)
  }

  _showOverlay(name, pos) {
    const overlay = document.getElementById('extVideoOverlayIcon')
    if (!overlay) return
    overlay.innerHTML = SVG[name]
    overlay.classList.remove('skip-left', 'skip-right')
    if (pos) overlay.classList.add(pos)
    overlay.classList.add('show')
    clearTimeout(overlay._hideTimer)
    overlay._hideTimer = setTimeout(() => overlay.classList.remove('show'), 400)
  }

  _videoSkip(sec) {
    const el = document.getElementById('extVideoElement')
    if (!el.duration) return
    el.currentTime = Math.max(0, Math.min(el.duration, el.currentTime + sec))
  }

  _toggleVideoMute() {
    const el = document.getElementById('extVideoElement')
    el.muted = !el.muted
  }

  _videoVolume(e) {
    const el = document.getElementById('extVideoElement')
    const v = parseFloat(e.target.value)
    el.muted = false
    el.volume = v
  }

  _toggleVideoFullscreen() {
    const el = document.getElementById('extVideoElement')
    if (!document.fullscreenElement) {
      el.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
  }

  _toggleVideoPip() {
    const el = document.getElementById('extVideoElement')
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture?.()
    } else {
      el.requestPictureInPicture?.()
    }
  }

  _videoSeek(e) {
    const el = document.getElementById('extVideoElement')
    if (!el.duration) return
    const track = document.getElementById('extVideoProgress')
    const rect = track.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    el.currentTime = pct * el.duration
  }

  _updateVideoControls() {
    const el = document.getElementById('extVideoElement')
    const fill = document.getElementById('extVideoProgressFill')
    const timeEl = document.getElementById('extVideoTime')
    if (!el || !fill || !timeEl) return
    const pct = el.duration ? (el.currentTime / el.duration) * 100 : 0
    fill.style.width = pct + '%'
    timeEl.textContent = this._formatTime(el.currentTime) + ' / ' + this._formatTime(el.duration)
  }

  _updateVideoPlayIcon(playing) {
    const icon = document.getElementById('extVideoPlayIcon')
    if (!icon) return
    icon.innerHTML = SVG[playing ? 'pause' : 'play']
  }

  _updateVideoVolumeUI() {
    const el = document.getElementById('extVideoElement')
    const slider = document.getElementById('extVideoVolume')
    const icon = document.getElementById('extVideoMuteIcon')
    if (!el || !slider || !icon) return
    const name = el.muted || el.volume === 0 ? 'volume-x' : el.volume < 0.5 ? 'volume-1' : 'volume-2'
    icon.innerHTML = SVG[name]
    slider.value = el.muted ? 0 : el.volume
  }

  _updatePipIcon(active) {
    const icon = document.getElementById('extVideoPipIcon')
    if (!icon) return
    icon.innerHTML = SVG[active ? 'picture-in-picture' : 'picture-in-picture-2']
  }

  _formatTime(s) {
    if (!s || !isFinite(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return m + ':' + (sec < 10 ? '0' : '') + sec
  }

  _renderProgressBar(current, target, label) {
    const pct = Math.min(100, (current / Math.max(target, 1)) * 100)
    const displayLabel = label || (current + '/' + target)
    return `<div class="kiro-progress"><div class="kiro-progress-track segmented"><div class="kiro-progress-fill${pct >= 100 ? ' glow' : ''}" style="width:${pct}%"></div></div><span class="kiro-progress-text">${displayLabel}</span></div>`
  }

  _renderNoteTodoPreview(n) {
    if (!n || !n.todos || !n.todos.length) return ''
    let html = '<div class="grid-item-todos">'
    let shown = 0
    for (const t of n.todos) {
      if (shown >= 3) break
      html += `<div class="grid-item-todo"><span class="todo-check${t.done ? ' done' : ''}"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg></span><span class="todo-text${t.done ? ' done' : ''}">${t.text || ''}</span></div>`
      shown++
    }
    if (n.todos.length > 3) html += '<div style="font-size:9px;color:#8e8e93;padding-top:2px">+' + (n.todos.length - 3) + ' more</div>'
    html += '</div>'
    return html
  }

  _formatSize(bytes) {
    if (!bytes) return ''
    const units = ['B', 'KB', 'MB', 'GB']
    let i = 0
    let size = bytes
    while (size >= 1024 && i < units.length - 1) { size /= 1024; i++ }
    return size.toFixed(1) + ' ' + units[i]
  }

  _todoBurst(e) {
    const colors = ['#ffd60a', '#ff9f0a', '#30d158', '#007aff', '#ff375f']
    for (let i = 0; i < 12; i++) {
      const dot = document.createElement('div')
      dot.className = 'kiro-particle'
      const color = colors[i % colors.length]
      const size = 4 + Math.random() * 6
      dot.style.width = size + 'px'
      dot.style.height = size + 'px'
      dot.style.background = color
      dot.style.boxShadow = '0 0 6px ' + color
      dot.style.left = (e.clientX || window.innerWidth / 2) + 'px'
      dot.style.top = (e.clientY || window.innerHeight / 2) + 'px'
      document.body.appendChild(dot)
      const angle = Math.random() * 360
      const dist = 20 + Math.random() * 30
      const dx = Math.cos(angle * Math.PI / 180) * dist
      const dy = Math.sin(angle * Math.PI / 180) * dist
      dot.style.transition = 'transform 0.45s cubic-bezier(0,.8,.5,1), opacity 0.45s ease, box-shadow 0.45s ease'
      requestAnimationFrame(() => {
        dot.style.transform = `translate(${dx}px,${dy}px) scale(0)`
        dot.style.opacity = '0'
        dot.style.boxShadow = 'none'
      })
      setTimeout(() => { if (dot.parentNode) dot.parentNode.removeChild(dot) }, 500)
    }
  }

  _burstParticles(x, y, color) {
    this._todoBurst({ clientX: x, clientY: y })
  }

  _startAnim() {
    const el = this.rootEl
    if (!el) return
    const sections = el.querySelectorAll('.grid-section-anim')
    Array.from(sections).forEach((section, i) => {
      setTimeout(() => {
        section.classList.add('visible')
        const items = section.querySelectorAll('.grid-item-anim')
        Array.from(items).forEach((item, j) => {
          setTimeout(() => item.classList.add('visible'), j * 60 + 120)
        })
      }, i * 220)
    })
    this._animDone = true
  }

  destroy() {
    if (this._clockInterval) { clearInterval(this._clockInterval); this._clockInterval = null }
    super.destroy()
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
