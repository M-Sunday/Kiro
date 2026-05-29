// ─── Planet View: Solar System for Ideas ──────────────
let planetViewActive = false
let focusedPlanet = null
let planetAnimFrame = null
let planetAngle = 0
let planetScale = 1
let _planetInitScale = 1.35

function getViewport() {
  return document.getElementById('planetViewport') || document.getElementById('planetCanvas')
}

function updatePlanetTransform() {
  var vp = getViewport()
  if (!vp) return
  if (focusedPlanet) {
    var fNode = vp.querySelector('[data-idea-id="' + focusedPlanet + '"]')
    if (!fNode) fNode = vp.querySelector('[data-idea-ids*="' + focusedPlanet + '"]')
    if (fNode && fNode._vx !== undefined) {
      var tx = -(fNode._vx + fNode.offsetWidth / 2)
      var ty = -(fNode._vy + fNode.offsetHeight / 2)
      vp.style.transform = 'translate(' + tx + 'px, ' + ty + 'px) scale(' + planetScale + ')'
      return
    }
  }
  vp.style.transform = 'scale(' + planetScale + ')'
}

const STAGE_ICONS = {
  void: 'sparkle',
  signal: 'radar',
  star_system: 'telescope',
  island: 'moon-star',
  active: 'rocket'
}

const STAGE_COLORS = {
  void: '#8e8e93',
  signal: '#0a84ff',
  star_system: '#bf5af2',
  island: '#30d158',
  active: '#ff453a'
}

function openPlanetView() {
  const pv = document.getElementById('planetView')
  if (!pv) return
  pv.classList.remove('hidden')
  planetViewActive = true
  focusedPlanet = null
  planetScale = 1
  var vp = getViewport()
  if (vp) {
    vp.style.transition = ''
    vp.style.transform = ''
  }
  renderPlanetView()
  startPlanetRotation()
  document.getElementById('planetVoidInput')?.focus()
}

function closePlanetView() {
  const pv = document.getElementById('planetView')
  pv.classList.add('hidden')
  planetViewActive = false
  focusedPlanet = null
  planetScale = 1
  var existing = document.querySelector('.planet-detail')
  if (existing) existing.remove()
  document.querySelectorAll('.planet-node.focused').forEach(function(n) { n.classList.remove('focused') })
  var vp = getViewport()
  if (vp) {
    vp.style.transition = ''
    vp.style.transform = ''
  }
  if (planetAnimFrame) { cancelAnimationFrame(planetAnimFrame); planetAnimFrame = null }
}

function renderPlanetView() {
  const canvas = document.getElementById('planetCanvas')
  const vp = getViewport()
  const orbits = document.getElementById('planetOrbits')
  const sunLabel = document.getElementById('planetSunLabel')
  const name = getUserName()
  sunLabel.textContent = name ? name.charAt(0).toUpperCase() : '✦'

  // clear viewport (keep sun and orbits)
  if (vp) {
    vp.querySelectorAll('.planet-node, .planet-connection, .planet-orbit-ring').forEach(function(el) { el.remove() })
  }

  // build idea list from all sources
  const ideas = collectPlanetIdeas()
  const stages = getVaultStages()
  const connections = getVaultConnections()

  // group by stage
  const grouped = { void: [], signal: [], star_system: [], island: [], active: [] }
  ideas.forEach(function(idea) {
    var stage = stages[idea.id] || 'void'
    if (!grouped[stage]) grouped[stage] = []
    grouped[stage].push(idea)
  })

  var stageOrder = ['void', 'signal', 'star_system', 'island', 'active']

  // detect linked pairs within same stage for merge rendering
  var mergedPairs = []
  var mergedIdSet = new Set()
  stageOrder.forEach(function(stage) {
    var items = grouped[stage]
    if (!items.length) return
    var itemById = {}
    items.forEach(function(i) { itemById[i.id] = i })
    connections.forEach(function(conn) {
      var a = itemById[conn.from], b = itemById[conn.to]
      if (!a || !b) return
      if (mergedIdSet.has(conn.from) || mergedIdSet.has(conn.to)) return
      mergedPairs.push({ ids: [conn.from, conn.to], items: [a, b], stage: stage })
      mergedIdSet.add(conn.from)
      mergedIdSet.add(conn.to)
    })
  })

  var mergedLookup = {}
  mergedPairs.forEach(function(p) {
    p.ids.forEach(function(id) { mergedLookup[id] = p })
  })

  // orbit radii (based on stage index)
  var stageRadii = { void: 80, signal: 130, star_system: 190, island: 260, active: 340 }

  // clear previous orbits and nodes
  var existingOrbits = orbits.querySelectorAll('.planet-orbit, .planet-orbit-ring')
  existingOrbits.forEach(function(el) { el.remove() })
  var oldNodes = canvas.querySelectorAll('.planet-node, .planet-connection, .planet-detail')
  oldNodes.forEach(function(el) { el.remove() })

  // draw visible orbit rings with stage colors
  stageOrder.forEach(function(stage) {
    var r = stageRadii[stage] || 100
    var ring = document.createElement('div')
    ring.className = 'planet-orbit-ring'
    ring.style.width = r * 2 + 'px'
    ring.style.height = r * 2 + 'px'
    ring.style.borderColor = STAGE_COLORS[stage]
    ring.style.borderStyle = 'dashed'
    ring.style.borderWidth = '2px'
    ring.style.opacity = '0.35'
    orbits.appendChild(ring)

    // stage label at the right edge
    var label = document.createElement('div')
    label.style.cssText = 'position:absolute;right:-60px;top:-8px;font-size:9px;font-weight:600;color:' + STAGE_COLORS[stage] + ';opacity:0.5;text-transform:uppercase;letter-spacing:0.5px;pointer-events:none'
    label.textContent = stage.replace('_', ' ')
    ring.appendChild(label)
  })

  // place nodes on their orbits
  var placed = []
  stageOrder.forEach(function(stage) {
    var items = grouped[stage]
    if (!items.length) return
    var radius = stageRadii[stage] || 100
    var count = items.length
    var angleStep = (Math.PI * 2) / Math.max(count, 1)
    var offset = Math.random() * Math.PI * 2

    var stageMerged = mergedPairs.filter(function(p) { return p.stage === stage })
    var mergedIdx = 0
    items.forEach(function(idea, i) {
      if (mergedIdSet.has(idea.id)) return
      var angle = offset + angleStep * i
      var x = Math.cos(angle) * radius
      var y = Math.sin(angle) * radius
      var node = document.createElement('div')
      node.className = 'planet-node stage-' + stage
      node.dataset.ideaId = idea.id
      node.dataset.stage = stage
      node.dataset.baseAngle = angle
      node.dataset.orbitRadius = radius

      var label = idea.title || 'Untitled'
      var shortLabel = label.length > 5 ? label.substring(0, 4) + '…' : label
      node.innerHTML = '<span class="pn-label">' + shortLabel + '</span>'
      node.style.left = 'calc(50% + ' + x + 'px)'
      node.style.top = 'calc(50% + ' + y + 'px)'
      node.style.transform = 'translate(-50%, -50%)'
      node.style.background = STAGE_COLORS[stage]
      node.style.color = '#fff'

      // single click focuses
      node.addEventListener('click', function(e) {
        e.stopPropagation()
        focusPlanet(idea.id)
      })

      vp.appendChild(node)
      placed.push(node)
    })

    // render merged pair nodes for this stage
    stageMerged.forEach(function(pair, pi) {
      var angle = offset + angleStep * (items.length + pi)
      var x = Math.cos(angle) * radius
      var y = Math.sin(angle) * radius
      var node = document.createElement('div')
      node.className = 'planet-node merged'
      node.dataset.ideaIds = pair.ids.join(',')
      node.dataset.stage = stage
      node.dataset.baseAngle = angle
      node.dataset.orbitRadius = radius

      node.innerHTML =
        '<div class="pn-merged-item" style="background:' + STAGE_COLORS[stage] + ';box-shadow:0 0 10px ' + STAGE_COLORS[stage] + '99">' +
          (pair.items[0].title || '?').substring(0, 3) +
        '</div>' +
        '<div class="pn-merged-item" style="background:' + STAGE_COLORS[stage] + ';box-shadow:0 0 10px ' + STAGE_COLORS[stage] + '99">' +
          (pair.items[1].title || '?').substring(0, 3) +
        '</div>'
      node.style.left = 'calc(50% + ' + x + 'px)'
      node.style.top = 'calc(50% + ' + y + 'px)'
      node.style.transform = 'translate(-50%, -50%)'

      node._vx = x
      node._vy = y

      node.addEventListener('click', function(e) {
        e.stopPropagation()
        focusPlanet(pair.ids)
      })

      vp.appendChild(node)
      placed.push(node)
    })
  })

  // draw connection lines between linked ideas
  connections.forEach(function(conn) {
    // skip internal pair connections (ideas already merged)
    var pairA = mergedLookup[conn.from]
    var pairB = mergedLookup[conn.to]
    if (pairA && pairB && pairA === pairB) return

    var fromSingle = vp.querySelector('[data-idea-id="' + conn.from + '"]')
    var toSingle = vp.querySelector('[data-idea-id="' + conn.to + '"]')
    var fromEl = fromSingle || vp.querySelector('[data-idea-ids*="' + conn.from + '"]')
    var toEl = toSingle || vp.querySelector('[data-idea-ids*="' + conn.to + '"]')
    if (!fromEl || !toEl) return
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('class', 'planet-connection')
    svg.setAttribute('data-from', conn.from)
    svg.setAttribute('data-to', conn.to)
    svg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1'
    var line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    var vpRect = vp.getBoundingClientRect()
    var fromRect = fromEl.getBoundingClientRect()
    var toRect = toEl.getBoundingClientRect()
    line.setAttribute('x1', fromRect.left + fromRect.width / 2 - vpRect.left)
    line.setAttribute('y1', fromRect.top + fromRect.height / 2 - vpRect.top)
    line.setAttribute('x2', toRect.left + toRect.width / 2 - vpRect.left)
    line.setAttribute('y2', toRect.top + toRect.height / 2 - vpRect.top)
    line.setAttribute('stroke', 'rgba(191, 90, 242, 0.25)')
    line.setAttribute('stroke-width', '2')
    line.setAttribute('stroke-dasharray', '5 4')
    svg.appendChild(line)
    vp.appendChild(svg)
  })

  // click empty space to unfocus
  canvas.addEventListener('click', function(e) {
    if (e.target === canvas || e.target === vp || e.target === orbits) unfocusPlanet()
  })

  // focus the void input
  document.getElementById('planetVoidInput')?.focus()
}

function focusPlanet(ideaId) {
  var ids = Array.isArray(ideaId) ? ideaId : [ideaId]
  var isMerged = ids.length > 1
  focusedPlanet = ids[0]
  document.querySelectorAll('.planet-node').forEach(function(n) { n.classList.remove('focused') })

  var node
  if (isMerged) {
    node = document.querySelector('[data-idea-ids*="' + ids[0] + '"]')
  } else {
    node = document.querySelector('[data-idea-id="' + ids[0] + '"]')
  }
  if (node) node.classList.add('focused')

  var vp = getViewport()
  if (vp && node) {
    vp.style.transition = 'none'
    planetScale = _planetInitScale
    updatePlanetTransform()
  }

  var allIdeas = collectPlanetIdeas()
  var ideas = ids.map(function(id) { return allIdeas.find(function(i) { return i.id === id }) }).filter(Boolean)
  if (!ideas.length) return

  var stages = getVaultStages()
  var connections = getVaultConnections()

  var existing = document.querySelector('.planet-detail')
  if (existing) existing.remove()

  var detail = document.createElement('div')
  detail.className = 'planet-detail open'

  if (isMerged && ideas.length === 2) {
    var stage = stages[ideas[0].id] || 'void'
    var connCount = connections.filter(function(c) {
      return ids.indexOf(c.from) !== -1 || ids.indexOf(c.to) !== -1
    }).length
    detail.innerHTML =
      '<div class="planet-detail-title">' + escapeHtml(ideas[0].title || 'Untitled') + ' + ' + escapeHtml(ideas[1].title || 'Untitled') + '</div>' +
      '<div class="planet-detail-meta">✦ Merged Pair — Stage: ' + stage.replace('_', ' ') + ' — ' + connCount + ' connection' + (connCount !== 1 ? 's' : '') + '</div>' +
      ideas.map(function(idea, idx) {
        var iid = ids[idx]
        var st = stages[iid] || 'void'
        return '<div class="planet-detail-meta" style="font-size:10px;display:flex;justify-content:space-between;align-items:center">' +
          '<span>' + escapeHtml(idea.title || 'Untitled') + ' — ' + st.replace('_', ' ') + '</span>' +
          '<span style="font-size:9px;opacity:0.5">' + new Date(idea.created || Date.now()).toLocaleDateString() + '</span>' +
        '</div>'
      }).join('') +
      '<div class="planet-detail-actions">' +
        '<button class="pd-promote" id="pdMergedPromote"><i data-lucide="arrow-up" style="width:12px;height:12px"></i> Promote Both</button>' +
        '<button class="pd-demote" id="pdMergedDemote"><i data-lucide="arrow-down" style="width:12px;height:12px"></i> Demote Both</button>' +
        '<button id="pdMergedUnlink" style="color:#ff9f0a"><i data-lucide="unlink" style="width:12px;height:12px"></i> Unlink</button>' +
        '<button id="pdMergedDelete" style="color:#ff453a"><i data-lucide="trash-2" style="width:12px;height:12px"></i> Delete Pair</button>' +
      '</div>'

    document.getElementById('planetView').appendChild(detail)
    var footer = document.querySelector('.planet-view-footer')
    if (footer) detail.style.bottom = footer.offsetHeight + 'px'

    document.getElementById('pdMergedPromote')?.addEventListener('click', function() {
      ids.forEach(function(id) { promoteIdea(id) })
      var fakeEvent = { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 }
      todoBurst(fakeEvent)
      checkAchievements()
      renderPlanetView()
    })
    document.getElementById('pdMergedDemote')?.addEventListener('click', function() {
      ids.forEach(function(id) { demoteIdea(id) })
      renderPlanetView()
    })
    document.getElementById('pdMergedUnlink')?.addEventListener('click', function() {
      var conns = getVaultConnections()
      saveVaultConnections(conns.filter(function(c) {
        return !(ids.indexOf(c.from) !== -1 && ids.indexOf(c.to) !== -1)
      }))
      renderPlanetView()
    })
    document.getElementById('pdMergedDelete')?.addEventListener('click', function() {
      if (!confirm('Delete both ideas and their connections?')) return
      unfocusPlanet()
      var all = getVaultIdeas()
      saveVaultIdeas(all.filter(function(i) { return ids.indexOf(i.id) === -1 }))
      var sts = getVaultStages()
      ids.forEach(function(id) { delete sts[id] })
      saveVaultStages(sts)
      var conns = getVaultConnections()
      saveVaultConnections(conns.filter(function(c) { return ids.indexOf(c.from) === -1 && ids.indexOf(c.to) === -1 }))
      renderPlanetView()
    })
  } else {
    var idea = ideas[0]
    var sid = ids[0]
    var stage = stages[sid] || 'void'
    var connCount = connections.filter(function(c) { return c.from === sid || c.to === sid }).length
    detail.innerHTML =
      '<div class="planet-detail-title">' + escapeHtml(idea.title || 'Untitled') + '</div>' +
      '<div class="planet-detail-meta">Stage: ' + stage.replace('_', ' ') + ' — ' + connCount + ' connection' + (connCount !== 1 ? 's' : '') + '</div>' +
      '<div class="planet-detail-meta" style="font-size:10px">Created ' + new Date(idea.created || Date.now()).toLocaleDateString() + '</div>' +
      '<div class="planet-detail-actions">' +
        '<button class="pd-promote" id="pdPromote"><i data-lucide="arrow-up" style="width:12px;height:12px"></i> Promote</button>' +
        '<button class="pd-demote" id="pdDemote"><i data-lucide="arrow-down" style="width:12px;height:12px"></i> Demote</button>' +
        '<button id="pdRename"><i data-lucide="edit-3" style="width:12px;height:12px"></i> Rename</button>' +
        '<button id="pdDelete" style="color:#ff453a"><i data-lucide="trash-2" style="width:12px;height:12px"></i> Delete</button>' +
      '</div>'

    document.getElementById('planetView').appendChild(detail)
    var footer = document.querySelector('.planet-view-footer')
    if (footer) detail.style.bottom = footer.offsetHeight + 'px'

    document.getElementById('pdPromote')?.addEventListener('click', function() {
      promoteIdea(sid)
      var fakeEvent = { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 }
      todoBurst(fakeEvent)
      checkAchievements()
      renderPlanetView()
    })
    document.getElementById('pdDemote')?.addEventListener('click', function() {
      demoteIdea(sid)
      var conns = getVaultConnections()
      var hadConn = conns.some(function(c) { return c.from === sid || c.to === sid })
      if (hadConn) {
        saveVaultConnections(conns.filter(function(c) { return c.from !== sid && c.to !== sid }))
      }
      renderPlanetView()
    })
    document.getElementById('pdRename')?.addEventListener('click', function() {
      var newName = prompt('Rename idea:', idea.title || '')
      if (newName && newName.trim()) {
        var all = getVaultIdeas()
        var found = all.find(function(i) { return i.id === sid })
        if (found) { found.title = newName.trim(); found.updated = Date.now(); saveVaultIdeas(all) }
        renderPlanetView()
      }
    })
    document.getElementById('pdDelete')?.addEventListener('click', function() {
      if (!confirm('Delete this idea?')) return
      unfocusPlanet()
      var all = getVaultIdeas()
      saveVaultIdeas(all.filter(function(i) { return i.id !== sid }))
      var sts = getVaultStages()
      delete sts[sid]; saveVaultStages(sts)
      var conns = getVaultConnections()
      saveVaultConnections(conns.filter(function(c) { return c.from !== sid && c.to !== sid }))
      renderPlanetView()
    })
  }

  loadIcons(detail)
}

function zoomPlanet(factor) {
  var vp = getViewport()
  if (!vp) return
  planetScale = Math.max(0.15, Math.min(5, planetScale * factor))
  vp.style.transition = 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)'
  updatePlanetTransform()
  setTimeout(function() { vp.style.transition = '' }, 400)
}

function resetPlanetZoom() {
  var vp = getViewport()
  if (!vp) return
  planetScale = 1
  vp.style.transition = 'transform 0.3s ease'
  updatePlanetTransform()
  setTimeout(function() { vp.style.transition = '' }, 300)
}

function unfocusPlanet() {
  focusedPlanet = null
  var existing = document.querySelector('.planet-detail')
  if (existing) existing.remove()
  document.querySelectorAll('.planet-node.focused').forEach(function(n) { n.classList.remove('focused') })
  var vp = getViewport()
  if (vp) {
    vp.style.transition = ''
    updatePlanetTransform()
  }
}

function startPlanetRotation() {
  if (planetAnimFrame) cancelAnimationFrame(planetAnimFrame)
  function frame() {
    if (!planetViewActive) return
    planetAngle += 0.0012
    var nodes = document.querySelectorAll('.planet-node')
    var canvas = document.getElementById('planetCanvas')
    if (!canvas) { planetAnimFrame = requestAnimationFrame(frame); return }

    nodes.forEach(function(node) {
      var baseAngle = parseFloat(node.dataset.baseAngle) || 0
      var radius = parseFloat(node.dataset.orbitRadius) || 100
      var angle = baseAngle + planetAngle
      var x = Math.cos(angle) * radius
      var y = Math.sin(angle) * radius
      node.style.left = 'calc(50% + ' + x + 'px)'
      node.style.top = 'calc(50% + ' + y + 'px)'
      node._vx = x
      node._vy = y
    })

    // update connection line positions
    var vp = getViewport()
    if (vp) {
      var vpRect = vp.getBoundingClientRect()
      vp.querySelectorAll('.planet-connection').forEach(function(svg) {
        var line = svg.querySelector('line')
        if (!line) return
        var fromId = svg.getAttribute('data-from')
        var toId = svg.getAttribute('data-to')
        var fromEl = vp.querySelector('[data-idea-id="' + fromId + '"]')
        if (!fromEl) fromEl = vp.querySelector('[data-idea-ids*="' + fromId + '"]')
        var toEl = vp.querySelector('[data-idea-id="' + toId + '"]')
        if (!toEl) toEl = vp.querySelector('[data-idea-ids*="' + toId + '"]')
        if (fromEl && toEl) {
          var fRect = fromEl.getBoundingClientRect()
          var tRect = toEl.getBoundingClientRect()
          line.setAttribute('x1', fRect.left + fRect.width / 2 - vpRect.left)
          line.setAttribute('y1', fRect.top + fRect.height / 2 - vpRect.top)
          line.setAttribute('x2', tRect.left + tRect.width / 2 - vpRect.left)
          line.setAttribute('y2', tRect.top + tRect.height / 2 - vpRect.top)
        }
      })

      // follow focused node with camera (center on screen)
      if (focusedPlanet) updatePlanetTransform()
    }

    planetAnimFrame = requestAnimationFrame(frame)
  }
  planetAnimFrame = requestAnimationFrame(frame)
}

function collectPlanetIdeas() {
  var result = []
  var seen = new Set()

  getVaultIdeas().forEach(function(i) { if (!seen.has(i.id)) { seen.add(i.id); result.push(i) } })

  var videos = getVideos()
  Object.keys(videos).forEach(function(id) {
    if (!seen.has(id)) {
      seen.add(id)
      result.push({ id: id, title: videos[id].title, type: 'video', source: 'youtube', created: videos[id].added })
    }
  })
  var notes = getNotes()
  notes.forEach(function(n) {
    if (!seen.has(n.id) && !n.id.startsWith('_nt_')) {
      seen.add(n.id)
      result.push({ id: n.id, title: n.title || 'Untitled Note', type: 'note', source: 'notes', created: n.added })
    }
  })

  return result
}

function linkIdeas(fromId, toId) {
  if (fromId === toId) return
  var connections = getVaultConnections()
  var exists = connections.some(function(c) {
    return (c.from === fromId && c.to === toId) || (c.from === toId && c.to === fromId)
  })
  if (exists) return
  connections.push({ from: fromId, to: toId, created: Date.now() })
  saveVaultConnections(connections)

  var stages = getVaultStages()
  ;[fromId, toId].forEach(function(id) {
    var s = stages[id] || 'void'
    if (s === 'void' || s === 'signal') stages[id] = 'star_system'
  })
  saveVaultStages(stages)

  checkAchievements()
  var fakeEvent = { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 }
  todoBurst(fakeEvent)
}

function addIdeaToVoid() {
  var input = document.getElementById('planetVoidInput')
  if (!input) return
  var title = input.value.trim()
  if (!title) { input.focus(); return }
  createVaultIdea(title, 'note', 'planet-view')
  input.value = ''
  input.focus()
  checkAchievements()
  renderPlanetView()
  var canvas = document.getElementById('planetCanvas')
  var rect = canvas.getBoundingClientRect()
  var fakeEvent = { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 }
  todoBurst(fakeEvent)
}

// ─── Particles — exactly like todo checkboxes ─────────
function todoBurst(e) {
  var colors = ['#007aff','#ff453a','#ffd60a','#30d158','#ff9f0a','#bf5af2']
  for (let p = 0; p < 12; p++) {
    let dot = document.createElement('div')
    let size = 3 + Math.random() * 5
    let color = colors[Math.floor(Math.random() * colors.length)]
    dot.className = 'todo-particle'
    dot.style.cssText = 'position:fixed;width:' + size + 'px;height:' + size + 'px;border-radius:50%;background:' + color + ';pointer-events:none;z-index:99999;left:' + (e.clientX - size/2) + 'px;top:' + (e.clientY - size/2) + 'px;box-shadow:0 0 ' + (size * 2) + 'px ' + color
    document.body.appendChild(dot)
    let angle = Math.random() * 360
    let dist = 20 + Math.random() * 30
    let dx = Math.cos(angle * Math.PI / 180) * dist
    let dy = Math.sin(angle * Math.PI / 180) * dist
    dot.style.transition = 'transform 0.45s cubic-bezier(0,.8,.5,1), opacity 0.45s ease, box-shadow 0.45s ease'
    requestAnimationFrame(function() {
      dot.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(0)'
      dot.style.opacity = '0'
      dot.style.boxShadow = 'none'
    })
    setTimeout(function() { if (dot.parentNode) dot.parentNode.removeChild(dot) }, 500)
  }
}

// backward-compatible alias used by grid.js
function burstParticles(x, y, color) {
  var fakeEvent = { clientX: x, clientY: y }
  todoBurst(fakeEvent)
}

// ─── Event wiring ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('planetViewBack')?.addEventListener('click', closePlanetView)
  document.getElementById('planetAddBtn')?.addEventListener('click', addIdeaToVoid)
  document.getElementById('planetVoidInput')?.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') { e.preventDefault(); addIdeaToVoid() }
  })
  document.getElementById('planetZoomIn')?.addEventListener('click', function() { zoomPlanet(1.25) })
  document.getElementById('planetZoomOut')?.addEventListener('click', function() { zoomPlanet(0.8) })
  document.getElementById('planetZoomReset')?.addEventListener('click', resetPlanetZoom)

  document.addEventListener('click', function(e) {
    var btn = e.target.closest('.wb-btn[data-action="planet"]')
    if (btn) openPlanetView()
  })

  var canvas = document.getElementById('planetCanvas')
  if (canvas) {
    var _touchDist = 0
    canvas.addEventListener('wheel', function(e) {
      e.preventDefault()
      var vp = getViewport()
      if (!vp) return
      var dir = e.deltaY > 0 ? -1 : 1
      var step = 0.12 * (1 + Math.abs(planetScale - 1) * 0.3)
      planetScale = Math.max(0.15, Math.min(5, planetScale + dir * step))
      vp.style.transition = 'none'
      updatePlanetTransform()
    }, { passive: false })

    canvas.addEventListener('touchstart', function(e) {
      if (e.touches.length === 2) {
        var t = e.touches
        _touchDist = Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)
      }
    }, { passive: true })

    canvas.addEventListener('touchmove', function(e) {
      if (e.touches.length === 2 && _touchDist > 0) {
        e.preventDefault()
        var vp = getViewport()
        if (!vp) return
        var t = e.touches
        var newDist = Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY)
        planetScale = Math.max(0.15, Math.min(5, planetScale * (newDist / _touchDist)))
        _touchDist = newDist
        vp.style.transition = 'none'
        updatePlanetTransform()
      }
    }, { passive: false })

    canvas.addEventListener('touchend', function() { _touchDist = 0 }, { passive: true })
  }
})

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && planetViewActive && !focusedPlanet) closePlanetView()
  if (e.key === 'Escape' && planetViewActive && focusedPlanet) unfocusPlanet()
})
