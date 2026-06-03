export class ExtrasService {
  constructor(appVersion) {
    this._appVersion = appVersion || '3.1.0'
    this._debugOn = false
    this._debugHierarchy = false
    this._listenersActive = false
    this._debugOverlay = null
    this._debugLabel = null
    this._hierarchyPanel = null
    this._debugTarget = null
    this._lockedEl = null
    this._debugColorCache = new Map()
    this._DEBUG_PALETTE = [
      '#ff453a', '#ff9f0a', '#ffd60a', '#30d158', '#0a84ff',
      '#bf5af2', '#ff375f', '#64d2ff', '#ff6482', '#5e5ce6',
      '#ff6b6b', '#ffb340', '#00c7be', '#66d9e8', '#a284f0'
    ]
  }

  init() {
    this._bindKeyboardShortcuts()
    this._initServiceWorker()
    this._initOnlineStatus()
    this._initHistoryImport()
    this._initUpdateCheck()
    this._initDebugMode()
  }

  _bindKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'L') {
        e.preventDefault()
        document.getElementById('kiroInput')?.focus()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '=') {
        e.preventDefault()
        document.getElementById('cardAddBtn')?.click()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault()
        document.getElementById('settingsOverlay')?.classList.add('open')
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault()
        document.getElementById('searchInput')?.focus()
      }
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        e.preventDefault()
        document.getElementById('searchInput')?.focus()
      }
      if (e.key === '?' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        e.preventDefault()
        const overlay = document.getElementById('shortcutsOverlay')
        if (overlay) {
          overlay.style.display = overlay.style.display === 'none' ? 'flex' : 'none'
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault()
        this._toggleDebug()
      }
    })

    document.getElementById('shortcutsClose')?.addEventListener('click', () => {
      const overlay = document.getElementById('shortcutsOverlay')
      if (overlay) overlay.style.display = 'none'
    })

    document.getElementById('shortcutsOverlay')?.addEventListener('click', (e) => {
      if (e.target === document.getElementById('shortcutsOverlay')) {
        e.target.style.display = 'none'
      }
    })
  }

  _initServiceWorker() {
    if ('serviceWorker' in navigator) {
      let _swReg = null
      navigator.serviceWorker.register('sw.js').then(reg => {
        _swReg = reg
        const applyUpdate = (sw) => {
          if (window.showSplashForUpdate) window.showSplashForUpdate()
          sw.postMessage({ action: 'skipWaiting' })
        }
        if (reg.waiting && navigator.serviceWorker.controller) applyUpdate(reg.waiting)
        reg.addEventListener('updatefound', () => {
          const sw = reg.installing || reg.waiting
          if (!sw) return
          sw.addEventListener('statechange', () => {
            if (sw.state === 'installed' && navigator.serviceWorker.controller) applyUpdate(sw)
          })
        })
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible' && _swReg) _swReg.update()
        })
      })
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        try { localStorage.setItem('kiroSwVersion', this._appVersion) } catch {}
        window.location.reload()
      })
    }
  }

  _initOnlineStatus() {
    const title = document.getElementById('searchLandingTitle')
    const searchInput = document.getElementById('kiroInput')
    const searchBtn = document.getElementById('kiroBtn')
    const PLACEHOLDER_TEXTS = ['Search online', 'Look up a video', 'Find a link']
    let placeholderIdx = 0

    const update = () => {
      const on = navigator.onLine
      if (title) {
        if (!on) { title.textContent = "You're offline"; title.classList.add('offline') }
        else { title.textContent = 'What do you want to search?'; title.classList.remove('offline') }
      }
      if (searchInput) {
        searchInput.disabled = !on
        if (on) {
          searchInput.placeholder = PLACEHOLDER_TEXTS[placeholderIdx % PLACEHOLDER_TEXTS.length]
        } else {
          searchInput.placeholder = 'Search unavailable offline'
        }
      }
      if (searchBtn) searchBtn.disabled = !on
    }

    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    if (navigator.connection) navigator.connection.addEventListener('change', update)
    update()
    setInterval(() => {
      placeholderIdx++
      if (navigator.onLine && searchInput) {
        searchInput.placeholder = PLACEHOLDER_TEXTS[placeholderIdx % PLACEHOLDER_TEXTS.length]
      }
    }, 180000)
  }

  _initHistoryImport() {
    let history = []
    try { history = JSON.parse(localStorage.getItem('linkHistory') || '[]') } catch { history = [] }
    if (history.length) {
      const vs = window.getVideos?.() || {}
      const fs = window.getFolders?.() || {}
      for (const h of history) {
        if (!vs[h.id]) vs[h.id] = { title: h.title, channel: h.channel, duration: '', added: Date.now() }
      }
      if (window.saveVideos) window.saveVideos(vs)
      if (!fs['Videos']) fs['Videos'] = []
      for (const h of history) {
        if (!fs['Videos'].includes(h.id)) fs['Videos'].push(h.id)
      }
      if (window.saveFolders) window.saveFolders(fs)
      if (window.renderSidebar) window.renderSidebar()
    }
  }

  _initUpdateCheck() {
    const lastSeen = localStorage.getItem('kiroLastVersion')
    if (lastSeen !== this._appVersion) {
      fetch('assets/changelog.json').then(r => r.json()).then(log => {
        const updates = log.filter(e => {
          if (!lastSeen) return e.version === this._appVersion
          const v = e.version.split('.').map(Number)
          const last = lastSeen.split('.').map(Number)
          return v[0] > last[0] || v[1] > last[1]
        })

        // Cancel inline splash timers ("Up to date" / "Welcome" / dismiss)
        if (window.__splashTimers) {
          window.__splashTimers.forEach(clearTimeout)
          window.__splashTimers = []
        }

        // Animate splash on any version change
        const splash = document.getElementById('splash')
        const splashText = document.getElementById('splashText')
        if (splash && splashText && splash.style.display !== 'none') {
          window.__splashBlockDismiss = true
          splash.classList.add('info-bg')
          splashText.style.display = 'block'
          splashText.textContent = 'Updating...'
          setTimeout(() => {
            splashText.textContent = 'Welcome, ' + (localStorage.getItem('kiroUserName') || '')
            setTimeout(() => {
              window.__splashBlockDismiss = false
              splash.classList.add('fade')
              setTimeout(() => { splash.style.display = 'none' }, 500)
            }, 1500)
          }, 2000)
        }

        // Show changelog overlay after splash animation (only if actual updates)
        if (updates.length) {
          setTimeout(() => {
            const el = document.getElementById('updateBody')
            if (!el) return
            el.innerHTML = updates.map(u => `
              <div class="update-version">${u.version} \u2014 ${u.date}</div>
              <div class="update-title">${u.title}</div>
              <ul class="update-changes">${u.changes.map(c => '<li>' + c + '</li>').join('')}</ul>
            `).join('')
            document.getElementById('updateOverlay')?.classList.add('open')
          }, 4500)
        }
      }).catch(() => {})
      try { localStorage.setItem('kiroLastVersion', this._appVersion) } catch {}
    }
    document.getElementById('updateCloseBtn')?.addEventListener('click', () => {
      document.getElementById('updateOverlay')?.classList.remove('open')
    })
  }

  _initDebugMode() {
    const verEl = document.getElementById('appVersionLabel')
    if (!verEl) return
    let taps = []
    let tapTimer
    verEl.addEventListener('click', () => {
      const now = Date.now()
      taps.push(now)
      if (tapTimer) clearTimeout(tapTimer)
      tapTimer = setTimeout(() => {
        if (taps.length >= 5) {
          taps = []
          const existingPane = document.getElementById('pane-debug')
          const existingCat = document.querySelector('.settings-cat[data-cat="debug"]')
          if (existingPane && existingCat) {
            if (existingPane.style.display !== 'none') {
              existingPane.style.display = 'none'
              existingCat.remove()
            } else {
              const aboutCat = document.querySelector('.settings-cat[data-cat="about"]')
              if (aboutCat) aboutCat.click()
            }
          } else {
            this._showDebugUnlocked()
          }
        }
        taps = []
      }, 800)
    })
  }

  _showDebugUnlocked() {
    const sidebar = document.querySelector('.settings-categories')
    if (!sidebar) return
    const cat = document.createElement('div')
    cat.className = 'settings-cat'
    cat.dataset.cat = 'debug'
    cat.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg> Debug'
    sidebar.appendChild(cat)

    const content = document.getElementById('settingsContent')
    const pane = document.createElement('div')
    pane.className = 'settings-pane'
    pane.id = 'pane-debug'
    pane.style.display = 'none'
    pane.innerHTML =
      '<div class="settings-pane-header"><h2>Debug</h2><p class="settings-pane-desc">Inspect the app\'s inner workings.</p></div>' +
      '<div class="settings-plugin-list" style="margin-top:20px">' +
        '<div class="settings-plugin"><span class="settings-plugin-name">Inspect mode (hover)</span><div class="settings-toggle" id="debugInspectToggle"></div></div>' +
        '<div class="settings-plugin"><span class="settings-plugin-name">Hierarchy mode</span><div class="settings-toggle" id="debugHierarchyToggle"></div></div>' +
      '</div>' +
      '<div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--border-color,#e8e8ed)">' +
        '<button class="settings-danger-btn" id="debugNotchBtn" style="margin-bottom:10px">Show notch area</button>' +
        '<div style="font-size:11px;color:#8e8e93;line-height:1.5" id="debugInfo"></div>' +
      '</div>'
    content?.appendChild(pane)

    cat.addEventListener('click', () => {
      document.querySelectorAll('.settings-cat').forEach(c => c.classList.remove('active'))
      cat.classList.add('active')
      document.querySelectorAll('.settings-pane').forEach(p => p.style.display = 'none')
      pane.style.display = 'block'
      this._updateDebugInfo()
    })

    document.getElementById('debugInspectToggle')?.addEventListener('click', () => {
      this._toggleDebug()
    })
    document.getElementById('debugHierarchyToggle')?.addEventListener('click', () => {
      this._toggleDebugHierarchy()
    })
    document.getElementById('debugNotchBtn')?.addEventListener('click', () => {
      const nd = document.createElement('div')
      nd.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:999999;background:#ff453a;color:#fff;font:12px monospace;text-align:center;padding:4px;pointer-events:none;opacity:0.85'
      const safeTop = getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-top)').trim() || '0px'
      nd.textContent = 'NOTCH AREA  |  viewport: ' + window.innerWidth + '\u00d7' + window.innerHeight + '  |  safe-top: ' + safeTop
      document.body.appendChild(nd)
      const nd2 = document.createElement('div')
      nd2.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:999998;background:rgba(255,69,58,0.12);pointer-events:none;height:' + Math.max(window.innerHeight * 0.08, 40) + 'px'
      document.body.appendChild(nd2)
      setTimeout(() => { nd.remove(); nd2.remove() }, 5000)
    })

    cat.click()
  }

  _updateDebugInfo() {
    const el = document.getElementById('debugInfo')
    if (!el) return
    const isCap = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform())
    el.innerHTML =
      'Viewport: ' + window.innerWidth + '\u00d7' + window.innerHeight + '<br>' +
      'Safe area top: ' + (getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-top)').trim() || '0px') + '<br>' +
      'Platform: ' + (isCap ? 'Capacitor' : navigator.standalone ? 'PWA' : 'Browser') + '<br>' +
      'Online: ' + (navigator.onLine ? 'Yes' : 'No') + '<br>' +
      'Theme: ' + (document.body.className.match(/theme-(\w+)/)?.[1] || 'default')
  }

  _ensureDebugEls() {
    if (!this._debugOverlay) {
      this._debugOverlay = document.createElement('div')
      this._debugOverlay.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;pointer-events:none;z-index:99999;border:2px solid #ff453a;border-radius:4px;transition:all 0.05s;display:none'
      document.body.appendChild(this._debugOverlay)
    }
    if (!this._debugLabel) {
      this._debugLabel = document.createElement('div')
      this._debugLabel.style.cssText = 'position:fixed;pointer-events:none;z-index:100000;font-size:10px;font-family:monospace;background:#ff453a;color:#fff;padding:2px 6px;border-radius:4px;line-height:1.4;display:none'
      document.body.appendChild(this._debugLabel)
    }
    if (!this._hierarchyPanel) {
      this._hierarchyPanel = document.createElement('div')
      this._hierarchyPanel.style.cssText = 'position:fixed;top:0;right:0;width:260px;height:100vh;z-index:100002;font-family:monospace;background:rgba(20,20,20,0.97);color:#fff;display:none;overflow-y:auto;border-left:1px solid rgba(255,255,255,0.08)'
      document.body.appendChild(this._hierarchyPanel)
    }
  }

  _showBadge(text) {
    let b = document.getElementById('__debug-badge')
    if (!b) {
      b = document.createElement('div')
      b.id = '__debug-badge'
      b.style.cssText = 'position:fixed;bottom:12px;right:12px;z-index:100001;font-size:11px;font-family:monospace;background:#ff453a;color:#fff;padding:4px 10px;border-radius:6px;line-height:1.3;pointer-events:none;opacity:0.9'
      document.body.appendChild(b)
    }
    b.textContent = text
  }

  _hashColor(str) {
    let h = 0
    for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h)
    return this._DEBUG_PALETTE[Math.abs(h) % this._DEBUG_PALETTE.length]
  }

  _colorForEl(el) {
    const label = this._debugLabelFor(el)
    let color = this._debugColorCache.get(label)
    if (!color) { color = this._hashColor(label); this._debugColorCache.set(label, color) }
    return color
  }

  _debugLabelFor(el) {
    let titles = []
    const tag = el.tagName.toLowerCase()
    const id = el.id
    const classes = el.className && typeof el.className === 'string'
      ? el.className.split(' ').filter(c => c && !c.startsWith('__')).join('.') : ''
    const titleAttr = el.getAttribute('title')
    const placeholder = el.getAttribute('placeholder')
    const text = el.textContent && tag !== 'body' ? el.textContent.trim().substring(0, 40) : ''
    if (id) titles.push('#' + id)
    if (titleAttr) titles.push(titleAttr.substring(0, 40))
    if (placeholder) titles.push('[' + placeholder.substring(0, 30) + ']')
    if (!id && !titleAttr) {
      const dataKeys = ['video-id', 'bookmark-id', 'note-id', 'da-id', 'folder', 'action', 'theme', 'cat']
      for (const k of dataKeys) {
        const v = el.dataset[k]
        if (v) { titles.push(v.length > 25 ? v.substring(0, 25) + '\u2026' : v); break }
      }
    }
    if (!titles.length && text.length < 50 && text.length > 0) titles.push(text)
    if (titles.length) return titles.join(' | ')
    if (classes) return tag + '.' + classes
    return tag
  }

  _getElementHierarchy(el) {
    const path = []
    let current = el
    while (current && current !== document.body) {
      let part = current.tagName.toLowerCase()
      if (current.id) part += '#' + current.id
      if (current.className && typeof current.className === 'string') {
        const classes = current.className.split(' ').filter(c => c && !c.startsWith('__'))
        if (classes.length) part += '.' + classes.slice(0, 2).join('.')
      }
      path.unshift(part)
      current = current.parentElement
    }
    return path.length > 6 ? '... ' + path.slice(-5).join(' > ') : path.join(' > ')
  }

  _showDebug(el, e) {
    this._ensureDebugEls()
    const rect = el.getBoundingClientRect()
    const label = this._debugLabelFor(el)
    const displayName = label || el.tagName.toLowerCase()
    const color = this._colorForEl(el)

    if (this._debugOverlay) {
      this._debugOverlay.style.cssText = 'position:fixed;top:' + rect.top + 'px;left:' + rect.left + 'px;width:' + rect.width + 'px;height:' + rect.height + 'px;pointer-events:none;z-index:99999;border:2px solid ' + color + ';border-radius:4px;background:' + color + '22;display:block'
    }
    if (this._debugLabel) {
      this._debugLabel.textContent = displayName + ' \u2014 ' + el.tagName.toLowerCase()
      this._debugLabel.style.background = color
      const lx = Math.min(e.clientX + 12, window.innerWidth - this._debugLabel.offsetWidth - 8)
      const ly = Math.max(e.clientY - this._debugLabel.offsetHeight - 8, 4)
      this._debugLabel.style.display = 'block'
      this._debugLabel.style.left = lx + 'px'
      this._debugLabel.style.top = ly + 'px'
    }
  }

  _updateHierarchyPanel(el, color) {
    if (!this._hierarchyPanel || !this._debugHierarchy) return
    const hierarchy = this._getElementHierarchy(el)
    const parts = hierarchy.split(' > ')
    this._hierarchyPanel.innerHTML = `
      <div style="padding:16px;padding-bottom:60px">
        <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;opacity:0.4;margin-bottom:12px">Ancestry</div>
        ${parts.map((p, i) => '<div style="padding:3px 0;padding-left:' + (i * 14) + 'px;border-left:2px solid ' + (i === parts.length - 1 ? color : 'rgba(255,255,255,0.08)') + ';margin-bottom:1px;font-size:11px;' + (i === parts.length - 1 ? 'color:' + color + ';font-weight:600' : 'opacity:0.7') + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + p + '</div>').join('')}
        <div style="margin-top:12px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.08);font-size:10px;color:' + color + '">Click element to lock</div>
      </div>
    `
    this._hierarchyPanel.style.display = 'block'
  }

  _hideDebug() {
    if (this._debugOverlay) this._debugOverlay.style.display = 'none'
    if (this._debugLabel) this._debugLabel.style.display = 'none'
    if (this._hierarchyPanel) this._hierarchyPanel.style.display = 'none'
  }

  _clearDebugState() {
    this._hideDebug()
    const badge = document.getElementById('__debug-badge')
    if (badge) badge.remove()
    document.querySelectorAll('[data-debug-locked]').forEach(el => {
      el.style.outline = ''
      el.style.outlineOffset = ''
      delete el.dataset.debugLocked
    })
    this._debugTarget = null
    this._lockedEl = null
  }

  _toggleDebug() {
    if (this._debugHierarchy) {
      this._debugHierarchy = false
      if (this._hierarchyPanel) this._hierarchyPanel.style.display = 'none'
      this._hideDebug()
    }
    this._debugOn = !this._debugOn
    if (this._debugOn) {
      this._ensureListeners()
      this._ensureDebugEls()
      this._showBadge('Inspect active \u2014 Esc to exit')
    } else {
      this._hideDebug()
      this._removeListeners()
      this._clearDebugState()
    }
  }

  _toggleDebugHierarchy() {
    if (this._debugOn) {
      this._debugOn = false
      this._hideDebug()
    }
    this._debugHierarchy = !this._debugHierarchy
    if (this._debugHierarchy) {
      this._ensureListeners()
      this._ensureDebugEls()
      if (this._hierarchyPanel) this._hierarchyPanel.style.display = 'block'
      this._showBadge('Hierarchy \u2014 Esc to exit')
      if (this._debugTarget) this._updateHierarchyPanel(this._lockedEl || this._debugTarget, this._colorForEl(this._lockedEl || this._debugTarget))
    } else {
      if (this._hierarchyPanel) this._hierarchyPanel.style.display = 'none'
      this._removeListeners()
      this._clearDebugState()
    }
  }

  _ensureListeners() {
    if (this._listenersActive) return
    document.addEventListener('mousemove', (e) => this._onDebugMove(e))
    document.addEventListener('click', (e) => this._onDebugClick(e))
    document.addEventListener('keydown', (e) => this._onDebugKey(e))
    document.body.style.cursor = 'crosshair'
    this._listenersActive = true
  }

  _removeListeners() {
    if (!this._listenersActive) return
    document.removeEventListener('mousemove', (e) => this._onDebugMove(e))
    document.removeEventListener('click', (e) => this._onDebugClick(e))
    document.removeEventListener('keydown', (e) => this._onDebugKey(e))
    document.body.style.cursor = ''
    this._listenersActive = false
  }

  _onDebugMove(e) {
    const el = document.elementFromPoint(e.clientX, e.clientY)
    if (!el || el === this._debugTarget || el.closest('.__debug-overlay,.__debug-label,.__debug-hierarchy')) return
    this._debugTarget = el
    if (this._debugOn) this._showDebug(el, e)
    if (this._debugHierarchy && !this._lockedEl) this._updateHierarchyPanel(el, this._colorForEl(el))
  }

  _onDebugClick(e) {
    const el = document.elementFromPoint(e.clientX, e.clientY)
    if (!el || el.closest('.__debug-overlay,.__debug-label,.__debug-hierarchy')) return

    if (this._lockedEl === el) {
      el.style.outline = ''
      el.style.outlineOffset = ''
      delete el.dataset.debugLocked
      this._lockedEl = null
      const badge = document.getElementById('__debug-badge')
      if (badge) badge.textContent = this._debugHierarchy ? 'Hierarchy \u2014 Esc to exit' : 'Inspect active \u2014 Esc to exit'
      return
    }

    document.querySelectorAll('[data-debug-locked]').forEach(l => {
      l.style.outline = ''
      l.style.outlineOffset = ''
      delete l.dataset.debugLocked
    })

    this._lockedEl = el
    const color = this._colorForEl(el)
    el.style.outline = '3px solid ' + color
    el.style.outlineOffset = '-2px'
    el.dataset.debugLocked = 'true'

    if (this._debugHierarchy) this._updateHierarchyPanel(el, color)

    const selector = this._getElementHierarchy(el)
    console.log('%c[DEBUG] Selected element:', 'color:' + color + ';font-weight:bold', el)
    console.log('Selector:', selector)

    if (navigator.clipboard) {
      navigator.clipboard.writeText(selector)
      const btn = document.getElementById('__debug-badge')
      if (btn) {
        const originalText = btn.textContent
        btn.textContent = 'Copied selector'
        btn.style.background = '#30d158'
        setTimeout(() => {
          btn.textContent = originalText
          btn.style.background = '#ff453a'
        }, 1500)
      }
    }
  }

  _onDebugKey(e) {
    if (e.key === 'Escape') {
      if (this._debugHierarchy) { this._toggleDebugHierarchy(); return }
      if (this._debugOn) { this._toggleDebug(); return }
    }
  }
}
