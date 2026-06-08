# Kiro

A local-first desktop + mobile app for capturing ideas, organizing files, and exploring content. Save videos, bookmarks, notes, external files, and direct-access links. All data stays on your device — no servers, no login, no PWA, no web.

Built with vanilla JS/CSS + TypeScript, powered by Vite, wrapped with Electron (desktop) or Capacitor (Android/iOS).

## Features

- **YouTube videos** — Paste a link, fetch metadata, save to folders
- **Download videos** — via yt-dlp (desktop only — Electron). Quality/codec/format selection, ffmpeg auto-download for 1080p+.
- **External files** — Import images, videos, text files. Grid view with thumbnails, in-app viewer/player, folder assignment, blur, drag-reorder. Stale detection greys out deleted files.
- **Camera capture** — Take pictures in-app via `getUserMedia`.
- **Bookmarks** — Save URLs with auto-fetched preview images.
- **Notes** — Rich-text with image paste, todo lists, checkbox toggle animation, folder assignment.
- **Direct Access** — Quick-launch links with thumbnails.
- **Grid view** — Visual grid with sections per type, cascade animation, bulk select (Ctrl+click).
- **Canvas gallery** — Infinite canvas with 750+ public domain images, masonry layout, pan/drag, search, surprise me.
- **Search landing** — Recent history with click-to-reload.
- **Drag to reorder** — Grid items and sidebar items, touch long-press on mobile.
- **Drag to folder** — Drop grid/sidebar items onto sidebar folders.
- **Context menus** — Right-click, long-press, or three-dot button.
- **Settings** — Theme, frosted glass (3 levels), NSFW filters, download prefs, storage breakdown, reset account.
- **Themes** — White and Black, optional frosted glass blur.
- **Keyboard shortcuts** — Press `?` to view all.
- **Offline indicator** — Green/yellow/red connection badge in the top-bar.

## Usage

1. **Add a video** — Paste a YouTube link in the top bar, press Enter.
2. **Save** — Click "Add video" to save to a folder or create a new one.
3. **Browse** — Sidebar tree navigates folders, videos, bookmarks, notes, external files.
4. **Grid view** — Click the grid icon to see all content as cards.
5. **Context menu** — Right-click, tap `⋯`, or long-press on mobile.
6. **Bulk select** — Ctrl+click items, use the batch bar.
7. **Download** — Open a saved video, click Download (desktop Electron only).
8. **Settings** — Gear icon in the sidebar header.

## Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| `?` | Toggle shortcuts overlay |
| `Ctrl+F` / `/` | Focus sidebar search |
| `Ctrl+Shift+L` | Focus search input |
| `Ctrl+=` | Add current video |
| `Ctrl+,` | Open Settings |
| `Ctrl+Z` | Undo in note editor |
| `Ctrl+Shift+Z` | Redo in note editor |
| `Ctrl+click` | Select multiple grid items |
| `Escape` | Close modals / blur input |
| `Ctrl+D` | Toggle element inspector |
| `Ctrl+Shift+H` | Toggle hierarchy panel |

## Data

Persisted in **localStorage** with migration to IndexedDB. Nothing is sent to any server.

Key storage keys: `kiroVideos`, `kiroFolders`, `kiroBookmarks`, `kiroDirectAccess`, `kiroNotes`, `kiroExternalFiles`, `kiroSettings`, `kiroPins`, `kiroNSFW`, `linkHistory`, download prefs.

## Development

```bash
npm install
npm start              # Electron + local HTTP server (port 3001)
npm run dev            # Vite dev server (port 5173)
npm run build          # Vite production build → dist/
npm run serve          # Standalone HTTP server (port 3000)
npm run typecheck      # tsc --noEmit
npm test               # vitest
```

Requires Electron for desktop. App auto-opens in grid view.

## Mobile builds

```bash
npx cap sync
npx cap run android    # Run on connected device/emulator
npx cap open android   # Open Android Studio
```

## Tech stack

- **Electron** — desktop (Windows, macOS)
- **Capacitor** — mobile (Android, iOS)
- **Vanilla JS** — component layer (no framework)
- **TypeScript** — architecture layer
- **Vite** — dev server, builds, test runner
- **Vitest** — unit testing
- **localStorage / IndexedDB** — persistence
- **Custom SVG icons** — 50+ local, no CDN
- **yt-dlp** — video download engine (auto-downloaded)
- **ffmpeg** — high-quality download processing (auto-downloaded)
- **Zod** — runtime schema validation
- **youtubei.js** — YouTube metadata extraction
