import { Component } from './base/Component.js'
import { Api } from '../core/Api.js'

const SETTINGS_KEYS = {
  toolbar: ['showSidebarBtn', 'showKiroInput'],
  files: ['autoUpdateLinks', 'confirmDeletion', 'detectAllExt'],
  history: ['saveLinkHistory', 'clearOnExit']
}

export class SettingsPanel extends Component {
  constructor() {
    super()
    this.api = Api.getInstance()
    this._systemThemeMQ = null
    this._systemThemeMQHandler = null
  }

  mount(rootEl) {
    super.mount(rootEl)
    this._bindEvents()
    this._initState()
    this.bus.on('ui:grid:refresh', () => this._renderStorageInfo())
    this.bus.on('ui:sidebar:refresh', () => this._renderStorageInfo())
  }

  _bindEvents() {
    this.listenTo(document.getElementById('settingsBtn'), 'click', () => {
      document.getElementById('settingsOverlay')?.classList.add('open')
      const icon = document.querySelector('#settingsBtn .sni')
      if (icon) { icon.classList.remove('spin'); void icon.offsetWidth; icon.classList.add('spin') }
      this._renderStorageInfo()
      this._renderSettingsAvatar()
    })
    this.listenTo(document.getElementById('settingsClose'), 'click', () => {
      document.getElementById('settingsOverlay')?.classList.remove('open')
    })
    this.listenTo(document.getElementById('settingsOverlay'), 'click', (e) => {
      if (e.target === document.getElementById('settingsOverlay')) {
        document.getElementById('settingsOverlay')?.classList.remove('open')
      }
    })

    const self = this
    document.querySelectorAll('.settings-cat').forEach(cat => {
      cat.addEventListener('click', function () {
        document.querySelectorAll('.settings-cat').forEach(c => c.classList.remove('active'))
        this.classList.add('active')
        document.querySelectorAll('.settings-pane').forEach(p => p.style.display = 'none')
        const paneMap = {
          about: 'pane-about', theme: 'pane-theme', toolbar: 'pane-toolbar',
          files: 'pane-files', history: 'pane-history', download: 'pane-download',
          nsfw: 'pane-nsfw', storage: 'pane-storage'
        }
        const paneId = paneMap[this.dataset.cat]
        const pane = document.getElementById(paneId)
        if (pane) pane.style.display = 'block'
        if (this.dataset.cat === 'history') self._renderSettingsHistory()
        if (this.dataset.cat === 'storage') self._renderStorageInfo()
        if (this.dataset.cat === 'theme') self._renderSettingsHeroPreview()
      })
    })

    // Toggle switches
    document.querySelectorAll('.settings-toggle').forEach(t => {
      t.addEventListener('click', function () { this.classList.toggle('on') })
    })

    // Theme dots
    document.querySelectorAll('#themeSegment .theme-dot').forEach(dot => {
      dot.addEventListener('click', function () {
        document.querySelectorAll('#themeSegment .theme-dot').forEach(d => d.classList.remove('active'))
        this.classList.add('active')
        const t = this.dataset.theme
        self._setTheme(t)
      })
    })

    // Hero image settings
    this.listenTo(document.getElementById('settingsHeroChange'), 'click', () => {
      this.bus.emit('settings:hero:change')
    })
    this.listenTo(document.getElementById('settingsHeroRemove'), 'click', () => {
      this.bus.emit('settings:hero:remove')
    })
    this.bus.on('settings:hero:change', () => this._renderSettingsHeroPreview())
    this.bus.on('settings:hero:remove', () => this._renderSettingsHeroPreview())

    // Avatar settings
    this.listenTo(document.getElementById('settingsAvatarChange'), 'click', () => {
      this.bus.emit('settings:avatar:change')
    })
    this.listenTo(document.getElementById('settingsAvatarRemove'), 'click', () => {
      this.bus.emit('settings:avatar:remove')
    })

    // Toolbar settings
    document.querySelectorAll('#pane-toolbar .settings-toggle').forEach((t, i) => {
      const on = this._loadSetting(SETTINGS_KEYS.toolbar[i], true)
      if (on) t.classList.add('on'); else t.classList.remove('on')
      t.addEventListener('click', () => {
        this._saveSetting(SETTINGS_KEYS.toolbar[i], t.classList.contains('on'))
        this._applyToolbarSettings()
      })
    })

    // Files settings
    document.querySelectorAll('#pane-files .settings-toggle').forEach((t, i) => {
      const on = this._loadSetting(SETTINGS_KEYS.files[i], true)
      if (on) t.classList.add('on'); else t.classList.remove('on')
      t.addEventListener('click', () => {
        this._saveSetting(SETTINGS_KEYS.files[i], t.classList.contains('on'))
      })
    })

    // History settings
    document.querySelectorAll('#pane-history .settings-toggle').forEach((t, i) => {
      const on = this._loadSetting(SETTINGS_KEYS.history[i], i === 0)
      if (on) t.classList.add('on'); else t.classList.remove('on')
      t.addEventListener('click', () => {
        this._saveSetting(SETTINGS_KEYS.history[i], t.classList.contains('on'))
        if (i === 0 && !t.classList.contains('on')) {
          if (window.saveHistory) window.saveHistory([])
        }
        if (document.getElementById('searchLanding')?.style.display === 'flex') {
          if (window.renderSearchLanding) window.renderSearchLanding()
        }
      })
    })

    // Clear history
    this.listenTo(document.getElementById('settingsClearHistoryBtn'), 'click', () => {
      if (confirm('Clear link history?')) {
        if (window.saveHistory) window.saveHistory([])
        this._renderSettingsHistory()
        if (document.getElementById('searchLanding')?.style.display === 'flex') {
          if (window.renderSearchLanding) window.renderSearchLanding()
        }
      }
    })

    // NSFW
    this.listenTo(document.getElementById('nsfwAddBtn'), 'click', () => this._addNSFW())
    this.listenTo(document.getElementById('nsfwAddInput'), 'keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('nsfwAddBtn')?.click()
    })

    const blurAllToggle = document.getElementById('blurAllNSFWToggle')
    if (blurAllToggle) {
      blurAllToggle.classList.toggle('on', window.getBlurAllNSFW?.() || false)
      blurAllToggle.addEventListener('click', () => {
        if (window.saveBlurAllNSFW) window.saveBlurAllNSFW(blurAllToggle.classList.contains('on'))
        if (window.autoApplyNSFW) window.autoApplyNSFW()
        document.getElementById('settingsOverlay')?.classList.remove('open')
        const s = document.getElementById('splash')
        if (s) { s.style.display = ''; s.classList.remove('fade') }
        const t = document.getElementById('splashText')
        if (t) t.textContent = 'Applying\u2026'
        setTimeout(() => location.reload(), 400)
      })
    }

    // Reset
    this.listenTo(document.getElementById('settingsResetBtn'), 'click', () => {
      document.getElementById('resetOverlay')?.classList.add('open')
    })
    this.listenTo(document.getElementById('resetCancel'), 'click', () => {
      document.getElementById('resetOverlay')?.classList.remove('open')
    })
    this.listenTo(document.getElementById('resetConfirm'), 'click', () => {
      document.getElementById('resetOverlay')?.classList.remove('open')
      localStorage.clear()
      location.reload()
    })
    this.listenTo(document.getElementById('resetOverlay'), 'click', (e) => {
      if (e.target === document.getElementById('resetOverlay')) {
        document.getElementById('resetOverlay')?.classList.remove('open')
      }
    })

    // Clear storage
    this.listenTo(document.getElementById('settingsClearStorageBtn'), 'click', () => {
      document.getElementById('resetOverlay')?.classList.add('open')
    })

    // Username edit
    const editBtn = document.getElementById('settingsUserNameEditBtn')
    const editInput = document.getElementById('settingsUserNameEditInput')
    const userDisplay = document.getElementById('settingsUserNameDisplay')
    if (editBtn && editInput && userDisplay) {
      editBtn.addEventListener('click', () => {
        userDisplay.style.display = 'none'
        editBtn.style.display = 'none'
        editInput.value = window.getUserName?.() || ''
        editInput.style.display = ''
        editInput.focus()
        editInput.select()
      })
      const saveUserName = (name) => {
        const val = name !== undefined ? name.trim() : editInput.value.trim()
        if (!val) return
        if (window.saveUserName) window.saveUserName(val)
        userDisplay.textContent = val
        userDisplay.style.display = ''
        editBtn.style.display = ''
        editInput.style.display = 'none'
        this._showRenameSplash(val)
      }
      editInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveUserName()
      })
      editInput.addEventListener('blur', saveUserName)
    }

    // Download settings
    const dlTypeEl = document.getElementById('dlType')
    const dlVideoSettings = document.querySelector('.dl-video-settings')
    const dlAudioSettings = document.querySelector('.dl-audio-settings')
    if (dlTypeEl) {
      const saved = localStorage.getItem('dlType') || 'video'
      dlTypeEl.value = saved
      this._toggleDlSettings(saved, dlVideoSettings, dlAudioSettings)
      dlTypeEl.addEventListener('change', () => {
        localStorage.setItem('dlType', dlTypeEl.value)
        this._toggleDlSettings(dlTypeEl.value, dlVideoSettings, dlAudioSettings)
      })
    }

    ;['dlVideoQuality','dlAudioFormat','dlAudioBitrate','dlVideoCodec'].forEach(id => {
      const el = document.getElementById(id)
      if (!el) return
      const saved = localStorage.getItem(id)
      if (saved) el.value = saved
      el.addEventListener('change', () => localStorage.setItem(id, el.value))
    })

    this.listenTo(document.getElementById('settingsViewEula'), 'click', () => {
      document.getElementById('eulaOverlay')?.classList.add('open')
    })

    // beforeunload
    window.addEventListener('beforeunload', () => {
      const t = document.querySelector('#pane-history .settings-toggle:last-child')
      if (t?.classList.contains('on')) localStorage.removeItem('linkHistory')
    })
  }

  _initState() {
    this._applyTheme()
    this._initUserName()
    this._initDeviceName()
    this._renderSettingsAvatar()
    this._renderSettingsHeroPreview()
    this._renderNSFWChips()
    this._applyToolbarSettings()
  }

  _setTheme(t) {
    this._unlistenSystemTheme()
    document.body.className = document.body.className.replace(/\btheme-\w+/g, '').trim()
    if (t === 'system') {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) document.body.classList.add('theme-black')
      this._listenSystemTheme()
    } else if (t !== 'white') {
      document.body.classList.add('theme-' + t)
    }
    try { localStorage.setItem('theme', t) } catch {}
  }

  _applyTheme() {
    const savedTheme = localStorage.getItem('theme') || 'white'
    document.querySelectorAll('#themeSegment .theme-dot').forEach(d => d.classList.remove('active'))
    this._setTheme(savedTheme)
    const dot = document.querySelector(`#themeSegment .theme-dot[data-theme="${savedTheme}"]`)
    if (dot) dot.classList.add('active')
  }

  _listenSystemTheme() {
    this._unlistenSystemTheme()
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    this._systemThemeMQ = mq
    this._systemThemeMQHandler = (e) => {
      document.body.className = document.body.className.replace(/\btheme-\w+/g, '').trim()
      if (e.matches) document.body.classList.add('theme-black')
    }
    mq.addEventListener('change', this._systemThemeMQHandler)
  }

  _unlistenSystemTheme() {
    if (this._systemThemeMQ && this._systemThemeMQHandler) {
      this._systemThemeMQ.removeEventListener('change', this._systemThemeMQHandler)
    }
    this._systemThemeMQ = null
    this._systemThemeMQHandler = null
  }

  _initUserName() {
    const userDisplay = document.getElementById('settingsUserNameDisplay')
    if (userDisplay) {
      userDisplay.textContent = (window.getUserName?.()) || '\u2014'
    }
    this._renderSettingsAvatar()
  }

  _renderSettingsAvatar() {
    const avatarEl = document.getElementById('settingsAvatar')
    const nameEl = document.getElementById('settingsAvatarName')
    if (!avatarEl) return
    const name = window.getUserName?.() || ''
    if (nameEl) nameEl.textContent = name || '\u2014'
    const repo = this.api.getRepository('settings')
    Promise.resolve(repo.get('avatarImage')).then(data => {
      if (data?.dataUrl) {
        avatarEl.innerHTML = `<img src="${data.dataUrl}" alt="Avatar">`
      } else {
        const firstLetter = name ? name.charAt(0).toUpperCase() : '?'
        avatarEl.innerHTML = firstLetter
      }
    }).catch(() => {
      const firstLetter = name ? name.charAt(0).toUpperCase() : '?'
      avatarEl.innerHTML = firstLetter
    })
  }

  _renderSettingsHeroPreview() {
    const preview = document.getElementById('settingsHeroPreview')
    const img = document.getElementById('settingsHeroPreviewImg')
    if (!preview || !img) return
    const repo = this.api.getRepository('settings')
    Promise.resolve(repo.get('heroImage')).then(data => {
      if (data?.dataUrl) {
        preview.classList.add('has-image')
        img.style.backgroundImage = `url(${data.dataUrl})`
      } else {
        preview.classList.remove('has-image')
        img.style.backgroundImage = 'none'
      }
    }).catch(() => {
      preview.classList.remove('has-image')
      img.style.backgroundImage = 'none'
    })
  }

  _initDeviceName() {
    const deviceEl = document.getElementById('settingsDeviceName')
    if (!deviceEl) return
    const ua = navigator.userAgent
    if (/Windows/.test(ua)) deviceEl.textContent = 'Windows'
    else if (/Mac/.test(ua)) deviceEl.textContent = 'macOS'
    else if (/Android/.test(ua)) deviceEl.textContent = 'Android'
    else if (/iPhone|iPad/.test(ua)) deviceEl.textContent = 'iOS'
    else deviceEl.textContent = 'Unknown'
  }

  _loadSetting(key, def) {
    try {
      const s = JSON.parse(localStorage.getItem('kiroSettings') || '{}')
      return s[key] !== undefined ? s[key] : def
    } catch { return def }
  }

  _saveSetting(key, on) {
    try {
      const s = JSON.parse(localStorage.getItem('kiroSettings') || '{}')
      s[key] = on
      localStorage.setItem('kiroSettings', JSON.stringify(s))
    } catch {}
  }

  _applyToolbarSettings() {
    const menuBtn = document.getElementById('menuBtn')
    if (menuBtn) menuBtn.style.display = this._loadSetting('showSidebarBtn', true) ? '' : 'none'
    const pillInput = document.querySelector('.pill-input-wrap')
    if (pillInput) pillInput.style.display = this._loadSetting('showKiroInput', true) ? '' : 'none'

  }

  _toggleDlSettings(type, videoSettings, audioSettings) {
    if (videoSettings) videoSettings.style.display = type === 'video' ? '' : 'none'
    if (audioSettings) audioSettings.style.display = type === 'audio' ? '' : 'none'
  }

  _renderSettingsHistory() {
    const el = document.getElementById('settingsHistoryList')
    if (!el) return
    let items = []
    try { items = JSON.parse(localStorage.getItem('linkHistory') || '[]') } catch { items = [] }
    if (!items.length) {
      const vs = window.getVideos?.() || {}
      const fs = window.getFolders?.() || {}
      const all = (fs['Videos'] || []).map(id => vs[id] ? { id, title: vs[id].title, channel: vs[id].channel } : null).filter(Boolean)
      all.sort((a, b) => (b.added || 0) - (a.added || 0))
      items = all.slice(0, 10)
    }
    if (!items.length) {
      el.innerHTML = '<div style="padding:16px;text-align:center;font-size:12px;color:#8e8e93">No link history yet</div>'
      return
    }
    el.innerHTML = items.map(h =>
      `<div class="settings-history-item" data-id="${h.id}">
        <img class="settings-history-item-img" src="https://img.youtube.com/vi/${h.id}/hqdefault.jpg" loading="lazy" onerror="this.style.display='none'" />
        <div class="settings-history-item-meta">
          <span class="settings-history-item-title">${h.title}</span>
          <span class="settings-history-item-channel">${h.channel}</span>
        </div>
      </div>`
    ).join('')
    el.querySelectorAll('.settings-history-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.id
        if (id) {
          document.getElementById('settingsOverlay')?.classList.remove('open')
          if (window.loadVideoById) window.loadVideoById(id)
        }
      })
    })
  }

  _renderNSFWChips() {
    const el = document.getElementById('nsfwChips')
    if (!el) return
    const words = window.getNSFW?.() || []
    el.innerHTML = words.map(w =>
      '<span class="nsfw-chip">' + w + '<button data-word="' + w + '">\u00d7</button></span>'
    ).join('')
    el.querySelectorAll('.nsfw-chip button').forEach(btn => {
      btn.addEventListener('click', () => {
        const word = btn.dataset.word
        const list = (window.getNSFW?.() || []).filter(w => w !== word)
        if (window.saveNSFW) window.saveNSFW(list)
        this._renderNSFWChips()
        if (window.autoApplyNSFW) window.autoApplyNSFW()
        if (window.renderSidebar) window.renderSidebar()
        if (window.renderGridView) window.renderGridView()
      })
    })
  }

  _addNSFW() {
    const input = document.getElementById('nsfwAddInput')
    if (!input) return
    const word = input.value.trim().toLowerCase()
    if (!word) return
    const list = window.getNSFW?.() || []
    if (!list.includes(word)) { list.push(word); if (window.saveNSFW) window.saveNSFW(list) }
    input.value = ''
    this._renderNSFWChips()
    if (window.autoApplyNSFW) window.autoApplyNSFW()
    if (window.renderSidebar) window.renderSidebar()
    if (window.renderGridView) window.renderGridView()
  }

  _renderStorageInfo() {
    const brk = this._getStorageBreakdown()
    const total = brk.total || 1
    const pct = (v) => Math.round((v / total) * 100)

    const bars = {
      videos: document.getElementById('storageBarVideos'),
      notes: document.getElementById('storageBarNotes'),
      bookmarks: document.getElementById('storageBarBookmarks'),
      external: document.getElementById('storageBarExternal'),
      other: document.getElementById('storageBarOther')
    }
    if (bars.videos) bars.videos.style.width = pct(brk.videos) + '%'
    if (bars.notes) bars.notes.style.width = pct(brk.notes) + '%'
    if (bars.bookmarks) bars.bookmarks.style.width = pct(brk.bookmarks) + '%'
    if (bars.external) bars.external.style.width = pct(brk.externalFiles) + '%'
    if (bars.other) bars.other.style.width = pct(brk.direct + brk.other) + '%'

    const totalLabel = document.getElementById('storageTotalLabel')
    if (totalLabel) totalLabel.textContent = this._formatBytes(total) + ' used'

    const sizes = {
      videos: document.getElementById('storageSizeVideos'),
      notes: document.getElementById('storageSizeNotes'),
      bookmarks: document.getElementById('storageSizeBookmarks'),
      external: document.getElementById('storageSizeExternal'),
      other: document.getElementById('storageSizeOther')
    }
    if (sizes.videos) sizes.videos.textContent = this._formatBytes(brk.videos)
    if (sizes.notes) sizes.notes.textContent = this._formatBytes(brk.notes)
    if (sizes.bookmarks) sizes.bookmarks.textContent = this._formatBytes(brk.bookmarks)
    if (sizes.external) sizes.external.textContent = this._formatBytes(brk.externalFiles)
    if (sizes.other) sizes.other.textContent = this._formatBytes(brk.direct + brk.other)

    const installedAt = document.getElementById('storageInstalledAt')
    if (installedAt) {
      const val = localStorage.getItem('kiroInstalledAt')
      installedAt.textContent = val ? new Date(val).toLocaleDateString() : '\u2014'
    }
    const lastOpened = document.getElementById('storageLastOpenedAt')
    if (lastOpened) {
      const val = localStorage.getItem('kiroLastOpenedAt')
      lastOpened.textContent = val ? new Date(val).toLocaleDateString() : '\u2014'
    }
    const videoCount = document.getElementById('storageVideoCount')
    if (videoCount) videoCount.textContent = Object.keys(window.getVideos?.() || {}).length
    const noteCount = document.getElementById('storageNoteCount')
    if (noteCount) noteCount.textContent = (window.getNotes?.() || []).length
    const bmCount = document.getElementById('storageBookmarkCount')
    if (bmCount) bmCount.textContent = (window.getBookmarks?.() || []).length
    const efCount = document.getElementById('storageExtCount')
    if (efCount) efCount.textContent = (window.getExternalFiles?.() || []).length

    const locationEl = document.getElementById('storageLocation')
    if (locationEl) {
      let loc = ''
      try {
        if (typeof process !== 'undefined' && process.versions?.electron) {
          loc = require('electron').ipcRenderer ? 'App data folder (Electron)' : 'Electron \u2014 localStorage'
        } else if (window.Capacitor && window.Capacitor.isNativePlatform()) {
          loc = 'Android \u2014 internal app storage'
        } else {
          loc = 'Browser localStorage'
        }
      } catch { loc = 'localStorage' }
      locationEl.textContent = loc
    }
  }

  _getStorageBreakdown() {
    const getSize = (key) => {
      try {
        const v = localStorage.getItem(key)
        return v ? new Blob([v]).size : 0
      } catch { return 0 }
    }
    const groups = {
      videos: ['kiroVideos','kiroFolders','kiroFolderMeta','kiroPins'],
      notes: ['kiroNotes'],
      bookmarks: ['kiroBookmarks'],
      direct: ['kiroDirectAccess'],
      externalFiles: ['kiro_external_files'],
      other: ['kiroNSFW','kiroCollapsed','kiroSettings','kiroUserName','linkHistory']
    }
    let total = 0
    const result = {}
    for (const key in groups) {
      const sum = groups[key].reduce((acc, k) => acc + getSize(k), 0)
      result[key] = sum
      total += sum
    }
    result.total = total
    return result
  }

  _formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1048576).toFixed(1) + ' MB'
  }
  _showRenameSplash(name) {
    // splash screen removed
  }
}
