// ─── NEW: ES Module Bootstrap ───────────────────────────
// Coexists with old script-tag system during migration.
// Initializes the new layered architecture alongside existing code.

import { Api } from './core/Api.js'
import { MigrationEngine } from './data/MigrationEngine.js'
import { PermissionService } from './platform/PermissionService.js'
import { NotificationService } from './platform/NotificationService.js'
import { PlatformDetector } from './platform/PlatformDetector.js'
import { ViewManager } from './utils/ViewManager.js'
import { ExtrasService } from './utils/ExtrasService.js'
import { NavigationService } from './utils/NavigationService.js'
import { loadIcons } from './utils/IconService.js'
import './data.js'

import { VideoRepository } from './data/repositories/VideoRepository.js'
import { NoteRepository } from './data/repositories/NoteRepository.js'
import { FolderRepository } from './data/repositories/FolderRepository.js'
import { BookmarkRepository } from './data/repositories/BookmarkRepository.js'
import { DirectAccessRepository } from './data/repositories/DirectAccessRepository.js'
import { SettingsRepository, MetadataRepository } from './data/repositories/SettingsRepository.js'

import { VideoService } from './services/VideoService.js'
import { NoteService } from './services/NoteService.js'
import { FolderService } from './services/FolderService.js'
import { BookmarkService } from './services/BookmarkService.js'
import { SearchService } from './services/SearchService.js'
import { SettingsService } from './services/SettingsService.js'
import { DownloadService } from './services/DownloadService.js'

import { SearchView } from './components/SearchView.js'
import { GridView } from './components/GridView.js'
import { SidebarView } from './components/SidebarView.js'
import { CardStackView } from './components/CardStackView.js'
import { CardView } from './components/CardView.js'
import { NoteView } from './components/NoteView.js'
import { ContextMenu } from './components/ContextMenu.js'
import { Dialogs } from './components/Dialogs.js'
import { SettingsPanel } from './components/SettingsPanel.js'
import { OnboardingFlow } from './components/OnboardingFlow.js'
import { PagesView } from './components/PagesView.js'

const APP_VERSION = '3.1.1'

function loadStateFromStorage(state) {
  state.setState('videos', window.getVideos?.() || {})
  state.setState('folders', window.getFolders?.() || { Videos: [], Archived: [] })
  state.setState('folderMeta', window.getFolderMeta?.() || {})
  state.setState('pins', window.getPins?.() || [])
  state.setState('notes', window.getNotes?.() || [])
  state.setState('bookmarks', window.getBookmarks?.() || [])
  state.setState('directAccess', window.getDirectAccess?.() || [])
    state.setState('externalFiles', window.getExternalFiles?.() || [])
    state.setState('pages', window.getPages?.() || [])
    state.setState('collapsed', window.getCollapsed?.() || {})
  state.setState('userName', window.getUserName?.() || '')
  state.setState('installedAt', window.getInstalledAt?.() || null)
  state.setState('lastOpenedAt', window.getLastOpenedAt?.() || null)
  state.setState('nsfw', window.getNSFW?.() || [])
  state.setState('blurAllNSFW', window.getBlurAllNSFW?.())
}

function patchLegacySavers(state, bus) {
  const syncToState = () => {
    state.setState('videos', window.getVideos?.() || {})
    state.setState('folders', window.getFolders?.() || { Videos: [], Archived: [] })
    state.setState('folderMeta', window.getFolderMeta?.() || {})
    state.setState('pins', window.getPins?.() || [])
    state.setState('notes', window.getNotes?.() || [])
    state.setState('bookmarks', window.getBookmarks?.() || [])
    state.setState('directAccess', window.getDirectAccess?.() || [])
    state.setState('pages', window.getPages?.() || [])
    state.setState('collapsed', window.getCollapsed?.() || {})
    state.setState('userName', window.getUserName?.() || '')
  }

  const patch = (name) => {
    const orig = window[name]
    if (!orig) return
    window[name] = function (...args) {
      const result = orig.apply(this, args)
      syncToState()
      return result
    }
  }

  const savers = [
    'saveVideos', 'saveFolders', 'saveFolderMeta', 'savePins',
    'saveNotes', 'saveBookmarks', 'saveDirectAccess', 'saveExternalFiles', 'savePages',
    'saveCollapsed', 'saveUserName', 'saveNSFW', 'saveBlurAllNSFW'
  ]
  for (const fn of savers) patch(fn)
}

async function bootstrap() {
  const api = Api.getInstance()
  const bus = api.bus
  const state = api.state
  const services = api.services

  api.bootstrap()

  state.setState('platform.isOnline', navigator.onLine)
  state.setState('platform.isNative', PlatformDetector.isNativeAndroid())
  state.setState('platform.isElectron', PlatformDetector.isElectron())

  window.addEventListener('online', () => state.setState('platform.isOnline', true))
  window.addEventListener('offline', () => state.setState('platform.isOnline', false))

  // Data layer — Migration
  const migrationEngine = new MigrationEngine(bus)
  try {
    await migrationEngine.migrate()
  } catch (err) {
    console.warn('[App] Migration deferred (IndexedDB may not be available):', err)
  }

  // Data layer — Repositories
  api.registerRepository('videos', new VideoRepository())
  api.registerRepository('notes', new NoteRepository())
  api.registerRepository('folders', new FolderRepository())
  api.registerRepository('bookmarks', new BookmarkRepository())
  api.registerRepository('directAccess', new DirectAccessRepository())
  api.registerRepository('settings', new SettingsRepository())
  api.registerRepository('metadata', new MetadataRepository())

  // Application services
  services.register('videoService', new VideoService())
  services.register('noteService', new NoteService())
  services.register('folderService', new FolderService())
  services.register('bookmarkService', new BookmarkService())
  services.register('searchService', new SearchService(bus))
  services.register('settingsService', new SettingsService())
  services.register('downloadService', new DownloadService())

  // UI Components
  const searchView = new SearchView()
  const gridView = new GridView()
  const sidebarView = new SidebarView()
  const cardStackView = new CardStackView()
  const cardView = new CardView()
  const noteView = new NoteView()
  const contextMenu = new ContextMenu()
  const dialogs = new Dialogs()
  const settingsPanel = new SettingsPanel()
  const onboardingFlow = new OnboardingFlow()
  const pagesView = new PagesView()

  services.register('searchView', searchView)
  services.register('gridView', gridView)
  services.register('sidebarView', sidebarView)
  services.register('cardStackView', cardStackView)
  services.register('cardView', cardView)
  services.register('noteView', noteView)
  services.register('contextMenu', contextMenu)
  services.register('dialogs', dialogs)
  services.register('settingsPanel', settingsPanel)
  services.register('onboardingFlow', onboardingFlow)

  // Platform services
  const permissionService = new PermissionService(bus, state)
  services.register('permissionService', permissionService)
  // Request storage permission on startup (Android native dialog)
  permissionService.ensure('storage').catch(() => {})

  const notificationService = new NotificationService(bus, permissionService)
  services.register('notificationService', notificationService)

  // Mount UI components to their root elements
  const gridEl = document.getElementById('gridView')
  if (gridEl) gridView.mount(gridEl)

  const searchLanding = document.getElementById('searchLanding')
  if (searchLanding) searchView.mount(searchLanding)

  const sidebarTree = document.getElementById('sidebarTree')
  if (sidebarTree) sidebarView.mount(sidebarTree)

  cardView.mount(document.querySelector('.card'))
  contextMenu.mount(document.getElementById('ctxMenu'))
  noteView.mount(document.getElementById('noteView'))
  dialogs.mount(document.getElementById('folderDialog'))
  settingsPanel.mount(document.getElementById('settingsOverlay'))
  onboardingFlow.mount(document.getElementById('splash'))
  pagesView.mount(document.getElementById('pageView'))

  // Expose API for window-level access during migration
  window.__kiro = {
    api,
    bus,
    state,
    services,
    repos: {
      videos: api.getRepository('videos'),
      notes: api.getRepository('notes'),
      folders: api.getRepository('folders'),
      bookmarks: api.getRepository('bookmarks'),
      settings: api.getRepository('settings'),
    },
    components: {
      searchView,
      gridView,
      sidebarView,
      cardView,
      noteView,
      contextMenu,
      dialogs,
      settingsPanel,
      onboardingFlow,
      pagesView,
    },
    platform: {
      permissionService,
      notificationService,
      detector: PlatformDetector,
    },
  }

  // View management
  const viewManager = new ViewManager()
  services.register('viewManager', viewManager)

  // Navigation history (back button, Escape key, view stack)
  const navigationService = new NavigationService()
  services.register('navigationService', navigationService)

  // Extras (keyboard shortcuts, SW, debug, etc.)
  const extraService = new ExtrasService(APP_VERSION)
  extraService.init()
  services.register('extraService', extraService)

  // Load icons for any remaining [data-lucide] elements from legacy HTML
  loadIcons()

  // Set window.startApp for backward compat (OnboardingFlow calls it)
  window.startApp = () => {
    window.renderSidebar()
    window.renderGridView()
    viewManager.setView('home')
    navigationService.replace('home')
    loadIcons()
    window.startGridAnim?.()
  }

  // Wire bus events to legacy handlers (bridge migration gap)
  bus.on('ui:card:load-video', (e) => { if (window.loadVideoById) window.loadVideoById(e.data?.id || e.id) })
  bus.on('ui:note:open', (e) => {
    if (window.openNote) window.openNote(e.data?.id || e.id)
    navigationService.navigate('note')
  })
  bus.on('ui:icons:load-needed', () => loadIcons())
  bus.on('ui:grid:refresh', () => { if (window.renderGridView) window.renderGridView() })
  bus.on('ui:page:create', () => pagesView.createNewPage())
  bus.on('ui:page:open', (e) => pagesView.openPage(e.data?.id || e.id))
  window.openPage = (id) => bus.emit('ui:page:open', { id })
  bus.on('ui:view:set', (e) => {
    viewManager.setView(e.view)
    navigationService.navigate(e.view)
  })

  // Load existing localStorage data into state
  loadStateFromStorage(state)

  // Patch legacy save functions to keep state in sync
  patchLegacySavers(state, bus)

  // Close sidebar (overlay on all screen sizes)
  const sidebar = document.getElementById('sidebar')
  if (sidebar) sidebar.classList.add('closed')

  // Set version label
  const verLabel = document.getElementById('appVersionLabel')
  if (verLabel) verLabel.textContent = APP_VERSION

  // Request storage permission on native
  if (PlatformDetector.isNativeAndroid()) {
    permissionService.check('storage')
  }

  // ── App-wide UX behaviors (formerly inline script) ──
  document.addEventListener('selectionchange', function () {
    var active = document.activeElement
    if (!active || !active.closest('input, textarea, [contenteditable], .note-view-content')) {
      var s = window.getSelection()
      if (s && s.rangeCount) s.removeAllRanges()
    }
  })
  document.addEventListener('contextmenu', function (e) {
    if (!e.target.closest('input, textarea, [contenteditable], .note-view-content')) e.preventDefault()
  })
  document.addEventListener('selectstart', function (e) {
    if (!e.target.closest('input, textarea, [contenteditable], .note-view-content')) e.preventDefault()
  })

  if (PlatformDetector.isNativeAndroid()) {
    document.body.classList.add('native-android')
  }

  if (PlatformDetector.isNativeAndroid()) {
    try {
      var sb = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.StatusBar
      if (sb) {
        sb.setOverlaysWebView({ overlay: true })
        function syncStyle() {
          sb.setStyle({ style: document.body.className.indexOf('theme-black') > -1 ? 'DARK' : 'LIGHT' })
        }
        setTimeout(syncStyle, 100)
        var obs = new MutationObserver(syncStyle)
        obs.observe(document.body, { attributes: true, attributeFilter: ['class'] })
      }
    } catch (e) {}
  }

  bus.emit('app:ready')

  console.log('[App] Kiro architecture bootstrapped')
  console.log('[App] Platform:', PlatformDetector.platformName())
}

async function start() {
  try {
    await bootstrap()
  } catch (err) {
    console.error('[App] Bootstrap failed:', err)
    const st = document.getElementById('splashText')
    if (st) st.textContent = 'Failed to load: ' + (err.message || err)
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start)
} else {
  start()
}
