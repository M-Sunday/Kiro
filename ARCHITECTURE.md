# Kiro Architecture — Complete Developer Reference

## Overview

Kiro (v3.1.1) is a local-first media manager — YouTube bookmarks, notes, file attachments, photos, all stored locally on your device. It runs on Android (Capacitor), desktop (Electron), and browser (Vite dev server / PWA).

The project is mid-migration from a flat vanilla JS legacy system (`src/js/`) to a strict layered TypeScript architecture (`src/arch/`). Both systems coexist. The legacy system executes on the device; the TypeScript arch compiles to `dist/` and is the target end state.

---

## Build Pipeline

```
src/  (source)
  │
  ├── Vite dev server (npm run dev)     → serves src/ directly on port 5173
  │
  └── Vite build (npm run build)        → outputs to dist/
        │
        ├── dist/index.html             ← inlined splash CSS, module script refs
        ├── dist/assets/index-*.js      ← bundled JS (legacy + any imported arch/)
        ├── dist/assets/index-*.css     ← bundled CSS (all 6 files)
        └── dist/assets/*               ← copied assets (icons, images)
              │
              └── npx cap run android   → copies dist/ into APK, deploys to device
```

**Critical config:** `capacitor.config.json` sets `webDir: "dist"`. The device runs the **built** output. Any change to `src/` requires `npm run build` before `npx cap run android` takes effect.

---

## Directory Structure

```
Kiro/
├── capacitor.config.json      # webDir: "dist", StatusBar overlaysWebView: true
├── package.json               # Scripts: dev, build, test, typecheck, cap:run:android
├── tsconfig.json              # Strict TS, ES2020, bundler resolution, @arch/* alias
├── vite.config.ts             # Vite + Vitest + jsdom + copyStaticAssets plugin
├── index.html                 # JS redirect to src/index.html
├── serve.js                   # Alternative Node HTTP server for dev
├── README.md
│
├── src/
│   ├── index.html             # Shell — inline splash CSS, 6 CSS links, module script entry
│   ├── main.js                # Electron main process (HTTP server on port 3001)
│   ├── sw.js                  # Service Worker (pre-caches URLs, cache-first)
│   │
│   ├── shared/
│   │   └── types.ts           # All domain types, AppEvent union, interfaces
│   │
│   ├── arch/                  # NEW TypeScript layered architecture (target end state)
│   │   ├── bootstrap.ts       # Init sequence — wires all layers, mounts components
│   │   ├── core/              # EventBus, AppState, ViewRouter, ServiceRegistry
│   │   ├── storage/           # DatabaseManager, MigrationRunner, 4 adapters, schema
│   │   ├── repositories/      # 7 repos (Video, Note, Folder, Bookmark, DirectAccess, Settings, Permission)
│   │   ├── services/          # 9 services (Video, Note, Folder, Bookmark, Search, Settings, Download, Camera, File)
│   │   ├── components/        # 8 presentational components + base Component class
│   │   ├── views/             # 5 views (Media, Gallery, Card, SearchLanding, PermissionDialog)
│   │   └── __tests__/         # 16 test files, 100+ tests
│   │
│   ├── js/                    # LEGACY JavaScript system (active on device)
│   │   ├── app.js             # ES module entry — bootstrap, init, migration bridge
│   │   ├── app-legacy.js      # OLD entry (DEAD)
│   │   ├── data.js            # localStorage CRUD — 50+ window.* globals, LIVE
│   │   ├── core/              # Api, EventBus, StateManager, ServiceRegistry
│   │   ├── services/          # 7 services (same pattern as arch/)
│   │   ├── data/              # db.js (IndexedDB), MigrationEngine, repositories
│   │   ├── platform/          # PlatformDetector, PermissionService, NotificationService
│   │   ├── utils/             # NavigationService, ViewManager, ExtrasService, IconService
│   │   └── components/        # 12 components (GridView, SidebarView, etc.)
│   │
│   ├── css/
│   │   ├── base.css           # Reset, typography, scrollbar
│   │   ├── layout.css         # App shell grid, sidebar overlay, top-bar, media-view
│   │   ├── components.css     # Card, note-view, dialogs, context-menu, batch-bar
│   │   ├── themes.css         # 4 theme definitions, frosted glass system
│   │   ├── mobile.css         # Responsive (<768px) overrides
│   │   └── kiro.css           # Splash, onboarding, settings, import loader
│   │
│   └── assets/                # icons/ (47 SVGs), gallery/ (14 PNGs), changelog, manifest
│
└── android/                   # Capacitor Android native project
    └── app/src/main/
        ├── java/com/kiro/app/MainActivity.java    # Standard BridgeActivity
        ├── AndroidManifest.xml                    # Launcher, FileProvider, permissions
        ├── res/values/styles.xml                  # 3 themes (AppTheme, NoActionBar, Splash)
        ├── res/values/strings.xml                 # App name, package
        ├── res/layout/activity_main.xml           # CoordinatorLayout + WebView
        ├── res/xml/file_paths.xml                 # FileProvider paths
        └── res/mipmap-*/                          # Splash screen images
```

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────────────────┐
│  BOOT (index.html)                                                      │
│  <script type="module" src="js/app.js">                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  Inline <style> block: splash animation, native-android overrides,  │ │
│  │  import loader CSS, safe-area env() fallbacks.                      │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────┤
│  LAYER           LEGACY (js/)                NEW (arch/)                │
├─────────────────────────────────────────────────────────────────────────┤
│  PRESENTATION    components/ (12 files)      components/ (8 files)      │
│                  ViewManager.js               views/ (5 files)          │
│                  window.* globals             extends Component base    │
├─────────────────────────────────────────────────────────────────────────┤
│  APPLICATION     services/ (7 files)          services/ (9 files)       │
│                  listens ui:*, emits data:*    same event pattern       │
├─────────────────────────────────────────────────────────────────────────┤
│  DATA            data.js (localStorage)       storage/ (adapter-based)  │
│                  db.js (IndexedDB)            repositories/ (7 repos)   │
│                  StateManager                 AppStateManager           │
├─────────────────────────────────────────────────────────────────────────┤
│  PLATFORM        platform/ (3 files)          platform/ (1 file)        │
│                  Electron main.js             PermissionService         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Event Bus Communication

```
User Interaction (click / keyboard / long-press)
           │
           ▼
┌──────────────────────────────────────┐
│  Components                           │
│  (GridView, NoteView, etc.)           │
│  emit('ui:video:create', payload)     │
└──────────┬───────────────────────────┘
           │ bus.emit('ui:*')
           ▼
┌──────────────────────────────────────┐
│  Services                             │
│  (VideoService, NoteService, etc.)    │
│  on('ui:*', handler)                  │
│  → calls repository                   │
│  → updates AppState                   │
│  → emits('data:video:created')        │
└──────────┬───────────────────────────┘
           │ bus.emit('data:*')
           ▼
┌──────────────────────────────────────┐
│  Components subscribe to state        │
│  state.subscribe('videos', render)    │
│  Re-render on change                  │
└──────────────────────────────────────┘
```

### Event Naming Convention

| Prefix | Direction | Example |
|--------|-----------|---------|
| `ui:*` | Component → Service | `ui:video:create`, `ui:note:open`, `ui:folder:rename` |
| `data:*` | Service → App | `data:video:created`, `data:folder:deleted` |
| `search:*` | SearchService → UI | `search:complete`, `search:failed` |
| `download:*` | DownloadService → UI | `download:started`, `download:complete` |
| `state:*` | AppState → subscribers | `state:changed` |
| `app:*` | Lifecycle | `app:bootstrapped`, `app:ready` |
| `view:*` | ViewRouter | `view:activated` |
| `platform:*` | Platform events | `platform:permission:changed` |
| `permission:*` | PermissionService | `permission:dialog:show`, `permission:granted` |

---

## Bootstrap Flow (js/app.js)

```
1. Get Api singleton (EventBus, StateManager, ServiceRegistry)
2. api.bootstrap() → 7 repositories, load default state
3. Set platform state (isNative, isElectron, isOnline)
4. MigrationEngine.migrate() (localStorage → IndexedDB)
5. Register all 7 services
6. Instantiate all 12 legacy components, call .mount()
7. Expose window.__kiro (bridge for legacy ←→ arch communication)
8. Create ViewManager, ExtrasService
9. Load Lucide icons
10. Patch legacy save functions to sync state
11. Set initial view to 'grid'
12. Emit app:ready
13. If native Android: set StatusBar style (LIGHT/DARK based on theme class)
    via MutationObserver on document.body.className
```

### StatusBar Runtime Sync (app.js:306-318)

```javascript
if (PlatformDetector.isNativeAndroid()) {
  var sb = window.Capacitor?.Plugins?.StatusBar
  if (sb) {
    function syncStyle() {
      sb.setStyle({
        style: document.body.className.indexOf('theme-black') > -1
          ? 'DARK' : 'LIGHT'
      })
    }
    setTimeout(syncStyle, 100)
    var obs = new MutationObserver(syncStyle)
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] })
  }
}
```

This watches for theme changes and toggles status bar icon color:
- **Black theme** → `DARK` (dark icons on light/transparent status bar)
- **Default/other themes** → `LIGHT` (light icons on dark/transparent status bar)

---

## Storage Layer (3-tier migration)

### Tier 1: Legacy localStorage (`js/data.js`, 275 lines)

`STORAGE_GROUPS` with keys: `videos`, `folders`, `notes`, `bookmarks`, `directAccess`, `settings`, `metadata`, `folderMeta`, `collapsed`, `pins`, `nsfw`, `blurAllNSFW`, `externalFiles`, `linkHistory`.

Exposes 50+ `window.*` globals: `getVideos()`, `saveVideos()`, `getSetting()`, `setSetting()`, etc. Auto-migration at import time via `migrateStorage()`.

### Tier 2: IndexedDB (`js/data/db.js`, 187 lines)

9 stores: `videos`, `notes`, `folders`, `folderMeta`, `bookmarks`, `directAccess`, `settings`, `metadata`, `linkHistory`. Functions: `openDB`, `getAll`, `getById`, `save`, `remove`, `clear`, `count`, `queryByIndex`.

### Tier 3: Adapter-based SQLite (`src/arch/storage/`)

| File | Purpose |
|------|---------|
| `DatabaseManager.ts` | Factory — auto-detects platform, creates adapter, runs migrations |
| `migrations/MigrationRunner.ts` | Version-based SQL migrations |
| `migrations/sql/001_initial_schema.sql` | 9 tables |
| `migrations/sql/002_indexes.sql` | 13 indexes |
| `schema/schema.ts` | DTOs + mapper functions (videoToDB, dbToVideo, etc.) |
| `LegacyMigrator.ts` | Cross-adapter migration (reads old → writes new) |
| `adapters/BrowserStorageAdapter.ts` | IndexedDB for web |
| `adapters/IndexedDbAdapter.ts` | IndexedDB (v2 schema) |
| `adapters/CapacitorSQLiteAdapter.ts` | SQLite via `@capacitor-community/sqlite` |
| `adapters/ElectronSQLiteAdapter.ts` | SQLite via `better-sqlite3` |

---

## Services (9 arch, 7 js legacy)

### arch/services/ (typed TypeScript)

| Service | Listens (ui:*) | Emits (data:*) | Key Methods |
|---------|---------------|----------------|-------------|
| `VideoService` | `video:create/delete/move/pin/archive/blur` | `video:created/deleted/moved/pin-toggled/archive-toggled/blur-toggled` | CRUD + togglePin, toggleArchive, toggleBlur |
| `NoteService` | `note:create/update/delete/move`, `todo:toggle` | `note:created/updated/deleted/todo-toggled` | CRUD + toggleTodo |
| `FolderService` | `folder:create/rename/delete/reorder/set-color` | `folder:created/renamed/deleted/reordered/color-changed` | CRUD + reorder, setColor |
| `BookmarkService` | — (direct calls) | `bookmark:created/updated/deleted` | CRUD + toggleBlur |
| `SearchService` | `search:video` | `search:started/complete/failed/enriched/not-youtube` | oEmbed + Piped API enrichment |
| `SettingsService` | `settings:change`, `settings:theme` | `settings:changed`, `theme:changed` | get/set, applyTheme |
| `DownloadService` | `download:start` | `download:not-supported/started/complete` | Electron-only yt-dlp |
| `CameraService` | `camera:open` | — | Captures via Capacitor/Electron/Browser |
| `FileService` | `file:import` | — | Picker via Capacitor/Electron/Browser |

### js/services/ (mirrored legacy): same 7 minus CameraService and FileService.

---

## Components (8 arch, 12 js legacy)

### arch/components/ (TypeScript, all extend base Component)

| Component | DOM Target | Renders | Key Events |
|-----------|-----------|---------|------------|
| `SearchBar` | `.top-bar-input` | Input field + search button | emits `ui:search:video`, `ui:view:set` |
| `SidebarView` | `.sidebar` | Folder tree, footer, filter | emits folder:*, video:* navigation |
| `ContextMenu` | `#ctxMenu` | Action list (blur, pin, delete, etc.) | emits various ui:* actions |
| `Dialogs` | `#arch-dialogs` | Create/edit folder, bookmark, DA | emits `ui:folder:create`, etc. |
| `SettingsPanel` | `#settingsOverlay` | Tabs: toolbar, files, history, shortcuts | emits `ui:settings:change` |
| `NoteView` | `#noteView` | Rich text editor + todos | emits data:note:* |
| `CardView` | `.content` | Video detail (thumbnail, title, channel) | emits ui:video:create/delete |
| `GridView` | `#gridView` | Full grid with sections + workbench toolbar | emits all grid/video/note/folder/bookmark events |

### Component base class (`base/Component.ts`)

72 lines. Provides:
- `mount(el)` / `destroy()` lifecycle
- `subscribe(path, fn)` → auto-cleans on destroy
- `on(event, fn)` / `emit(event, data)` via injected bus
- `listenTo(target, type, fn, options)` → auto-cleans on destroy
- `isMounted` flag

### js/components/ (legacy, 12 files)

| Component | Lines | Notes |
|-----------|-------|-------|
| `GridView.js` | 1,485 | Largest file — grid, camera, file import, external files, image/video/text viewers |
| `SettingsPanel.js` | 526 | Theme switching, storage management, patch notes |
| `GalleryView.js` | 443 | Deck/card-stack animation view |
| `ContextMenu.js` | 440 | Right-click/long-press action menu with backdrop |
| `CardView.js` | 410 | Video card detail view |
| `SidebarView.js` | 402 | Folder tree, file list, navigation |
| `NoteView.js` | 385 | Rich text editor, todos, paste handler |
| Plus: `OnboardingFlow.js`, `CardStackView.js`, `SearchView.js`, `ImageViewer.js`, `CanvasFallback.js` | | Legacy views not yet ported to arch |

---

## Views (5 arch, router-managed)

| View | Name | Mount | Unmount |
|------|------|-------|---------|
| `MediaView` | `grid` | Shows `#gridView.open`, activates `#gridBtn` | Hides grid, deactivates button |
| `GalleryViewMode` | `gallery` | Shows `#canvasGallery.open`, adds `body.gallery-open` | Reverses |
| `CardViewMode` | `card` | Shows `.content`, hides other views, pauses video | Hides `.content` |
| `SearchLandingView` | `landing` | Shows `#searchLanding` (flex) | Hides it |
| `PermissionDialogView` | — | Appends dialog to body | Removes it |

All managed by `ViewRouter.ts`: responds to `ui:view:set` events, calls `mount()`/`unmount()` lifecycle.

---

## CSS Architecture (6 files)

| File | Role | Key Selectors |
|------|------|---------------|
| `base.css` | Reset + typography | `* { box-sizing }`, 6 font stacks, custom scrollbar |
| `layout.css` | App shell | `body` grid, `.sidebar` fixed overlay, `.main-area` flex, `.top-bar` flex, `.media-view` scroll |
| `components.css` | UI widgets | `.card`, `.note-view`, `.ctx-menu`, `.batch-bar`, `.search-landing`, `.todo-row`, dialogs, external-file viewers |
| `themes.css` | 4 themes | `body.theme-black`, `.frosted .top-bar` (position:absolute, backdrop-filter), `.theme-shader` (monospace) |
| `mobile.css` | Responsive | `@media (max-width: 768px)` — fullscreen sidebar, stacked layout, frosted mobile overrides |
| `kiro.css` | App-specific | Splash, onboarding, card-stack animation, settings panels, import loader |

### Android Safe-Area Handling (inline in index.html)

```css
body.native-android { padding-top: 0 !important; }
body.native-android.theme-black { background: #2c2c2e; }
body.native-android.theme-black .main-area { background: #1c1c1e; }
body.native-android .sidebar { padding-top: 40px !important; }
body.native-android .top-bar {
  margin-top: calc(10px + max(24px, env(safe-area-inset-top, 0px)));
}
body.native-android.frosted .top-bar { margin-top: 0; }
body.native-android.frosted .media-view {
  padding-top: calc(46px + max(30px, env(safe-area-inset-top, 0px))) !important;
}
body.native-android.frosted .top-bar {
  top: calc(10px + max(30px, env(safe-area-inset-top, 0px)));
}
```

**How it works with `overlaysWebView: true`:**
- The status bar is transparent — web content renders behind it
- `env(safe-area-inset-top)` returns the actual status bar height (~24px)
- `body.native-android.theme-black { background: #2c2c2e }` sets the body bg to match the top-bar color (`#2c2c2e`), so the gap behind the transparent status bar is seamless
- The `.top-bar` margin-top pushes it below the safe area; the body background matches the top-bar background, so there's no visible seam
- For the default theme: body bg is `#fff`, top-bar bg is `#fff` (from layout.css) — already seamless without overrides

---

## Platform Support

| Feature | Android (Capacitor) | Electron | Browser/PWA |
|---------|--------------------|----------|-------------|
| **Entry** | `js/app.js` via WebView | `main.js` serve HTTP on port 3001 | Vite dev server / built dist |
| **Camera** | `@capacitor/camera` (intent-based `getPhoto`) | Electron dialog | `navigator.mediaDevices.getUserMedia` |
| **File picker** | `@capawesome/capacitor-file-picker` (multi-select) | `dialog.showOpenDialog` (multi) | `<input type="file" multiple>` |
| **Storage** | IndexedDB + localStorage + SQLite (planned) | IndexedDB + better-sqlite3 (planned) | IndexedDB + localStorage |
| **Notifications** | `@capacitor/local-notifications` | Electron Notification API | Web Notification API |
| **Video playback** | Direct path via `Capacitor.convertFileSrc` | `fs.readFileSync` → Blob URL | Object URL from file input |

---

## Electron Main Process (`src/main.js`)

- Local HTTP server on `KIRO_PORT` (default 3001)
- `BrowserWindow` with `nodeIntegration: true`, `contextIsolation: false`
- IPC handlers: `open-file-dialog`, `download-video`, `open-external-link`
- Serves files from `dist/` after build

---

## Testing

- **Framework:** Vitest + jsdom
- **IndexedDB mock:** `fake-indexeddb/auto`
- **Location:** `src/arch/__tests__/` + `src/arch/storage/__tests__/`
- **16 test files, 100+ tests:**

| Test File | Tests | Coverage |
|-----------|-------|----------|
| `AppState.test.ts` | 12 | get/set/subscribe/partial/reset/wildcard/convenience methods |
| `EventBus.test.ts` | 7 | emit/on/wildcard/once/clear/error handling |
| `ViewRouter.test.ts` | 5 | register/activate/event-driven/destroy |
| `ServiceRegistry.test.ts` | 5 | register/lazy/has/getAll |
| `VideoService.test.ts` | 4 | create/pin/blur/delete |
| `NoteService.test.ts` | 6 | create/update/todo/delete/move |
| `SettingsService.test.ts` | 5 | get/set/theme/event |
| `PermissionService.test.ts` | 12 | request/resolve/cache/revoke/events |
| `FileService.test.ts` | 6 | import/permissions/edge cases |
| `CameraService.test.ts` | 6 | capture/permissions/errors |
| `DatabaseManager.test.ts` | 7 | connect/migrate/disconnect |
| `Schema.test.ts` | 6 | toDB/dbTo round-trips, nullable fields |
| `MigrationRunner.test.ts` | 8 | schema version/migrations/rollback |
| `LegacyMigrator.test.ts` | 5 | empty/partial/full migration |
| `BrowserStorageAdapter.test.ts` | 10 | CRUD/query/transaction |

**Run:** `npm test` (vitest run), `npm run test:watch` (vitest watch)

---

## Migration Status

| Layer | Legacy (js/) | New (arch/) | Status |
|-------|-------------|-------------|--------|
| Core | Api, EventBus, StateManager, ServiceRegistry | EventBus, AppState, ViewRouter, ServiceRegistry | Both active — new doesn't execute on device |
| Storage | db.js (IndexedDB) + data.js (localStorage) | DatabaseManager + 4 adapters | Split-brain — both write independently |
| Repos | 7 repos in data/repositories/ | 7 repos in repositories/ | Both active |
| Services | 7 services | 9 services (+ CameraService, FileService) | Both active — same event pattern |
| Components | 12 components | 8 components | Both active — mount to same DOM nodes |
| Views | ViewManager.js (manual) | ViewRouter.ts (5 views) | Both active |
| Platform | 3 files (PlatformDetector, PermissionService, NotificationService) | PermissionService ported | Partial migration |

---

## Key Design Decisions

1. **webDir: "dist"** — Device runs built output. `npm run build` is mandatory before `npx cap run android`. Source edits alone don't reach the device.

2. **StatusBar.overlaysWebView: true** — Makes the Android status bar transparent. The body background matches the top-bar background per theme (`#2c2c2e` for black, `#fff` for default), creating a seamless edge-to-edge appearance. `backgroundColor` is omitted to avoid solid color overlays.

3. **IndexedDB as primary** — SQLite adapter exists but isn't active yet. Migration from localStorage → IndexedDB runs on every boot via `MigrationEngine.migrate()`.

4. **Event-driven architecture** — UI never calls storage directly. Everything flows: Components → `ui:*` → Services → repos → state → `data:*` → Components re-render.

5. **No DOM in services/repos** — Strict separation of concerns. Only components touch the DOM.

6. **window.__kiro and window.__kiroArch** — Both systems expose bridges for gradual migration. The legacy system exposes globals for the arch to consume, and vice versa.

7. **Frosted glass** — The frosted top-bar uses `position: absolute` with `backdrop-filter: blur()`, floating above `.media-view`. Safe-area on Android is handled via `body.native-android.frosted` overrides with `env(safe-area-inset-top)`.

8. **Camera uses getPhoto()** — The `IonCamera`/`CameraX`-based `takePhoto()` was incompatible with the target device. `getPhoto()` launches the system camera intent, which works reliably.

9. **versionCode 1** — Prevents Android from clearing app data on reinstall (was jumped to 10, causing data loss).

10. **Context menu backdrop** — A transparent fixed overlay (`#ctxBackdrop`, z-index: 199) intercepts clicks outside the context menu, replacing legacy document-level event listeners that leaked.

---

## Wire Diagram: Camera Flow

```
User taps "📷 Take Picture"
       │
       ▼
GridView._takePicture()
       │
       ├─ Capacitor available? ──yes──▶ cam.requestPermissions()
       │                                    │
       │                                    ├─ Granted ──▶ cam.getPhoto({ source: 'CAMERA' })
       │                                    │                  │
       │                                    │                  ▼
       │                                    │            System camera intent opens
       │                                    │            User takes photo
       │                                    │            Returns webPath/dataUrl
       │                                    │                  │
       │                                    │                  ▼
       │                                    │            Save as ExternalFile
       │                                    │            → localStorage + state
       │                                    │            → Render grid + sidebar
       │                                    │
       │                                    └─ Denied ──▶ console.warn, return
       │
       └─ No Capacitor ──▶ navigator.mediaDevices.getUserMedia (web fallback)
```

---

## Wire Diagram: Context Menu

```
Long-press (mobile) or right-click (desktop) on grid item
       │
       ▼
GridView creates #ctxBackdrop (z-index: 199, pointer-events: auto)
       │
       ▼
ContextMenu.js positions menu at tap/click coordinates
       │
       ├─ Blur/Unblur → toggle v?.blurred (manual only, not conflated with isNSFW)
       ├─ Delete → remove from storage + re-render
       ├─ Archive → toggle archived flag
       ├─ Move to → show folder picker sub-menu
       ├─ Pin → toggle pinned state
       ├─ Rename → prompt for new name
       ├─ Open Link → window.open (Electron: shell.openExternal)
       ├─ Move Up/Down → reorder within section
       └─ Mark Stale → flag for re-import
       │
       ▼
Click backdrop or any action → dismiss (#ctxBackdrop.remove(), menu hidden)
```

---

## Grid View: What the User Sees

The grid view is the primary interface — a scrollable dashboard that renders ALL user content in sections. The user sees:

### 1. Dashboard Header (`.grid-dashboard`)
- **Greeting:** "Arnau's Dashboard" (uses the user's name from onboarding)
- **Clock:** `MONDAY • JUNE 8 • 2026` (live, updates every 30s)
- **Action toolbar:** 3 buttons — New Note, Import File, Take Picture

### 2. Folder Sections (one per folder)
Each folder with content gets a section:
- **Section header:** folder name with folder icon (color-coded)
- **Content:** videos (thumbnail + title + channel), notes, and external files assigned to that folder
- **Empty folders** are hidden

### 3. Special Sections (unassigned content)
- **Bookmarks** — links with optional thumbnail, opens in browser on click
- **Notes** — notes not assigned to any folder (shows icon + title + content preview + todo preview)
- **External Files** — files not assigned to any folder (video/audio/image/text icons, thumbnail if available, file size)
- **Direct Access** — saved URLs with title + favicon

### 4. Card Types per Section

**Video Card:** Image thumbnail (YouTube maxresdefault), title, channel name, ellipsis menu button, pin badge if pinned, stale overlay if video is stale (re-import needed). Click opens the card view.

**Note Card:** File/text icon (or list-todo icon if note has todos), title, 80-char content preview, todo preview (up to 3 items with check boxes, "+N more" overflow).

**External File Card:** Thumbnail (if available) or file-type icon (video/audio/image/text), filename, file size. Click opens the appropriate viewer (image → image viewer with zoom/pan, video → video player with controls, text → text viewer).

**Bookmark/Direct Access Card:** Thumbnail (if available) or link icon, title/URL. Click opens the URL in browser.

### 5. Interactions

| Action | Desktop | Mobile |
|--------|---------|--------|
| Open video | Click card → card view | Same |
| Open note | Click card → note editor | Same |
| Open external file | Click card → image/video/text viewer | Same |
| Open bookmark/DA | Click card → browser | Same |
| Context menu | Right-click card | Long-press card |
| Reorder | Drag card to new position | Long-press then drag |
| Quick pin | Pin badge toggle in menu | Menu → Pin |

### 6. Entry Animation

On first load, sections stagger in with a fade-up animation (`.grid-section-anim`, `.grid-item-anim` with CSS transitions). The dashboard header animates first, then each section appears in sequence.

---

## Recent Key Commits

```
3e5c152 FIX: Transparent Android status bar with seamless edge-to-edge
11dd7fb FIX:
fcb767b Strip PWA/web code, fix Electron Ctrl+R crash & blank grid, delete legacy JS
8577db3 Fix download issues: single-stream for low qualities, reliable folder open, better error output
397e70b ADD SQLITE MIGRATION LAYER, PERMISSION SYSTEM, CAMERA/FILE SERVICES & FIX TS STRICT MODE
c9e32b1 FIX CAMERA PERMISSION FLOW & RESTORE FROSTED GLASS POSITIONING
a7a7134 Fix top-bar spacing below Android status bar on non-frosted mode
61a268d Add image preview viewer, v3.1.1, Android edge-to-edge polish
258aa38 Replace deck view with gallery view, refactor sidebar to fixed overlay
```

---

## Build Commands Reference

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server on port 5173 |
| `npm run build` | Vite production build → `dist/` |
| `npm test` | Vitest run |
| `npm run test:watch` | Vitest watch mode |
| `npm run typecheck` | TypeScript type checking |
| `npm run cap:run:android` | Build + deploy to Android (alias for `npx cap run android`) |
| `npx cap sync android` | Sync web assets + native config to Android project |
| `npm start` | Start Electron app (`electron .`) |
