import { Component } from './base/Component.js'
import { Api } from '../core/Api.js'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

export class GridView extends Component {
  constructor() {
    super()
    this.api = Api.getInstance()
    this.selectedItems = new Set()
    this._animDone = false
    this._clockInterval = null
    this._challengeTodoCtx = null
    this._challengeEditTodoCtx = null
    this._challengeTodoIdx = 0

    this.state.subscribe('videos', () => this.render())
    this.state.subscribe('folders', () => this.render())
    this.state.subscribe('notes', () => this.render())
    this.state.subscribe('bookmarks', () => this.render())
    this.state.subscribe('directAccess', () => this.render())
    this.state.subscribe('challenges', () => this.render())
    this.state.subscribe('goals', () => this.render())
    this.state.subscribe('pins', () => this.render())
    this.state.subscribe('userName', () => this.render())

    this.on('ui:grid:refresh', () => this.render())

    this._exposeGlobals()
  }

  _exposeGlobals() {
    window.renderGridView = () => this.render()
    window.startGridAnim = () => this._startAnim()
    window.openChallengeDialog = () => this._openChallengeDialog()
    window.openGoalDialog = () => this._openGoalDialog()
    window.openAchievementDialog = () => this._openAchievementDialog()
    window.openChallengeEditDialog = (id) => this._openChallengeEditDialog(id)
    window.checkAchievements = () => this._checkAchievements()
    window.renderProgressBar = (c, t, l) => this._renderProgressBar(c, t, l)
    window.renderNoteTodoPreview = (n) => this._renderNoteTodoPreview(n)
    window.burstParticles = (x, y, c) => this._burstParticles(x, y, c)
    window.todoBurst = (e) => this._todoBurst(e)
  }

  mount(rootEl) {
    super.mount(rootEl)
    this._bindDOMEvents()
    this.render()
  }

  _bindDOMEvents() {
    this.listenTo(document.getElementById('gridBtn'), 'click', () => {
      const gv = this.rootEl
      if (gv.classList.contains('open')) return
      gv.classList.add('open')
      document.getElementById('gridBtn')?.classList.add('active')
      this.bus.emit('ui:view:set', { view: 'grid' })
      const input = document.getElementById('kiroInput')
      if (input) input.value = ''
      this.render()
    })

    this.listenTo(document, 'click', (e) => {
      const btn = e.target.closest('.wb-btn')
      if (!btn) return
      const action = btn.dataset.action
      if (action === 'note') this._handleNewNote()
      else if (action === 'challenge') this._openChallengeDialog()
      else if (action === 'achievement') this._openAchievementDialog()
      else if (action === 'goal') this._openGoalDialog()
    })

    // Challenge dialog buttons
    this.listenTo(document.getElementById('challengeAddTodoBtn'), 'click', () => {
      if (this._challengeTodoCtx) this._challengeTodoCtx.add()
    })
    this.listenTo(document.getElementById('challengeDialogCancel'), 'click', () => {
      document.getElementById('challengeDialog')?.classList.remove('open')
    })
    this.listenTo(document.getElementById('challengeDialogConfirm'), 'click', () => {
      const name = document.getElementById('challengeNameInput')?.value.trim()
      if (!name) return
      const todos = (this._challengeTodoCtx ? this._challengeTodoCtx.items : []).filter(t => t.text.trim())
      const challenges = window.getKiroChallenges?.() || []
      challenges.push({
        id: '_ch_' + Date.now(),
        name,
        desc: document.getElementById('challengeDescInput')?.value.trim() || '',
        target: Math.max(todos.length, 1),
        unit: 'goals',
        progress: 0,
        created: Date.now(),
        todos
      })
      window.saveKiroChallenges?.(challenges)
      document.getElementById('challengeDialog')?.classList.remove('open')
      this._checkAchievements()
      const rect = (document.querySelector('.wb-btn[data-action="challenge"]') || document.body).getBoundingClientRect()
      this._burstParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, '#30d158')
    })

    // Goal dialog buttons
    this.listenTo(document.getElementById('goalDialogCancel'), 'click', () => {
      document.getElementById('goalDialog')?.classList.remove('open')
    })
    this.listenTo(document.getElementById('goalDialogConfirm'), 'click', () => {
      const name = document.getElementById('goalNameInput')?.value.trim()
      if (!name) return
      const goals = window.getKiroGoals?.() || []
      goals.push({
        id: '_gl_' + Date.now(),
        name,
        desc: document.getElementById('goalDescInput')?.value.trim() || '',
        target: parseInt(document.getElementById('goalTargetInput')?.value) || 5,
        progress: 0,
        created: Date.now()
      })
      window.saveKiroGoals?.(goals)
      document.getElementById('goalDialog')?.classList.remove('open')
      this._checkAchievements()
      this._burstParticles(window.innerWidth / 2, window.innerHeight / 2, '#ff9f0a')
    })

    // Challenge edit dialog buttons
    this.listenTo(document.getElementById('challengeEditAddTodoBtn'), 'click', () => {
      if (this._challengeEditTodoCtx) this._challengeEditTodoCtx.add()
    })
    this.listenTo(document.getElementById('challengeEditCancel'), 'click', () => {
      document.getElementById('challengeEditDialog')?.classList.remove('open')
    })
    this.listenTo(document.getElementById('challengeEditSaveBtn'), 'click', () => {
      const dialog = document.getElementById('challengeEditDialog')
      const cid = dialog?.dataset.challengeId
      if (!cid) return
      const challenges = window.getKiroChallenges?.() || []
      const c = challenges.find(x => x.id === cid)
      if (!c) return
      const name = document.getElementById('challengeEditNameInput')?.value.trim()
      if (!name) return
      const todos = (this._challengeEditTodoCtx ? this._challengeEditTodoCtx.items : []).filter(t => t.text.trim())
      c.name = name
      c.desc = document.getElementById('challengeEditDescInput')?.value.trim() || ''
      c.todos = todos
      c.target = Math.max(todos.length, 1)
      c.unit = 'goals'
      c.progress = todos.filter(t => t.done).length
      if (c.progress > c.target) c.progress = c.target
      window.saveKiroChallenges?.(challenges)
      dialog?.classList.remove('open')
      this._checkAchievements()
      const rect = (document.querySelector('.grid-item.challenge[data-challenge-id="' + cid + '"]') || document.body).getBoundingClientRect()
      this._burstParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, '#30d158')
    })
    this.listenTo(document.getElementById('challengeEditDeleteBtn'), 'click', () => {
      const dialog = document.getElementById('challengeEditDialog')
      const cid = dialog?.dataset.challengeId
      if (!cid || !confirm('Delete this challenge?')) return
      const challenges = window.getKiroChallenges?.() || []
      window.saveKiroChallenges?.(challenges.filter(x => x.id !== cid))
      dialog?.classList.remove('open')
    })
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
    const challenges = this.state.getState('challenges') || []
    const goals = this.state.getState('goals') || []
    const pins = this.state.getState('pins') || []
    const userName = this.state.getState('userName') || ''

    let html = ''

    for (const [name, ids] of Object.entries(folders)) {
      const folderNotes = notes.filter(n => n.folder === name)
      if (!ids.length && !folderNotes.length) continue
      const color = folderMeta[name]?.color || ''
      const hasContents = ids.length || folderNotes.length

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

    if (directAccess.length) {
      html += `<div class="grid-section"><div class="grid-section-header"><i data-lucide="link" style="width:16px;height:16px;flex-shrink:0"></i> Direct Access</div><div class="grid-items">`
      for (const d of directAccess) html += this._daCard(d)
      html += '</div></div>'
    }

    const activeChallenges = challenges.filter(c => c.progress < c.target)
    if (activeChallenges.length) {
      html += '<div class="grid-section"><div class="grid-section-header"><i data-lucide="sparkles" style="width:16px;height:16px;flex-shrink:0"></i> Active Challenges</div><div class="grid-items">'
      for (const c of activeChallenges) html += this._challengeCard(c)
      html += '</div></div>'
    }

    const activeGoals = goals.filter(g => g.progress < g.target)
    if (activeGoals.length) {
      html += '<div class="grid-section"><div class="grid-section-header"><i data-lucide="rocket" style="width:16px;height:16px;flex-shrink:0"></i> Goals</div><div class="grid-items">'
      for (const g of activeGoals) html += this._goalCard(g)
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

    this._attachItemEvents(el, videos, bookmarks, directAccess, notes)
    this._attachDropEvents(el, folders)
    this._attachChallengeEvents(el, challenges)
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
        <button class="wb-btn" data-action="challenge" title="New Challenge"><i data-lucide="sparkles" style="width:15px;height:15px"></i> New Challenge</button>
        <button class="wb-btn" data-action="goal" title="New Goal"><i data-lucide="rocket" style="width:15px;height:15px"></i> New Goal</button>
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

  _challengeCard(c) {
    const pct = Math.min(100, (c.progress / Math.max(c.target, 1)) * 100)
    let todosHtml = ''
    if (c.todos && c.todos.length) {
      todosHtml = '<div class="grid-item-todos" style="margin-top:6px">'
      for (let tgi = 0; tgi < c.todos.length; tgi++) {
        const t = c.todos[tgi]
        todosHtml += `<div class="grid-item-todo challenge-todo-item" data-challenge-id="${c.id}" data-todo-idx="${tgi}" style="cursor:pointer"><span class="todo-check${t.done ? ' done' : ''}"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg></span><span class="todo-text${t.done ? ' done' : ''}">${this._escapeHtml(t.text || '')}</span></div>`
      }
      todosHtml += '</div>'
    }
    return `<div class="grid-item challenge" data-challenge-id="${c.id}">
      <div class="grid-item-info" style="padding:10px;width:100%;box-sizing:border-box">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px"><span class="grid-item-title" style="font-size:13px">${this._escapeHtml(c.name)}</span></div>
        ${c.desc ? '<div class="grid-item-sublabel" style="margin-bottom:6px">' + this._escapeHtml(c.desc) + '</div>' : ''}
        ${this._renderProgressBar(c.progress, c.target, c.progress + '/' + c.target + ' ' + c.unit)}
        ${todosHtml}
      </div>
    </div>`
  }

  _goalCard(g) {
    return `<div class="grid-item goal" data-goal-id="${g.id}">
      <div class="grid-item-info" style="padding:10px;width:100%;box-sizing:border-box">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px"><span class="grid-item-title" style="font-size:13px">${this._escapeHtml(g.name)}</span></div>
        ${g.desc ? '<div class="grid-item-sublabel" style="margin-bottom:6px">' + this._escapeHtml(g.desc) + '</div>' : ''}
        ${this._renderProgressBar(g.progress, g.target, g.progress + '/' + g.target + ' per week')}
      </div>
    </div>`
  }

  _updateClock() {
    const c = this.rootEl?.querySelector('.grid-clock')
    if (!c) return
    const d = new Date()
    c.textContent = `${DAYS[d.getDay()].toUpperCase()} • ${MONTHS[d.getMonth()].toUpperCase()} ${d.getDate()} • ${d.getFullYear()}`
  }

  _attachItemEvents(el, videos, bookmarks, directAccess, notes) {
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
        })
      })
    })

    el.addEventListener('click', (e) => {
      if (!e.ctrlKey && !e.metaKey) return
      const item = e.target.closest('.grid-item')
      if (!item) return
      e.preventDefault(); e.stopPropagation()
      const id = item.dataset.videoId || item.dataset.bookmarkId || item.dataset.noteId || item.dataset.daId
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
        dragId: item.dataset.videoId || item.dataset.bookmarkId || item.dataset.noteId || item.dataset.daId,
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
      const id = item.dataset.videoId || item.dataset.bookmarkId || item.dataset.noteId || item.dataset.daId
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
      const myId = item.dataset.videoId || item.dataset.bookmarkId || item.dataset.noteId || item.dataset.daId
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

    const targetId = targetItem.dataset.videoId || targetItem.dataset.bookmarkId || targetItem.dataset.noteId || targetItem.dataset.daId
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

  _attachChallengeEvents(el) {
    el.querySelectorAll('.challenge-todo-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation()
        const cid = item.dataset.challengeId
        const idx = parseInt(item.dataset.todoIdx)
        if (!cid || isNaN(idx)) return
        this.bus.emit('ui:challenge:toggle-todo', { challengeId: cid, todoIndex: idx })
      })
    })

    el.querySelectorAll('.grid-item.challenge').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.challenge-todo-item')) return
        const cid = item.dataset.challengeId
        if (cid) this._openChallengeEditDialog(cid)
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

  _openChallengeDialog() {
    const dialog = document.getElementById('challengeDialog')
    if (!dialog) return
    document.getElementById('challengeNameInput').value = ''
    document.getElementById('challengeDescInput').value = ''
    dialog.classList.add('open')
    this._challengeTodoCtx = this._renderChallengeTodoList('challengeTodoList', [], false)
    setTimeout(() => document.getElementById('challengeNameInput')?.focus(), 100)
  }

  _openGoalDialog() {
    const dialog = document.getElementById('goalDialog')
    if (!dialog) return
    document.getElementById('goalNameInput').value = ''
    document.getElementById('goalDescInput').value = ''
    document.getElementById('goalTargetInput').value = 5
    dialog.classList.add('open')
    setTimeout(() => document.getElementById('goalNameInput')?.focus(), 100)
  }

  _openAchievementDialog() {
    this._renderAchievements()
    const dialog = document.getElementById('achievementDialog')
    if (dialog) dialog.classList.add('open')
  }

  _openChallengeEditDialog(challengeId) {
    const challenges = this.state.getState('challenges') || []
    const c = challenges.find(x => x.id === challengeId)
    if (!c) return

    document.getElementById('challengeEditTitle').textContent = 'Edit: ' + this._escapeHtml(c.name)
    document.getElementById('challengeEditNameInput').value = c.name
    document.getElementById('challengeEditDescInput').value = c.desc || ''
    document.getElementById('challengeEditDialog').dataset.challengeId = challengeId

    c.todos = c.todos || []
    this._challengeEditTodoCtx = this._renderChallengeTodoList('challengeEditTodoList', c.todos.map(t => ({ id: t.id || '_cht_' + Date.now() + '_' + Math.random(), text: t.text, done: t.done })), true)

    const dialog = document.getElementById('challengeEditDialog')
    if (dialog) dialog.classList.add('open')
    setTimeout(() => document.getElementById('challengeEditNameInput')?.focus(), 100)
  }

  _renderChallengeTodoList(containerId, todos, showChecks) {
    const el = document.getElementById(containerId)
    if (!el) return null
    const items = (todos || []).map(t => ({ ...t }))

    const render = () => {
      let html = ''
      for (let i = 0; i < items.length; i++) {
        const t = items[i]
        if (showChecks) {
          html += `<div class="todo-row" data-idx="${i}">
            <span class="todo-cb${t.done ? ' checked' : ''}" data-idx="${i}">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="todo-cb-icon todo-cb-check"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="todo-cb-icon todo-cb-x"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
            </span>
            <span class="todo-text${t.done ? ' done' : ''}" contenteditable="true" data-idx="${i}" spellcheck="false">${this._escapeHtml(t.text || '')}</span>
            <button class="challenge-todo-rm" data-idx="${i}" style="background:none;border:none;color:#ff453a;cursor:pointer;font-size:16px;line-height:1;padding:2px 4px;flex-shrink:0">×</button>
          </div>`
        } else {
          html += `<div class="challenge-todo-row" data-idx="${i}" style="display:flex;align-items:center;gap:6px;margin-top:4px">
            <input type="text" class="challenge-todo-input" value="${this._escapeHtml(items[i].text || '')}" placeholder="Goal..." spellcheck="false" style="flex:1;padding:5px 8px;border:1px solid #d2d2d7;border-radius:6px;font-size:12px;font-family:inherit;outline:none;background:#f5f5f7;color:#1d1d1f" />
            <button class="challenge-todo-rm" data-idx="${i}" style="background:none;border:none;color:#ff453a;cursor:pointer;font-size:16px;line-height:1;padding:0 2px">×</button>
          </div>`
        }
      }
      el.innerHTML = html

      el.querySelectorAll('.challenge-todo-rm').forEach(btn => {
        btn.addEventListener('click', () => { items.splice(parseInt(btn.dataset.idx), 1); render() })
      })

      if (showChecks) {
        el.querySelectorAll('.todo-cb').forEach(cb => {
          cb.addEventListener('click', () => { const idx = parseInt(cb.dataset.idx); items[idx].done = !items[idx].done; render() })
        })
        el.querySelectorAll('.todo-text[contenteditable]').forEach(span => {
          span.addEventListener('blur', () => { items[parseInt(span.dataset.idx)].text = span.textContent })
          span.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); span.blur() } })
        })
      } else {
        el.querySelectorAll('.challenge-todo-input').forEach(inp => {
          inp.addEventListener('input', () => { items[parseInt(inp.dataset.idx)].text = inp.value })
          inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addItem() } })
        })
      }
    }

    const addItem = () => {
      items.push({ id: '_cht_' + Date.now() + '_' + (this._challengeTodoIdx++), text: '', done: false })
      render()
      if (showChecks) {
        const lastSpan = el.querySelector('.todo-row:last-child .todo-text')
        if (lastSpan) setTimeout(() => lastSpan.focus(), 50)
      } else {
        const lastInput = el.querySelector('.challenge-todo-input:last-child')
        if (lastInput) setTimeout(() => lastInput.focus(), 50)
      }
    }

    render()
    return { items, add: addItem }
  }

  _renderAchievements() {
    const el = document.getElementById('achievementList')
    if (!el) return
    const achievements = this.state.getState('achievements') || []

    const defaults = [
      { id: 'first_challenge', name: 'Challenger', desc: 'Complete your first challenge', icon: 'sparkles' },
      { id: 'first_goal', name: 'Goal Setter', desc: 'Set your first goal', icon: 'target' },
      { id: 'challenge_5', name: '5 Challenges Done', desc: 'Complete 5 challenges', icon: 'star' },
    ]

    let html = ''
    for (const def of defaults) {
      const unlocked = achievements.some(a => a.id === def.id)
      html += `<div class="achievement-badge${unlocked ? '' : ' locked'}">
        <span class="ab-icon">${unlocked ? '✦' : '○'}</span>
        <div><div style="font-size:13px;font-weight:600">${def.name}</div><div style="font-size:10px;opacity:0.7">${def.desc}</div></div>
      </div>`
    }

    el.innerHTML = html || '<div style="padding:20px;text-align:center;font-size:12px;color:#86868b">No achievements yet</div>'
  }

  _checkAchievements() {
    const achievements = this.state.getState('achievements') || []
    const challenges = this.state.getState('challenges') || []
    const goals = this.state.getState('goals') || []

    const unlock = (id) => {
      if (!achievements.some(a => a.id === id)) {
        achievements.push({ id, unlocked: Date.now() })
        this.state.setState('achievements', achievements)
        return true
      }
      return false
    }

    if (challenges.some(c => c.progress >= c.target)) unlock('first_challenge')
    if (goals.length >= 1) unlock('first_goal')
    if (challenges.filter(c => c.progress >= c.target).length >= 5) unlock('challenge_5')
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
