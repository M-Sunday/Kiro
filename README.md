# Kiro

A local-first desktop + mobile app for capturing ideas, organizing files, and exploring content. Save videos, bookmarks, notes, external files, and direct-access links. All data stays on your device — no servers, no login.

Built with vanilla JS/CSS + TypeScript, powered by Vite, and wrapped with Electron (desktop) or Capacitor (mobile). Works on Windows, macOS, Android, and iOS.

## Features

- **YouTube videos** — Paste a link, fetch metadata (title, channel, duration, thumbnail), save to folders with privacy and publish-date support
- **Download videos** — Download via yt-dlp (desktop only). Supports quality selection, codec (h264 priority), audio format, and bitrate settings. Output is forced to MP4. Ffmpeg auto-downloaded for 1080p+. Progress bar with merge detection.
- **External files** — Import images, videos, and text files from your device. Grid view with thumbnails (base64 data URLs for small images, `file://` for large, canvas-captured frames for videos). In-app image viewer, video player with custom controls (always visible, auto-adapts to video aspect ratio). Assign to folders, blur/unblur, drag-to-reorder sidebar. **Stale detection** — files missing from disk are automatically greyed out with a play-off overlay and red border glow. Re-import via toast with Locate/Cancel buttons, or toggle not-found/found via context menu.
- **Camera capture** — Take pictures directly in-app via `getUserMedia`. Flip front/back camera, capture as JPEG, saved as external file with instant thumbnail.
- **Bookmarks** — Save any URL with auto-fetched preview image, organized separately.
- **Notes** — Rich-text notes with image paste and built-in todo lists. Editable checkboxes with custom SVG circle-check/circle-x toggle icons, particle burst animation on completion. Assignable to folders.
- **Direct Access** — Quick-launch links with thumbnail previews.
- **Grid view** — Browse all content in a visual grid with sections per type. Cascade animation on load. Workbench header always visible at top.
- **Canvas gallery** — Infinite canvas view with public domain image archive (750+ images from pdimagearchive.org, cached locally). Masonry layout, pan & drag, search, surprise me button. Falls back to curated vintage illustration collection when offline.
- **Search landing** — Centered search prompt with recent history miniatures (click to reload). Shows when focusing the search input or the sidebar search.
- **Bulk select** — Ctrl+click grid items for batch delete, move, pin, or blur.
- **Drag to reorder** — Reorder grid items within sections with blue drop-line indicators. Touch drag via long-press on mobile.
- **Drag to folder** — Drag video, note, or external file grid items onto sidebar folders to move them. Also drag sidebar items between folders.
- **Context menus** — Right-click, long-press (mobile), or three-dot button on any item.
- **Keyboard shortcuts** — Press `?` to view all shortcuts.
- **Settings panel** — Theme, toolbar toggles, frosted glass effect with 3 intensity levels, file/link history options, NSFW filters, download options, storage breakdown. About User pane with editable username, version, device info, and Reset Account.
- **Themes** — White and Black, with optional frosted glass blur effect on sidebar and top-bar.
- **Frosted glass** — Toggleable backdrop-blur effect. Three intensity levels: Normal (8px), More (16px), Extreme (24px). Persisted across sessions.
- **Onboarding flow** — First-launch walkthrough for new users.
- **Search** — Filter sidebar items by title.
- **Pin items** — Pin important videos to the top.
- **Offline mode** — Greys search bar when offline, shows persistent online indicator (green/yellow/red badge in top-bar).
- **Slow connection detection** — Shows yellow indicator when `effectiveType` is 2g/3g.
- **Debug inspector** — Ctrl+D to toggle element inspector (colored overlay, title label, dims, style badges). Ctrl+Shift+H for hierarchy sidebar panel. Click to lock and copy CSS selector.

## Usage

1. **Add a video** — Paste a link in the top bar, press Enter or click the arrow.
2. **Save** — Click "Add video" to save it to a folder (or create a new folder).
3. **Browse** — Use the sidebar tree to navigate folders, videos, bookmarks, notes, external files, and direct access links.
4. **Grid view** — Click the grid icon (or press `?` for more shortcuts) to see all content as cards.
5. **Context menu** — Right-click any item, or tap the three-dot (⋯) button, or long-press on mobile.
6. **Bulk select** — Ctrl+click multiple grid items, then use the batch bar at the bottom.
7. **Reorder** — Drag grid items within a section to reorder them; drag sidebar items to move between folders.
8. **Download** — Open a saved video, click the Download button below the player (desktop Electron only — uses yt-dlp).
9. **Canvas gallery** — Click the layers icon in the top bar. Pan by dragging, click items to view details, use Surprise Me for a random pick, or search by title.
10. **Settings** — Click the gear icon in the sidebar header.
11. **Search landing** — Click the search input or the sidebar search to open the search landing with recent history.
12. **Debug** — Press Ctrl+D to inspect elements; Ctrl+Shift+H for hierarchy sidebar.

## Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| `?` | Toggle keyboard shortcuts overlay |
| `Ctrl+F` / `/` | Focus sidebar search |
| `Ctrl+Shift+L` | Focus search input |
| `Ctrl+=` | Add current video |
| `Ctrl+,` | Open Settings |
| `Ctrl+Z` | Undo in note editor |
| `Ctrl+Shift+Z` | Redo in note editor |
| `Ctrl+click` | Select multiple grid items |
| `Escape` | Close modals / blur input |
| `Ctrl+D` | Toggle element inspector |
| `Ctrl+Shift+H` | Toggle hierarchy sidebar panel |

## Data

Data is persisted in **IndexedDB** (desktop/browser) or **SQLite** (mobile via Capacitor), with automatic migration from legacy `localStorage`. Nothing is sent to any server.

Storage keys (legacy `localStorage` — migrated on first launch):
- `kiroVideos` — video metadata
- `kiroFolders` — folder structure and ordering
- `kiroBookmarks` — bookmark entries
- `kiroDirectAccess` — direct access entries
- `kiroNotes` — rich-text notes
- `kiroExternalFiles` — external file entries (images, videos, text)
- `kiroSettings` — user preferences
- `kiroPins` — pinned video IDs
- `kiroNSFW` — NSFW domain list
- `linkHistory` — recently opened links
- `kiroLastVersion` — last seen app version
- `dlType`, `dlVideoQuality`, `dlAudioFormat`, `dlAudioBitrate`, `dlVideoCodec` — download preferences

## Download feature

- **Desktop only** — download button is hidden on mobile.
- **yt-dlp** is auto-downloaded from GitHub on first use (stored in `~/.kiro/bin/`).
- **ffmpeg** is auto-downloaded from gyan.dev when 1080p+ or Max quality is requested.
- With ffmpeg: uses `bestvideo[height<=?Q]+bestaudio` merged to MP4.
- Without ffmpeg: falls back to single-file `best[height<=?Q]` (720p max).
- Codec sorting: when h264 is selected, yt-dlp prefers h264 streams.
- A folder picker dialog lets you choose where to save downloaded files.
- On completion, Explorer opens showing the download folder.
- Real-time progress bar with percentage shown under the video card.

## Project structure

```
kiro/
├── serve.js                  # Standalone HTTP dev server (port 3000)
├── vite.config.ts            # Vite config (dev, build, test)
├── tsconfig.json             # TypeScript config (arch layer only)
├── capacitor.config.json     # Capacitor config for mobile builds
├── package.json
├── src/
│   ├── main.js               # Electron main process
│   ├── index.html            # App shell (splash, onboarding, camera overlay, viewers)
│   ├── css/
│   │   ├── base.css          # Reset, splash, scrollbars, keyframes
│   │   ├── layout.css        # Sidebar, top-bar, main area, backdrop, drop zone
│   │   ├── components.css    # Card, toast, ctx menu, settings, grid, notes, dialogs
│   │   ├── themes.css        # body.theme-* + body.compact rules
│   │   ├── kiro.css          # Player, external file viewer styles
│   │   └── mobile.css        # @media (max-width: 640px) responsive overrides
│   ├── js/                   # Vanilla JS component layer
│   │   ├── app.js            # Bootstrap init sequence
│   │   ├── data.js           # localStorage CRUD + migration helpers
│   │   ├── core/             # EventBus, StateManager, ServiceRegistry
│   │   ├── components/       # GridView, SidebarView, CardView, GalleryView, etc.
│   │   ├── services/         # VideoService, DownloadService, SearchService, etc.
│   │   ├── data/             # Repository pattern (IndexedDB), MigrationEngine
│   │   ├── platform/         # PlatformDetector, PermissionService, NotificationService
│   │   └── utils/            # IconService, ViewManager, ExtrasService
│   ├── arch/                 # TypeScript architecture layer
│   │   ├── bootstrap.ts      # Arch bootstrap
│   │   ├── core/             # AppState, EventBus, ServiceRegistry, ViewRouter
│   │   ├── components/       # CardView, ContextMenu, Dialogs, etc. (TS versions)
│   │   ├── views/            # CardView, GalleryView, MediaView, etc.
│   │   ├── services/         # CameraService, DownloadService, FileService, etc.
│   │   ├── repositories/     # Type-safe repository interfaces
│   │   ├── storage/          # DatabaseManager, adapters (IndexedDB, SQLite), migrations
│   │   └── __tests__/        # Vitest test suites
│   ├── shared/
│   │   └── types.ts          # Shared TypeScript types (Video, Note, Folder, etc.)
│   └── assets/
│       ├── icons/            # App icons + 50+ local SVG icons (no CDN)
│       └── gallery/          # Curated vintage illustrations + page-1 API data
```

## Offline behavior

- **YouTube thumbnails** are hot-linked and won't load offline.
- **Video metadata** requires a network fetch to load.
- **Search bar** is disabled when offline.
- The online indicator in the top-bar shows connection status (green/yellow/red badge).
- **Canvas gallery** falls back to local curated illustrations when offline.
- **Download** — button is hidden on mobile; requires Electron desktop.

## Development

```bash
npm install
npm start          # Electron + local HTTP server (port 3001)
npm run dev        # Vite dev server (port 5173)
npm run build      # Vite production build (outputs to dist/)
npm run serve      # Standalone HTTP server (port 3000)
npm run typecheck  # TypeScript type checking (tsc --noEmit)
npm test           # Run vitest suites
```

Requires Electron for desktop. The app auto-opens in grid view by default.

## Mobile builds

```bash
npm run cap:sync          # Sync Capacitor config
npm run cap:open:android  # Open Android Studio
npm run cap:run:android   # Run on connected device
```

## Tech stack

- **Electron** — desktop wrapper (Windows, macOS)
- **Capacitor** — mobile wrapper (Android, iOS)
- **Vanilla JS** — component layer (no framework)
- **TypeScript** — architecture layer with full type safety
- **Vite** — dev server, production builds, and test runner
- **Vitest** — unit testing with jsdom environment
- **IndexedDB** — persistence (browser/Electron)
- **SQLite** — persistence (mobile via Capacitor)
- **Custom SVG icons** — 50+ local icons (no CDN)
- **yt-dlp** — video download engine (auto-downloaded on first use)
- **ffmpeg** — audio/video processing for high-quality downloads (auto-downloaded when needed)
- **Zod** — runtime schema validation (arch layer)
- **youtubei.js** — YouTube metadata extraction
