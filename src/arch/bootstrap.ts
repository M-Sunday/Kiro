// ─── Arch Bootstrap ───────────────────────────────────────
// Initializes the new layered architecture alongside the legacy system.
// UI components still use window.* globals for now — this bootstrap
// wires the new core (EventBus, AppState, Services, Repositories, Views)
// and exposes them so legacy code can gradually migrate.

import { EventBus, AppStateManager, ServiceRegistry, ViewRouter } from './core'
import type { View } from './core/ViewRouter'
import { DatabaseManager } from './storage/DatabaseManager'

import { VideoRepo } from './repositories/VideoRepository'
import { NoteRepo } from './repositories/NoteRepository'
import { FolderRepo } from './repositories/FolderRepository'
import { BookmarkRepo } from './repositories/BookmarkRepository'
import { DirectAccessRepo } from './repositories/DirectAccessRepository'
import { SettingsRepo } from './repositories/SettingsRepository'
import { PermissionRepository } from './repositories/PermissionRepository'

import { VideoService } from './services/VideoService'
import { NoteService } from './services/NoteService'
import { FolderService } from './services/FolderService'
import { BookmarkService } from './services/BookmarkService'
import { SearchService } from './services/SearchService'
import { SettingsService } from './services/SettingsService'
import { DownloadService } from './services/DownloadService'
import { CameraService } from './services/CameraService'
import { FileService } from './services/FileService'

import { PermissionService } from './platform/PermissionService'
import { PermissionDialogView } from './views/PermissionDialogView'

import { Camera } from '@capacitor/camera'
import { FilePicker } from '@capawesome/capacitor-file-picker'
import { Clipboard } from '@capacitor/clipboard'

import { MediaView } from './views/MediaView'
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
const dbManager = new DatabaseManager({ autoMigrate: true })

let videoRepo!: VideoRepo
let noteRepo!: NoteRepo
let folderRepo!: FolderRepo
let bookmarkRepo!: BookmarkRepo
let directAccessRepo!: DirectAccessRepo
let settingsRepo!: SettingsRepo
let permissionRepo!: PermissionRepository

let permissionService!: PermissionService

let videoService!: VideoService
let noteService!: NoteService
let folderService!: FolderService
let bookmarkService!: BookmarkService
let searchService!: SearchService
let settingsService!: SettingsService
let downloadService!: DownloadService
let cameraService!: CameraService
let fileService!: FileService

async function initStorage(): Promise<void> {
  const db = await dbManager.connect()

  videoRepo = new VideoRepo(db)
  noteRepo = new NoteRepo(db)
  folderRepo = new FolderRepo(db)
  bookmarkRepo = new BookmarkRepo(db)
  directAccessRepo = new DirectAccessRepo(db)
  settingsRepo = new SettingsRepo(db)
  permissionRepo = new PermissionRepository(db)

  permissionService = new PermissionService(bus, state)

  videoService = new VideoService(videoRepo, bus, state)
  noteService = new NoteService(noteRepo, bus, state)
  folderService = new FolderService(folderRepo, bus, state)
  bookmarkService = new BookmarkService(bookmarkRepo, bus, state)
  searchService = new SearchService(bus)
  settingsService = new SettingsService(settingsRepo, bus, state)
  downloadService = new DownloadService(bus, state)
  cameraService = new CameraService(bus, state, permissionService)
  fileService = new FileService(bus, state, permissionService)

  services.register('videoService', videoService)
  services.register('noteService', noteService)
  services.register('folderService', folderService)
  services.register('bookmarkService', bookmarkService)
  services.register('searchService', searchService)
  services.register('settingsService', settingsService)
  services.register('downloadService', downloadService)
  services.register('cameraService', cameraService)
  services.register('fileService', fileService)
  services.register('permissionService', permissionService)
}

const storageReady = initStorage()

async function finishBootstrap(): Promise<void> {
  await storageReady

  // ── Views ──
  router.register(new MediaView(bus, state))
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

    // Mount permission dialog
    const permissionDialog = new PermissionDialogView(bus, state)
    permissionDialog.mount()

    archComponents = { searchBar, sidebarView, ctxMenu, dialogs, settingsPanel, noteView, cardView, gridView, permissionDialog }

    // Wire sidebar footer button events to dialogs
    bus.on('ui:folder:create-dialog', () => dialogs.openFolder())
    bus.on('ui:bookmark:create-dialog', () => dialogs.openBookmark())
    bus.on('ui:settings:open', () => settingsPanel.open())

    // Permission reset in settings
    bus.on('ui:settings:reset-permissions', () => {
      permissionService.resetAll()
    })

    bus.on('ui:clipboard:paste', async () => {
      const isNative = state.get<boolean>('platform.isNative') ?? false
      if (isNative) {
        try {
          const result = await Clipboard.read()
          if (result.value) {
            bus.emit('ui:clipboard:paste', { data: result.value, type: result.type })
          }
        } catch (err) {
          console.warn('[Clipboard] read failed:', err)
        }
      }
    })

    // Global keyboard shortcut for focus
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'l') {
        e.preventDefault()
        archComponents['searchBar']?.focus()
      }
    })
  }

  // Restore persisted permissions from storage into state
  try {
    const records = await permissionRepo.getAll()
    for (const record of records) {
      state.set(`permissions.records.${record.type}`, record)
    }
  } catch {}

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
      permissions: permissionRepo,
    },
    views: {
      media: router.getRegisteredViews(),
    },
    components: archComponents,
  }
}

void finishBootstrap()

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
  cameraService,
  fileService,
  permissionService,
  videoRepo,
  noteRepo,
  folderRepo,
  bookmarkRepo,
  settingsRepo,
  permissionRepo,
}
