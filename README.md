# Kiro

A local-first desktop + PWA app for capturing ideas, organizing files, and exploring content. Save videos, bookmarks, notes, external files, and direct-access links. All data stays in your browser — no servers, no login.

Built with vanilla JS/CSS and Electron. Works on Windows, macOS, Linux, Android, and iOS.

## Features

- **YouTube videos** — Paste a link, fetch metadata (title, channel, duration, thumbnail), save to folders
- **Download videos** — Download via yt-dlp (desktop only). Supports quality selection, codec, audio format, and bitrate settings. Output is forced to MP4 (h264 preferred).
- **External files** — Import images, videos, and text files from your device. Grid view with thumbnails (base64 data URLs for small images, `file://` for large, canvas-captured frames for videos). In-app text viewer and video player with full custom controls. Assign to folders, blur/unblur, drag-to-reorder sidebar. Files appear under their assigned folders in the sidebar tree. Re-import stale files via native file picker on Android/iOS (Capacitor).
- **Camera capture** — Take pictures directly in-app via `getUserMedia`. Flip front/back camera, capture as JPEG, saved as external file with instant thumbnail. Redesigned minimal overlay with Jeju Myeongjo typography and gradient controls.
- **Bookmarks** — Save any URL with auto-fetched preview image, organized separately
- **Notes** — Rich-text notes with image paste, assignable to folders. Built-in todo lists with editable checkboxes, custom SVG circle-check/circle-x toggle icons, particle burst animations on completion
- **Direct Access** — Quick-launch links with thumbnail previews
- **Grid view** — Browse all content in a visual grid with sections per type. Cascade animation on load (sections stagger in 220ms apart, items within at 60ms). Workbench header always visible at top.
- **Search landing** — Centered search prompt with recent history miniatures (click to reload). Shows when focusing the search input or the sidebar search.
- **Bulk select** — Ctrl+click grid items for batch delete, move, pin, or blur
- **Drag to reorder** — Reorder grid items within sections (videos, bookmarks, notes, external files, DAs) with blue drop-line indicators. Touch drag via long-press on mobile.
- **Drag to folder** — Drag video, note, or external file grid items onto sidebar folders to move them. Also drag sidebar items between folders. Grid section headers also accept drops.
- **Context menus** — Right-click, long-press (mobile), or three-dot button on any item
- **Keyboard shortcuts** — Press `?` to view all shortcuts
- **Settings panel** — Theme, toolbar toggles, frosted glass effect with 3 intensity levels (normal/more/extreme), file/link history options, NSFW filters, download options, storage breakdown, patch notes. About User pane with editable username, version, device info, and Reset Account.
- **Themes** — White and Black, with optional frosted glass blur effect on sidebar and top-bar
- **Frosted glass** — Toggleable backdrop-blur effect on sidebar and top-bar. Three intensity levels: Normal (8px), More (16px), Extreme (24px). Persisted across sessions.
- **Onboarding flow** — First-launch walkthrough for new users
- **Search** — Filter sidebar items by title
- **Pin items** — Pin important videos to the top
- **Offline mode** — Detects connection status, greys search bar when offline, shows persistent online indicator (green/yellow/red badge in top-bar)
- **Slow connection detection** — Shows yellow indicator when `effectiveType` is 2g/3g
- **Patch notes** — In-app changelog shown on version updates and in Settings, with splash animation showing "Updating..." then "Welcome" on version change
- **Service worker** — Network-first strategy with offline fallback; CSS cache-busting via versioned query strings; Update notification with Update/Later buttons (3-min reminder)
- **Debug inspector** — Ctrl+D to toggle element inspector (colored overlay, title label, dims, style badges). Ctrl+Shift+H for hierarchy sidebar panel. Click to lock and copy CSS selector. Network simulation available via Debug menu.

## Usage

1. **Add a video** — Paste a link in the top bar, press Enter or click the arrow
2. **Save** — Click "Add video" to save it to a folder (or create a new folder)
3. **Browse** — Use the sidebar tree to navigate folders, videos, bookmarks, notes, and direct access links
4. **Grid view** — Click the grid icon (or press `?` for more shortcuts) to see all content as cards
5. **Context menu** — Right-click any item, or tap the three-dot (⋯) button, or long-press on mobile
6. **Bulk select** — Ctrl+click multiple grid items, then use the batch bar at the bottom
7. **Reorder** — Drag grid items within a section to reorder them; drag sidebar items to move between folders
8. **Download** — Open a saved video, click the Download button below the player (desktop Electron only — uses yt-dlp)
9. **Settings** — Click the gear icon in the sidebar header
10. **Search landing** — Click the search input or the sidebar search to open the search landing with recent history
11. **Debug** — Press Ctrl+D to inspect elements; Ctrl+Shift+H for hierarchy sidebar

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
| `Ctrl+D` | Toggle element inspector (colored overlay + title label) |
| `Ctrl+Shift+H` | Toggle hierarchy sidebar panel (indented ancestry tree) |

## Data

All data is stored locally in `localStorage`. Nothing is sent to any server.

Storage keys:
- `kiroVideos` — video metadata
- `kiroFolders` — folder structure and ordering
- `kiroBookmarks` — bookmark entries
- `kiroDirectAccess` — direct access entries
- `kiroNotes` — rich-text notes
- `kiroExternalFiles` — external file entries (images, videos, text) with path, thumbnail, folder, blurred
- `kiroSettings` — user preferences
- `kiroPins` — pinned video IDs
- `kiroNSFW` — NSFW domain list
- `linkHistory` — recently opened links
- `kiroLastVersion` — last seen app version (for changelog)
- `kiroSwVersion` — applied service worker version (tracks updates)
- `dlType`, `dlVideoQuality`, `dlAudioFormat`, `dlAudioBitrate`, `dlVideoCodec` — download preferences

## Download feature

- **Desktop only** — download button is hidden on mobile/PWA
- **yt-dlp** is auto-downloaded from GitHub on first use (stored in `~/.kiro/bin/`)
- **ffmpeg** is auto-downloaded from gyan.dev when 1080p+ or Max quality is requested
- With ffmpeg: uses `bestvideo[height<=?Q]+bestaudio` merged to MP4
- Without ffmpeg: falls back to single-file `best[height<=?Q]` (720p max)
- Codec sorting: when h264 is selected, yt-dlp prefers h264 streams
- A folder picker dialog lets you choose where to save downloaded files
- On completion, Explorer opens showing the downloaded file
- Real-time progress bar with percentage shown under the video card

## Project structure

```
src/
├── main.js              # Electron main process (window, Debug menu, IPC folder picker)
├── index.html           # App shell with splash, onboarding, camera overlay, external file viewers, frosted glass controls
├── css/
│   ├── base.css         # Reset, splash, scrollbars, keyframes
│   ├── layout.css       # Sidebar, top-bar, main area, backdrop, drop zone
│   ├── components.css   # Card, toast, ctx menu, settings, grid, notes, dialogs, external files
│   ├── themes.css       # All body.theme-* + body.compact rules
│   └── mobile.css       # @media (max-width: 640px) responsive overrides
├── js/
│   ├── components/
│   │   ├── GridView.js      # Grid rendering, external file viewers, video player w/ custom controls, camera capture, thumbnail generation
│   │   ├── SidebarView.js   # Sidebar tree with folders, external files under folders, drag-drop, context menu
│   │   ├── ContextMenu.js   # Context menu actions for all item types including external files (move, rename, blur, delete)
│   │   ├── CardView.js      # Video card view with player, metadata, download integration
│   │   ├── SearchView.js    # Search landing, history miniatures, YouTube search
│   │   ├── SettingsPanel.js # Settings with storage breakdown, patch notes, theme/toolbar/frosted glass/NSFW panes
│   │   ├── OnboardingFlow.js # First-launch walkthrough for new users
│   │   └── Dialogs.js       # Folder/bookmark dialogs
│   ├── core/
│   │   └── Api.js           # Event bus, state management
│   ├── data/
│   │   ├── db.js            # IndexedDB wrapper
│   │   ├── MigrationEngine.js # localStorage key migration (yt* → kiro*, vault_* → kiro_*)
│   │   ├── repositories/    # FolderRepository, etc.
│   │   └── data.js          # localStorage CRUD helpers, selectedGridItems, APP_VERSION
│   ├── platform/
│   │   └── NotificationService.js
│   ├── services/
│   │   ├── SearchService.js, VideoService.js, NoteService.js, ExtrasService.js
│   ├── utils/
│   │   ├── IconService.js   # Pre-cached SVG definitions for dynamic icon swaps
│   │   └── icons.js         # Local SVG icon loader (data-lucide replacement)
│   ├── app.js               # Bootstrap init sequence
│   ├── grid.js              # Legacy grid helpers
│   ├── card.js              # Legacy card helpers
│   ├── search.js            # Legacy search helpers
│   ├── ... (legacy modules)
├── assets/
│   ├── changelog.json   # Version history
│   ├── manifest.json    # PWA manifest
│   ├── icons/           # App icons + 40+ Lucide-style SVGs
├── sw.js                # Service worker (network-first, offline fallback)
```

## Offline behavior

- **Static assets** are cached by the service worker and work offline
- **YouTube thumbnails** are hot-linked and won't load offline
- **Video metadata** requires a network fetch to load
- **Search bar** is disabled when offline
- The online indicator in the top-bar shows connection status (green/yellow/red badge)
- **Download** — button is hidden on mobile; requires Electron desktop

## Development

```bash
npm install
npm start
```

Requires Electron. The app auto-opens in grid view by default.

## Tech stack

- **Electron** — desktop wrapper
- **Vanilla JS** — no frameworks (15+ modular JS files)
- **localStorage** — persistence
- **Service Worker** — offline caching + update detection
- **Custom SVG icons** — 45+ local icons (no CDN)
- **yt-dlp** — video download engine (auto-downloaded on first use)
- **ffmpeg** — audio/video processing for high-quality downloads (auto-downloaded when needed)
