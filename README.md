# YouTube Vault

A local-first desktop + PWA app for saving, organizing, and downloading YouTube videos, bookmarks, notes, and direct-access links. All data stays in your browser — no servers, no login.

Built with vanilla JS/CSS and Electron. Works on Windows, macOS, Linux, Android, and iOS.

## Features

- **YouTube videos** — Paste a link, fetch metadata (title, channel, duration, thumbnail), save to folders
- **Download videos** — Download via yt-dlp (desktop) or redirect to cobalt.tools (PWA/mobile). Supports quality selection, codec, audio format, and bitrate settings
- **Bookmarks** — Save any URL with auto-fetched preview image, organized separately
- **Notes** — Rich-text notes with image paste, assignable to folders
- **Direct Access** — Quick-launch links with thumbnail previews
- **Grid view** — Browse all content in a visual grid with sections per type
- **Search landing** — Centered search prompt with recent history miniatures (click to reload)
- **Bulk select** — Ctrl+click grid items for batch delete, move, pin, or blur
- **Drag to reorder** — Reorder grid items within sections (videos, bookmarks, notes, DAs) with blue drop-line indicators. Touch drag via long-press on mobile.
- **Drag to folder** — Drag sidebar items between folders
- **Context menus** — Right-click, long-press (mobile), or three-dot button on any item
- **Keyboard shortcuts** — Press `?` to view all shortcuts
- **Settings panel** — Theme, toolbar toggles, file/link history options, NSFW filters, download options, patch notes
- **Themes** — White, Black, and Obsidian Black
- **Calendar view** — Browse videos by publish date
- **Search** — Filter sidebar items by title
- **Pin items** — Pin important videos to the top
- **Offline mode** — Detects connection status, greys search bar when offline, shows persistent online indicator (green/yellow/red badge in top-bar)
- **Patch notes** — In-app changelog shown on version updates and in Settings
- **Service worker** — Caches static assets for offline use; Update notification with Update/Later buttons

## Usage

1. **Add a video** — Paste a YouTube link in the top bar, press Enter or click the arrow
2. **Save** — Click "Add video" to save it to a folder (or create a new folder)
3. **Browse** — Use the sidebar tree to navigate folders, videos, bookmarks, notes, and direct access links
4. **Grid view** — Click the grid icon (or press `?` for more shortcuts) to see all content as cards
5. **Context menu** — Right-click any item, or tap the three-dot (⋯) button, or long-press on mobile
6. **Bulk select** — Ctrl+click multiple grid items, then use the batch bar at the bottom
7. **Reorder** — Drag grid items within a section to reorder them; drag sidebar items to move between folders
8. **Download** — Open a saved video, click the Download button below the player. On desktop (Electron) it uses yt-dlp; on mobile/browser it opens cobalt.tools
9. **Settings** — Click the gear icon in the sidebar header

## Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| `?` | Toggle keyboard shortcuts overlay |
| `Ctrl+F` / `/` | Focus sidebar search |
| `Ctrl+Shift+L` | Focus YouTube URL input |
| `Ctrl+=` | Add current video |
| `Ctrl+,` | Open Settings |
| `Ctrl+Z` | Undo in note editor |
| `Ctrl+Shift+Z` | Redo in note editor |
| `Ctrl+click` | Select multiple grid items |
| `Escape` | Close modals / blur input |
| `Ctrl+D` | Toggle element inspector (Debug menu) |

## Data

All data is stored locally in `localStorage`. Nothing is sent to any server.

Storage keys:
- `ytVideos` — video metadata
- `ytFolders` — folder structure and ordering
- `ytBookmarks` — bookmark entries
- `ytDirectAccess` — direct access entries
- `ytNotes` — rich-text notes
- `ytSettings` — user preferences
- `ytPins` — pinned video IDs
- `ytNSFW` — NSFW domain list
- `linkHistory` — recently opened links
- `ytLastVersion` — last seen app version (for changelog)
- `ytSwVersion` — applied service worker version (tracks updates)
- `dlType`, `dlVideoQuality`, `dlAudioFormat`, `dlAudioBitrate`, `dlVideoCodec` — download preferences

## Download feature (Desktop only)

- **yt-dlp** is auto-downloaded from GitHub on first use (stored in `~/.youtube-vault/bin/`)
- **ffmpeg** is auto-downloaded from gyan.dev when 1080p+ or Max quality is requested
- With ffmpeg: uses `bestvideo[height<=?Q]+bestaudio` for full quality
- Without ffmpeg: falls back to `best[height<=?Q]` (720p max)
- A folder picker dialog lets you choose where to save downloaded files
- On completion, Explorer/Finder opens showing the downloaded file
- Real-time progress bar with percentage shown under the video card

## Project structure

```
src/
├── main.js              # Electron main process (window, menu, IPC)
├── index.html           # App shell with inline splash script
├── css/
│   └── styles.css       # All styling (~870 lines)
├── js/
│   ├── renderer.js      # All application logic (~2000 lines)
│   └── icons.js         # Local SVG icon loader
├── assets/
│   ├── changelog.json   # Version history
│   ├── manifest.json    # PWA manifest
│   ├── icons/
│   │   ├── app-icon-*.svg
│   │   ├── app-icon-splash.svg
│   │   └── ui/          # 36 Lucide-style SVG icons (including download.svg)
├── sw.js                # Service worker (cache-first strategy)
```

## Offline behavior

- **Static assets** are cached by the service worker and work offline
- **YouTube thumbnails** are hot-linked and won't load offline
- **Video metadata** requires a network fetch to load
- **Search bar** is disabled when offline
- The online indicator in the top-bar shows connection status (green/yellow/red badge)
- **Download** — disabled/redirected when offline

## Development

```bash
npm install
npm start
```

Requires Electron. The app auto-opens in grid view by default.

## Tech stack

- **Electron** — desktop wrapper
- **Vanilla JS** — no frameworks
- **localStorage** — persistence
- **Service Worker** — offline caching + update detection
- **Custom SVG icons** — 36 local icons (no CDN)
- **yt-dlp** — video download engine (auto-downloaded on first use)
- **ffmpeg** — audio/video processing for high-quality downloads (auto-downloaded when needed)
