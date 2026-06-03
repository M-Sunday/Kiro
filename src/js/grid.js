// ─── Grid view ─────────────────────────────────────────
function updateGridClock() {
  var c = document.querySelector('.grid-clock')
  if (!c) return
  var d = new Date()
  var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  var months = ['January','February','March','April','May','June','July','August','September','October','November','December']
  c.textContent = days[d.getDay()].toUpperCase() + ' • ' + months[d.getMonth()].toUpperCase() + ' ' + d.getDate() + ' • ' + d.getFullYear()
}
function renderGridView() {
  const el = document.getElementById('gridView')
  let html = ''
  const folders = getFolders()
  const meta = getFolderMeta()
  const videos = getVideos()
  const pins = getPins()
  for (const [name, ids] of Object.entries(folders)) {
    const hasNotes = getNotes().filter(n => n.folder === name).length
    if (!ids.length && !hasNotes) continue
    const color = meta[name]?.color || ''
    const hasContents = ids.length || hasNotes
    html += `<div class="grid-section"><div class="grid-section-header"${color ? ` style="color:${color}"` : ''}><i data-lucide="${hasContents ? 'folder-fill' : 'folder'}" style="width:16px;height:16px;flex-shrink:0"></i> ${name}</div><div class="grid-items">`
    for (const id of ids) {
      const v = videos[id]
      if (!v) continue
      const thumb = v.thumbnail || `https://img.youtube.com/vi/${id}/maxresdefault.jpg`
      const pinned = pins.includes(id)
      const vBlur = v.blurred || isNSFW(v)
      html += `<div class="grid-item" data-video-id="${id}"><button class="grid-item-menu"><i data-lucide="ellipsis" style="width:14px;height:14px"></i></button>${pinned ? '<div class="pin-badge"><i data-lucide="pin-off" style="width:14px;height:14px"></i></div>' : ''}<div style="position:relative">${vBlur ? '<div class="nsfw-overlay"><i data-lucide="eye-off" style="width:20px;height:20px"></i></div>' : ''}<img class="grid-item-img${vBlur ? ' nsfw-blur' : ''}" src="${thumb}" loading="lazy" onerror="this.src='https://img.youtube.com/vi/${id}/hqdefault.jpg'" /></div><div class="grid-item-info${vBlur ? ' nsfw-blur' : ''}"><div class="grid-item-title">${v.title}</div><div class="grid-item-sublabel">${v.channel}</div></div></div>`
    }
    for (const n of getNotes().filter(x => x.folder === name)) {
      const preview = stripHtml(n.content || '').replace(/\n/g, ' ').substring(0, 80)
      const hasTodos = n.todos && n.todos.length
      var noteIcon = hasTodos ? 'list-todo' : 'file-text'
      var todoHtml = renderNoteTodoPreview(n)
      html += `<div class="grid-item note" data-note-id="${n.id}"><button class="grid-item-menu"><i data-lucide="ellipsis" style="width:14px;height:14px"></i></button><div class="grid-item-img" style="display:flex;align-items:center;justify-content:center;background:#e8e8ed;aspect-ratio:auto;height:60px"><i data-lucide="${noteIcon}" style="width:24px;height:24px;color:#8e8e93"></i></div><div class="grid-item-info"><div class="grid-item-title">${n.title || 'Untitled'}</div><div class="grid-item-sublabel">${preview}${stripHtml(n.content || '').length > 80 ? '…' : ''}</div>${todoHtml}</div></div>`
    }
    html += '</div></div>'
  }
  const bms = getBookmarks()
  if (bms.length) {
    html += `<div class="grid-section"><div class="grid-section-header"><i data-lucide="bookmark-fill" style="width:16px;height:16px;flex-shrink:0"></i> Bookmarks</div><div class="grid-items">`
    for (const bm of bms) {
      const bmNsfw = isNSFW(bm) || bm.blurred
      html += `<div class="grid-item bm" data-bookmark-id="${bm.id}"><button class="grid-item-menu"><i data-lucide="ellipsis" style="width:14px;height:14px"></i></button>${bm.image ? `<div style="position:relative">${bmNsfw ? '<div class="nsfw-overlay"><i data-lucide="eye-off" style="width:20px;height:20px"></i></div>' : ''}<img class="grid-item-img${bmNsfw ? ' nsfw-blur' : ''}" src="${bm.image}" loading="lazy" onerror="this.style.display='none'" /></div>` : `<div class="grid-item-img${bmNsfw ? ' nsfw-blur' : ''}" style="display:flex;align-items:center;justify-content:center;background:#e8e8ed"><i data-lucide="external-link" style="width:24px;height:24px;color:#8e8e93"></i></div>`}<div class="grid-item-info${bmNsfw ? ' nsfw-blur' : ''}"><div class="grid-item-title">${bm.title || bm.url}</div><div class="grid-item-sublabel">${bm.url}</div></div></div>`
    }
    html += '</div></div>'
  }
  const notes = getNotes().filter(x => !x.folder)
  if (notes.length) {
    html += `<div class="grid-section"><div class="grid-section-header"><i data-lucide="file-text-fill" style="width:16px;height:16px;flex-shrink:0"></i> Notes</div><div class="grid-items">`
    for (const n of notes) {
      const preview = stripHtml(n.content || '').replace(/\n/g, ' ').substring(0, 80)
      const hasTodos = n.todos && n.todos.length
      var noteIcon = hasTodos ? 'list-todo' : 'file-text'
      var todoHtml = renderNoteTodoPreview(n)
      html += `<div class="grid-item note" data-note-id="${n.id}"><button class="grid-item-menu"><i data-lucide="ellipsis" style="width:14px;height:14px"></i></button><div class="grid-item-img" style="display:flex;align-items:center;justify-content:center;background:#e8e8ed;aspect-ratio:auto;height:60px"><i data-lucide="${noteIcon}" style="width:24px;height:24px;color:#8e8e93"></i></div><div class="grid-item-info"><div class="grid-item-title">${n.title || 'Untitled'}</div><div class="grid-item-sublabel">${preview}${stripHtml(n.content || '').length > 80 ? '…' : ''}</div>${todoHtml}</div></div>`
    }
    html += '</div></div>'
  }
  const das = getDirectAccess()
  if (das.length) {
    html += `<div class="grid-section"><div class="grid-section-header"><i data-lucide="link" style="width:16px;height:16px;flex-shrink:0"></i> Direct Access</div><div class="grid-items">`
    for (const d of das) {
      const nsfw = isNSFW(d) || d.blurred
      html += `<div class="grid-item bm" data-da-id="${d.id}"><button class="grid-item-menu"><i data-lucide="ellipsis" style="width:14px;height:14px"></i></button>${d.image ? `<div style="position:relative">${nsfw ? '<div class="nsfw-overlay"><i data-lucide="eye-off" style="width:20px;height:20px"></i></div>' : ''}<img class="grid-item-img${nsfw ? ' nsfw-blur' : ''}" src="${d.image}" loading="lazy" onerror="this.style.display='none'" /></div>` : `<div class="grid-item-img${nsfw ? ' nsfw-blur' : ''}" style="display:flex;align-items:center;justify-content:center;background:#e8e8ed"><i data-lucide="external-link" style="width:24px;height:24px;color:#8e8e93"></i></div>`}<div class="grid-item-info${nsfw ? ' nsfw-blur' : ''}"><div class="grid-item-title">${d.title}</div><div class="grid-item-sublabel">${d.url}</div></div></div>`
    }
    html += '</div></div>'
  }

  var n = getUserName()
  el.innerHTML = '<div class="grid-workbench"><div class="grid-workbench-text">' + (n ? n + "'s Workbench" : '') + '</div><div class="grid-clock"></div><div class="grid-workbench-actions"><button class="wb-btn" data-action="note" title="New Note"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/></svg> New Note</button><button class="wb-btn" data-action="camera" title="Take Picture"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z"/><circle cx="12" cy="13" r="3"/></svg> Take Picture</button></div></div>' + html
  if (!window.__gridAnimDone) {
    el.querySelectorAll('.grid-section').forEach(function(s) { s.classList.add('grid-section-anim') })
    el.querySelectorAll('.grid-item').forEach(function(s) { s.classList.add('grid-item-anim') })
    var wb = el.querySelector('.grid-workbench')
    if (wb) wb.classList.add('grid-section-anim')
  }
  loadIcons()
  updateGridClock()
  if (!window.__gridClockInterval) window.__gridClockInterval = setInterval(updateGridClock, 30000)
  el.querySelectorAll('[data-video-id]').forEach(item => {
    item.addEventListener('click', () => {
      const id = item.dataset.videoId
      const v = videos[id]
      if (v) { loadVideoById(id) }
    })
  })
  el.querySelectorAll('[data-bookmark-id]').forEach(item => {
    item.addEventListener('click', () => {
      const bm = bms.filter(b => b.id === item.dataset.bookmarkId)[0]
      if (bm?.url) window.open(bm.url)
    })
  })
  el.querySelectorAll('[data-da-id]').forEach(item => {
    item.addEventListener('click', () => {
      const d = getDirectAccess().filter(x => x.id === item.dataset.daId)[0]
      if (d?.url) window.open(d.url)
    })
  })
  el.querySelectorAll('[data-note-id]').forEach(item => {
    item.addEventListener('click', () => {
      const nid = item.dataset.noteId
      if (nid) { openNote(nid) }
    })
  })
  el.querySelectorAll('.grid-item-menu').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      const item = btn.closest('.grid-item')
      const rect = btn.getBoundingClientRect()
      const vid = item.dataset.videoId
      const bm = item.dataset.bookmarkId
      const nt = item.dataset.noteId
      const da = item.dataset.daId
      showContextMenu(rect.right, rect.bottom, vid || null, null, bm || null, nt || null, da || null)
    })
  })
  el.querySelectorAll('.grid-item').forEach(item => {
    item.addEventListener('contextmenu', (e) => {
      e.preventDefault()
      const vid = item.dataset.videoId
      const bm = item.dataset.bookmarkId
      const nt = item.dataset.noteId
      const da = item.dataset.daId
      showContextMenu(e.clientX, e.clientY, vid || null, null, bm || null, nt || null, da || null)
    })
    let longTimer = null, longPressed = false
    item.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') return
      longPressed = false
      longTimer = setTimeout(() => {
        longPressed = true
        const rect = item.getBoundingClientRect()
        const x = e.clientX || rect.left + rect.width / 2
        const y = e.clientY || rect.top + rect.height / 2
        const vid = item.dataset.videoId
        const bm = item.dataset.bookmarkId
        const nt = item.dataset.noteId
        const da = item.dataset.daId
        showContextMenu(x, y, vid || null, null, bm || null, nt || null, da || null)
      }, 500)
    })
    item.addEventListener('pointerup', () => { clearTimeout(longTimer) })
    item.addEventListener('pointermove', () => { clearTimeout(longTimer) })
    item.addEventListener('pointercancel', () => { clearTimeout(longTimer) })
    item.addEventListener('click', (e) => { if (longPressed) { e.preventDefault(); e.stopPropagation(); longPressed = false } })
    item.setAttribute('draggable', 'true')
    // Touch drag support (long-press + drag for mobile)
    ;(function(){
      let tdState = null
      item.addEventListener('touchstart', (e) => {
        const t = e.touches[0]
        tdState = {
          dragId: item.dataset.videoId || item.dataset.bookmarkId || item.dataset.noteId || item.dataset.daId,
          dragType: item.dataset.videoId ? 'video' : item.dataset.bookmarkId ? 'bookmark' : item.dataset.noteId ? 'note' : 'da',
          folder: (item.closest('.grid-section')?.querySelector('.grid-section-header')?.textContent?.trim()) || '',
          startX: t.clientX, startY: t.clientY,
          lastX: t.clientX, lastY: t.clientY,
          active: false,
          timer: setTimeout(() => {
            tdState.active = true
            item.classList.add('dragging')
            if (navigator.vibrate) navigator.vibrate(8)
          }, 500)
        }
      }, { passive: true })
      item.addEventListener('touchmove', (e) => {
        if (!tdState) return
        const t = e.touches[0]; tdState.lastX = t.clientX; tdState.lastY = t.clientY
        if (!tdState.active) {
          if (Math.abs(t.clientX - tdState.startX) > 12 || Math.abs(t.clientY - tdState.startY) > 12) { clearTimeout(tdState.timer); tdState = null }
          return
        }
        e.preventDefault()
        el.querySelectorAll('.grid-item.drag-before, .grid-item.drag-after').forEach(i => i.classList.remove('drag-before', 'drag-after'))
        const target = document.elementFromPoint(t.clientX, t.clientY)
        const targetItem = target?.closest('.grid-item')
        if (!targetItem || targetItem === item) return
        const tType = targetItem.dataset.videoId ? 'video' : targetItem.dataset.bookmarkId ? 'bookmark' : targetItem.dataset.noteId ? 'note' : 'da'
        const tId = targetItem.dataset.videoId || targetItem.dataset.bookmarkId || targetItem.dataset.noteId || targetItem.dataset.daId
        if (tdState.dragType !== tType || tdState.dragId === tId) return
        const rect = targetItem.getBoundingClientRect()
        const mid = rect.top + rect.height / 2
        targetItem.classList.toggle('drag-before', t.clientY < mid)
        targetItem.classList.toggle('drag-after', t.clientY >= mid)
      }, { passive: false })
      item.addEventListener('touchend', () => {
        if (!tdState) return
        clearTimeout(tdState.timer)
        if (tdState.active) {
          const { dragId, dragType, folder: fName, lastX, lastY } = tdState
          const target = document.elementFromPoint(lastX, lastY)
          const targetItem = target?.closest('.grid-item')
          if (targetItem && targetItem !== item) {
            const tType = targetItem.dataset.videoId ? 'video' : targetItem.dataset.bookmarkId ? 'bookmark' : targetItem.dataset.noteId ? 'note' : 'da'
            const tId = targetItem.dataset.videoId || targetItem.dataset.bookmarkId || targetItem.dataset.noteId || targetItem.dataset.daId
            if (dragType === tType && dragId !== tId) {
              const rect = targetItem.getBoundingClientRect()
              const insertBefore = lastY < rect.top + rect.height / 2
              if (dragType === 'video') {
                const fs = getFolders()
                if (fs[fName]) { const from = fs[fName].indexOf(dragId), to = fs[fName].indexOf(tId); if (from > -1 && to > -1) { const [m] = fs[fName].splice(from, 1); const nt = fs[fName].indexOf(tId); fs[fName].splice(insertBefore ? nt : nt + 1, 0, m); saveFolders(fs) } }
              } else if (dragType === 'bookmark') { let b = getBookmarks(); const from = b.findIndex(x => x.id === dragId), to = b.findIndex(x => x.id === tId); if (from > -1 && to > -1) { const [m] = b.splice(from, 1); b.splice(insertBefore ? to : to, 0, m); saveBookmarks(b) } }
              else if (dragType === 'note') { let n = getNotes(); const from = n.findIndex(x => x.id === dragId), to = n.findIndex(x => x.id === tId); if (from > -1 && to > -1) { const [m] = n.splice(from, 1); n.splice(insertBefore ? to : to, 0, m); saveNotes(n) } }
              else if (dragType === 'da') { let d = getDirectAccess(); const from = d.findIndex(x => x.id === dragId), to = d.findIndex(x => x.id === tId); if (from > -1 && to > -1) { const [m] = d.splice(from, 1); d.splice(insertBefore ? to : to, 0, m); saveDirectAccess(d) } }
              renderGridView()
            }
          }
          el.querySelectorAll('.grid-item.drag-before, .grid-item.drag-after, .grid-item.dragging').forEach(i => i.classList.remove('drag-before', 'drag-after', 'dragging'))
        }
        tdState = null
      })
      item.addEventListener('touchcancel', () => { if (tdState) { clearTimeout(tdState.timer); if (tdState.active) { el.querySelectorAll('.grid-item.drag-before, .grid-item.drag-after, .grid-item.dragging').forEach(i => i.classList.remove('drag-before', 'drag-after', 'dragging')) } tdState = null } })
    })()
    item.addEventListener('dragstart', (e) => {
      const vid = item.dataset.videoId, bm = item.dataset.bookmarkId, nt = item.dataset.noteId, da = item.dataset.daId
      e.dataTransfer.setData('text/plain', vid || bm || nt || da || '')
      e.dataTransfer.setData('type', vid ? 'video' : bm ? 'bookmark' : nt ? 'note' : 'da')
      const section = item.closest('.grid-section')
      const folder = section?.querySelector('.grid-section-header')?.textContent?.trim() || ''
      e.dataTransfer.setData('folder', folder)
      e.dataTransfer.effectAllowed = 'move'
      item.classList.add('dragging')
    })
    item.addEventListener('dragover', (e) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      const t = e.dataTransfer.getData('type')
      const myT = item.dataset.videoId ? 'video' : item.dataset.bookmarkId ? 'bookmark' : item.dataset.noteId ? 'note' : 'da'
      if (t === myT && e.dataTransfer.getData('text/plain') !== (item.dataset.videoId || item.dataset.bookmarkId || item.dataset.noteId || item.dataset.daId)) {
        const rect = item.getBoundingClientRect()
        const mid = rect.top + rect.height / 2
        const before = e.clientY < mid
        item.classList.toggle('drag-before', before)
        item.classList.toggle('drag-after', !before)
      }
    })
    item.addEventListener('dragleave', () => { item.classList.remove('drag-before', 'drag-after') })
    item.addEventListener('drop', (e) => {
      e.preventDefault()
      item.classList.remove('drag-before', 'drag-after')
      const draggedId = e.dataTransfer.getData('text/plain')
      const draggedType = e.dataTransfer.getData('type')
      if (!draggedId) return
      const targetId = item.dataset.videoId || item.dataset.bookmarkId || item.dataset.noteId || item.dataset.daId
      const targetType = item.dataset.videoId ? 'video' : item.dataset.bookmarkId ? 'bookmark' : item.dataset.noteId ? 'note' : 'da'
      if (draggedType !== targetType || draggedId === targetId) return
      const rect = item.getBoundingClientRect()
      const insertBefore = e.clientY < rect.top + rect.height / 2
      if (targetType === 'video') {
        const folderName = e.dataTransfer.getData('folder')
        const fs = getFolders()
        if (!fs[folderName]) return
        const from = fs[folderName].indexOf(draggedId)
        const to = fs[folderName].indexOf(targetId)
        if (from === -1 || to === -1) return
        const [moved] = fs[folderName].splice(from, 1)
        const newTo = fs[folderName].indexOf(targetId)
        fs[folderName].splice(insertBefore ? newTo : newTo + 1, 0, moved)
        saveFolders(fs)
        renderGridView()
      } else if (targetType === 'bookmark') {
        let bms = getBookmarks()
        const from = bms.findIndex(b => b.id === draggedId)
        const to = bms.findIndex(b => b.id === targetId)
        if (from > -1 && to > -1) { const [m] = bms.splice(from, 1); bms.splice(insertBefore ? to : to, 0, m); saveBookmarks(bms); renderGridView() }
      } else if (targetType === 'note') {
        let notes = getNotes()
        const from = notes.findIndex(n => n.id === draggedId)
        const to = notes.findIndex(n => n.id === targetId)
        if (from > -1 && to > -1) { const [m] = notes.splice(from, 1); notes.splice(insertBefore ? to : to, 0, m); saveNotes(notes); renderGridView() }
      } else if (targetType === 'da') {
        let das = getDirectAccess()
        const from = das.findIndex(d => d.id === draggedId)
        const to = das.findIndex(d => d.id === targetId)
        if (from > -1 && to > -1) { const [m] = das.splice(from, 1); das.splice(insertBefore ? to : to, 0, m); saveDirectAccess(das); renderGridView() }
      }
    })
    item.addEventListener('dragend', () => {
      item.classList.remove('dragging', 'drag-before', 'drag-after')
      el.querySelectorAll('.grid-item.drag-before, .grid-item.drag-after, .grid-item.dragging').forEach(el2 => el2.classList.remove('drag-before', 'drag-after', 'dragging'))
    })
    const selId = item.dataset.videoId || item.dataset.bookmarkId || item.dataset.noteId || item.dataset.daId
    if (selId && selectedGridItems.has(selId)) item.classList.add('selected')
  })
  el.addEventListener('click', (e) => {
    if (!e.ctrlKey && !e.metaKey) return
    const item = e.target.closest('.grid-item')
    if (!item) return
    e.preventDefault(); e.stopPropagation()
    const id = item.dataset.videoId || item.dataset.bookmarkId || item.dataset.noteId || item.dataset.daId
    if (!id) return
    if (selectedGridItems.has(id)) { selectedGridItems.delete(id); item.classList.remove('selected') }
    else { selectedGridItems.add(id); item.classList.add('selected') }
    updateBatchBar()
  })
  // ─── Drop on section headers ─────────────────────
  el.querySelectorAll('.grid-section-header').forEach(function(header) {
    header.addEventListener('dragover', function(e) { e.preventDefault(); this.classList.add('drop-zone') })
    header.addEventListener('dragleave', function() { this.classList.remove('drop-zone') })
    header.addEventListener('drop', function(e) {
      e.preventDefault(); this.classList.remove('drop-zone')
      var id = e.dataTransfer.getData('text/plain')
      var type = e.dataTransfer.getData('type')
      if (!id) return
      var text = this.textContent.trim()
      var folders = getFolders()
      if (folders[text] !== undefined) {
        if (type === 'video') {
          for (var ids of Object.values(folders)) { var idx = ids.indexOf(id); if (idx > -1) ids.splice(idx, 1) }
          if (!folders[text].includes(id)) folders[text].push(id)
          saveFolders(folders); renderGridView(); renderSidebar()
        } else if (type === 'note') {
          var notes = getNotes(); var note = notes.find(function(n) { return n.id === id })
          if (note) { note.folder = text; saveNotes(notes); renderGridView(); renderSidebar() }
        }
      } else if (text === 'Notes') {
        if (type === 'note') {
          var notes = getNotes(); var note = notes.find(function(n) { return n.id === id })
          if (note) { note.folder = ''; saveNotes(notes); renderGridView(); renderSidebar() }
        }
      }
    })
  })
  updateBatchBar()
}

// ─── Cascade animation trigger ─────────────────────────
window.startGridAnim = function() {
  var el = document.getElementById('gridView')
  if (!el) return
  var sections = el.querySelectorAll('.grid-section-anim')
  Array.from(sections).forEach(function(section, i) {
    setTimeout(function() {
      section.classList.add('visible')
      var items = section.querySelectorAll('.grid-item-anim')
      Array.from(items).forEach(function(item, j) {
        setTimeout(function() { item.classList.add('visible') }, j * 60 + 120)
      })
    }, i * 220)
  })
  window.__gridAnimDone = true
}

// ─── Note todo preview for grid ─────────────────────────
function renderNoteTodoPreview(n) {
  if (!n || !n.todos || !n.todos.length) return ''
  var html = '<div class="grid-item-todos">'
  var shown = 0
  n.todos.forEach(function(t) {
    if (shown >= 3) return
    html += '<div class="grid-item-todo"><span class="todo-check' + (t.done ? ' done' : '') + '"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg></span><span class="todo-text' + (t.done ? ' done' : '') + '">' + (t.text || '') + '</span></div>'
    shown++
  })
  if (n.todos.length > 3) html += '<div style="font-size:9px;color:#8e8e93;padding-top:2px">+' + (n.todos.length - 3) + ' more</div>'
  html += '</div>'
  return html
}

// ─── Grid toggle ──────────────────────────────────────
document.getElementById('gridBtn').addEventListener('click', function () {
  const gv = document.getElementById('gridView')
  if (gv.classList.contains('open')) return
  if (currentNoteId) {
    currentNoteId = null
    document.getElementById('noteView').style.display = 'none'
  }
  this.classList.add('active')
  setView('grid')
  document.getElementById('kiroInput').value = ''
  renderGridView()
})

// ─── Batch actions ─────────────────────────────────────
document.getElementById('batchDelete')?.addEventListener('click', () => {
  if (!selectedGridItems.size || !confirm(`Delete ${selectedGridItems.size} item(s)?`)) return
  for (const id of selectedGridItems) {
    const vs = getVideos(); const bms = getBookmarks(); const notes = getNotes(); const das = getDirectAccess(); const exts = getExternalFiles()
    if (vs[id]) { delete vs[id]; saveVideos(vs); const fs = getFolders(); for (const ids of Object.values(fs)) { const i = ids.indexOf(id); if (i > -1) ids.splice(i, 1) }; saveFolders(fs) }
    const bm = bms.find(b => b.id === id); if (bm) { saveBookmarks(bms.filter(b => b.id !== id)) }
    const n = notes.find(n => n.id === id); if (n) { saveNotes(notes.filter(x => x.id !== id)) }
    const d = das.find(d => d.id === id); if (d) { saveDirectAccess(das.filter(x => x.id !== id)) }
    if (exts.find(x => x.id === id)) { saveExternalFiles(exts.filter(x => x.id !== id)) }
  }
  selectedGridItems.clear(); renderGridView(); renderSidebar()
})
document.getElementById('batchPin')?.addEventListener('click', () => {
  const pins = getPins()
  for (const id of selectedGridItems) { if (!pins.includes(id)) pins.push(id) }
  savePins(pins); selectedGridItems.clear(); renderGridView()
})
document.getElementById('batchBlur')?.addEventListener('click', () => {
  const vs = getVideos()
  for (const id of selectedGridItems) { if (vs[id]) { vs[id].blurred = !vs[id].blurred } }
  saveVideos(vs); selectedGridItems.clear(); renderGridView()
})
document.getElementById('batchMove')?.addEventListener('click', () => {
  const dd = document.getElementById('batchMoveDropdown')
  if (dd.style.display === 'block') { dd.style.display = 'none'; return }
  const folders = Object.keys(getFolders()).filter(n => n !== 'Archived')
  dd.innerHTML = folders.map(f => `<div class="ctx-item" data-folder="${f}"><i data-lucide="folder" class="ctx-icon"></i> ${f}</div>`).join('')
  dd.querySelectorAll('.ctx-item').forEach(el => {
    el.addEventListener('click', () => {
      const target = el.dataset.folder; if (!target) return
      const fs = getFolders(); const exts = getExternalFiles()
      for (const id of selectedGridItems) {
        for (const ids of Object.values(fs)) { const i = ids.indexOf(id); if (i > -1) ids.splice(i, 1) }
        if (!fs[target].includes(id)) fs[target].push(id)
        const ext = exts.find(x => x.id === id)
        if (ext) { ext.folder = target }
      }
      saveFolders(fs); saveExternalFiles(exts)
      selectedGridItems.clear(); dd.style.display = 'none'; renderGridView(); renderSidebar()
    })
  })
  loadIcons(dd); dd.style.display = 'block'
})

// ─── Workbench Actions ────────────────────────────────
document.addEventListener('click', function(e) {
  var btn = e.target.closest('.wb-btn')
  if (!btn) return
  var action = btn.dataset.action
  if (action === 'note') {
    const notes = getNotes()
    const id = '_nt_' + Date.now()
    notes.push({ id, title: 'Untitled', content: '', added: Date.now() })
    saveNotes(notes)
    renderSidebar()
    openNote(id)
    closeSidebarMobile()
    setTimeout(function() { document.getElementById('noteViewTitle')?.focus(); document.getElementById('noteViewTitle')?.select() }, 100)
})

// ─── Progress bar helper ──────────────────────────────
function renderProgressBar(current, target, label) {
  var pct = Math.min(100, (current / Math.max(target, 1)) * 100)
  var displayLabel = label || (current + '/' + target)
  return '<div class="kiro-progress"><div class="kiro-progress-track segmented"><div class="kiro-progress-fill' + (pct >= 100 ? ' glow' : '') + '" style="width:' + pct + '%"></div></div><span class="kiro-progress-text">' + displayLabel + '</span></div>'
}

// ─── Particle burst effect ────────────────────────────
function todoBurst(e) {
  var colors = ['#ffd60a', '#ff9f0a', '#30d158', '#007aff', '#ff375f']
  for (var i = 0; i < 12; i++) {
    var dot = document.createElement('div')
    dot.className = 'kiro-particle'
    var color = colors[i % colors.length]
    var size = 4 + Math.random() * 6
    dot.style.width = size + 'px'
    dot.style.height = size + 'px'
    dot.style.background = color
    dot.style.boxShadow = '0 0 6px ' + color
    dot.style.left = (e.clientX || window.innerWidth / 2) + 'px'
    dot.style.top = (e.clientY || window.innerHeight / 2) + 'px'
    document.body.appendChild(dot)
    var angle = Math.random() * 360
    var dist = 20 + Math.random() * 30
    var dx = Math.cos(angle * Math.PI / 180) * dist
    var dy = Math.sin(angle * Math.PI / 180) * dist
    dot.style.transition = 'transform 0.45s cubic-bezier(0,.8,.5,1), opacity 0.45s ease, box-shadow 0.45s ease'
    requestAnimationFrame(function() {
      dot.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(0)'
      dot.style.opacity = '0'
      dot.style.boxShadow = 'none'
    })
    setTimeout(function() { if (dot.parentNode) dot.parentNode.removeChild(dot) }, 500)
  }
}

function burstParticles(x, y, color) {
  var fakeEvent = { clientX: x, clientY: y }
  todoBurst(fakeEvent)
}
