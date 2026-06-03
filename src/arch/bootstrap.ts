// ─── Arch Bootstrap ───────────────────────────────────────
// Initializes the new layered architecture alongside the legacy system.
// UI components still use window.* globals for now — this bootstrap
// wires the new core (EventBus, AppState, Services, Repositories, Views)
// and exposes them so legacy code can gradually migrate.

import { EventBus, AppStateManager, ServiceRegistry, ViewRouter } from './core'
import type { View } from './core/ViewRouter'
import { IndexedDbAdapter } from './storage/StorageAdapter'

import { VideoRepo } from './repositories/VideoRepository'
import { NoteRepo } from './repositories/NoteRepository'
import { FolderRepo } from './repositories/FolderRepository'
import { BookmarkRepo } from './repositories/BookmarkRepository'
import { DirectAccessRepo } from './repositories/DirectAccessRepository'
import { SettingsRepo } from './repositories/SettingsRepository'

import { VideoService } from './services/VideoService'
import { NoteService } from './services/NoteService'
import { FolderService } from './services/FolderService'
import { BookmarkService } from './services/BookmarkService'
import { SearchService } from './services/SearchService'
import { SettingsService } from './services/SettingsService'
import { DownloadService } from './services/DownloadService'

import { MediaView } from './views/MediaView'
import { GalleryViewMode } from './views/GalleryView'
import { CardViewMode } from './views/CardView'
import { SearchLandingView } from './views/SearchLandingView'

// ── Presentational Components ──
import { SearchBar } from './components/SearchBar'
import { SidebarView } from './components/SidebarView'
import { ContextMenu } from './components/ContextMenu'
import { Dialogs } from './components/Dialogs'
import { SettingsPanel } from './components/SettingsPanel'
import { NoteView } from './components/NoteView'
import { CardView } from './components/CardView'
import { GridView } from './components/GridView'

// ── Core ──
const bus = new EventBus()
const state = new AppStateManager(bus)
const services = new ServiceRegistry()
const router = new ViewRouter(bus, state)

// ── Storage ──
const db = new IndexedDbAdapter()

// ── Repositories ──
const videoRepo = new VideoRepo(db)
const noteRepo = new NoteRepo(db)
const folderRepo = new FolderRepo(db)
const bookmarkRepo = new BookmarkRepo(db)
const directAccessRepo = new DirectAccessRepo(db)
const settingsRepo = new SettingsRepo(db)

// ── Services ──
const videoService = new VideoService(videoRepo, bus, state)
const noteService = new NoteService(noteRepo, bus, state)
const folderService = new FolderService(folderRepo, bus, state)
const bookmarkService = new BookmarkService(bookmarkRepo, bus, state)
const searchService = new SearchService(bus)
const settingsService = new SettingsService(settingsRepo, bus, state)
const downloadService = new DownloadService(bus, state)

services.register('videoService', videoService)
services.register('noteService', noteService)
services.register('folderService', folderService)
services.register('bookmarkService', bookmarkService)
services.register('searchService', searchService)
services.register('settingsService', settingsService)
services.register('downloadService', downloadService)

// ── Views ──
router.register(new MediaView(bus, state))
router.register(new GalleryViewMode(bus, state))
router.register(new CardViewMode(bus, state))
router.register(new SearchLandingView(bus, state))

// ── Platform state ──
state.set('platform.isOnline', navigator.onLine)
const isNative = !!((window as any).Capacitor && (window as any).Capacitor.isNativePlatform?.())
const isElectron = !!(typeof process !== 'undefined' && (process as any).versions?.electron)
state.set('platform.isNative', isNative)
state.set('platform.isElectron', isElectron)

window.addEventListener('online', () => state.set('platform.isOnline', true))
window.addEventListener('offline', () => state.set('platform.isOnline', false))

// ── Mount Presentational Components ──
function safeMount(selector: string, component: { mount: (el: HTMLElement) => void }): void {
  const el = document.querySelector(selector) as HTMLElement | null
  if (el) component.mount(el)
  else console.warn(`[bootstrap] Mount target "${selector}" not found`)
}

let archComponents: Record<string, any> = {}

if (typeof document !== 'undefined') {
  const searchBar = new SearchBar(bus, state)
  safeMount('.top-bar-input', searchBar)

  const sidebarView = new SidebarView(bus, state)
  safeMount('.sidebar', sidebarView)

  const ctxMenu = new ContextMenu(bus, state)
  safeMount('#ctxMenu', ctxMenu)

  const dialogs = new Dialogs(bus, state)
  const dialogsContainer = document.createElement('div')
  dialogsContainer.id = 'arch-dialogs'
  document.body.appendChild(dialogsContainer)
  dialogs.mount(dialogsContainer)

  const settingsPanel = new SettingsPanel(bus, state)
  safeMount('#settingsOverlay', settingsPanel)

  const noteView = new NoteView(bus, state)
  safeMount('#noteView', noteView)

  const cardView = new CardView(bus, state)
  safeMount('.content', cardView)

  const gridView = new GridView(bus, state)
  safeMount('#gridView', gridView)

  archComponents = { searchBar, sidebarView, ctxMenu, dialogs, settingsPanel, noteView, cardView, gridView }

  // Dialog triggers from sidebar workbench buttons
  const sidebarFooterBtns = document.querySelector('.sidebar-footer')
  if (sidebarFooterBtns) {
    sidebarFooterBtns.querySelector('#newFolderBtn')?.addEventListener('click', () => dialogs.openFolder())
    sidebarFooterBtns.querySelector('#newBookmarkBtn')?.addEventListener('click', () => dialogs.openBookmark())
    sidebarFooterBtns.querySelector('#newNoteBtn')?.addEventListener('click', () => {
      bus.emit('ui:note:create', { data: { title: 'Untitled' } })
    })
  }
  // Global keyboard shortcut for focus
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'l') {
      e.preventDefault()
      archComponents['searchBar']?.focus()
    }
  })
}

// ── Legacy bridge: expose on window.__kiroArch for gradual migration ──
;(window as any).__kiroArch = {
  bus,
  state,
  services,
  router,
  repos: {
    videos: videoRepo,
    notes: noteRepo,
    folders: folderRepo,
    bookmarks: bookmarkRepo,
    settings: settingsRepo,
  },
  views: {
    media: router.getRegisteredViews(),
  },
  components: archComponents,
}

// ── Export for module use ──
export {
  bus,
  state,
  services,
  router,
  videoService,
  noteService,
  folderService,
  bookmarkService,
  searchService,
  settingsService,
  downloadService,
  videoRepo,
  noteRepo,
  folderRepo,
  bookmarkRepo,
  settingsRepo,
}
