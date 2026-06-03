// ─── Core Domain Types ───────────────────────────────────

export interface Video {
  videoId: string
  title: string
  channel: string
  duration: string
  thumbnail: string
  url: string
  added: number
  blurred: boolean
  archived: boolean
  pubDate?: string | null
  privacy?: string
}

export interface Note {
  id: string
  title: string
  content: string
  folder: string | null
  todos: TodoItem[]
  added: number
  updated: number
}

export interface TodoItem {
  text: string
  done: boolean
}

export interface Folder {
  name: string
  videoIds: string[]
  color?: string
}

export interface FolderMeta {
  color: string
}

export interface Bookmark {
  id: string
  url: string
  title: string
  image?: string
  added: number
  blurred: boolean
}

export interface DirectAccess {
  id: string
  url: string
  title: string
  image?: string
  added: number
  blurred: boolean
}

export interface ExternalFile {
  id: string
  name: string
  path: string
  size: number
  mimeType: string
  added: number
  blurred: boolean
  folder: string | null
  thumbnail?: string
  _fn?: string
  _blobUrl?: string
  _stale?: boolean
}

// ─── Settings ─────────────────────────────────────────────

export interface AppSettings {
  frosted: boolean
  showSidebarBtn: boolean
  showKiroInput: boolean
  compactMode: boolean
  autoUpdateLinks: boolean
  confirmDeletion: boolean
  detectAllExt: boolean
  saveLinkHistory: boolean
  clearOnExit: boolean
}

export interface DownloadPrefs {
  type: 'video' | 'audio'
  videoQuality: string
  videoCodec: string
  audioFormat: string
  audioBitrate: string
}

// ─── State ────────────────────────────────────────────────

export interface UIState {
  currentView: ViewName
  sidebarClosed: boolean
  batchSelected: string[]
  searchFocused: boolean
  settingsOpen: boolean
  currentVideoId: string | null
  currentNoteId: string | null
}

export type ViewName = 'grid' | 'card' | 'note' | 'landing' | 'gallery' | 'settings' | 'none'

export interface PlatformState {
  isOnline: boolean
  isNative: boolean
  isElectron: boolean
  permissions: Record<string, string>
}

export interface AppState {
  videos: Record<string, Video>
  folders: Record<string, string[]>
  folderMeta: Record<string, FolderMeta>
  pins: string[]
  notes: Note[]
  bookmarks: Bookmark[]
  directAccess: DirectAccess[]
  externalFiles: ExternalFile[]
  collapsed: Record<string, boolean>
  nsfw: string[]
  blurAllNSFW: boolean
  userName: string
  settings: AppSettings
  download: DownloadPrefs
  ui: UIState
  platform: PlatformState
}

// ─── Events ───────────────────────────────────────────────

export type AppEvent =
  | { type: 'ui:search:video'; payload: { url: string } }
  | { type: 'ui:card:load-video'; payload: { id: string } }
  | { type: 'ui:note:open'; payload: { id: string } }
  | { type: 'ui:note:create'; payload: { data: Partial<Note> } }
  | { type: 'ui:note:update'; payload: { id: string; changes: Partial<Note> } }
  | { type: 'ui:note:delete'; payload: { id: string } }
  | { type: 'ui:note:move'; payload: { id: string; folder: string | null } }
  | { type: 'ui:todo:toggle'; payload: { noteId: string; todoIndex: number } }
  | { type: 'ui:video:create'; payload: { data: Partial<Video> } }
  | { type: 'ui:video:delete'; payload: { id: string; folder?: string } }
  | { type: 'ui:video:move'; payload: { id: string; from: string; to: string } }
  | { type: 'ui:video:pin'; payload: { id: string } }
  | { type: 'ui:video:archive'; payload: { id: string } }
  | { type: 'ui:video:blur'; payload: { id: string } }
  | { type: 'ui:folder:create'; payload: { name: string; options?: { color?: string } } }
  | { type: 'ui:folder:rename'; payload: { oldName: string; newName: string } }
  | { type: 'ui:folder:delete'; payload: { name: string } }
  | { type: 'ui:folder:reorder'; payload: { name: string; videoIds: string[] } }
  | { type: 'ui:folder:set-color'; payload: { name: string; color: string } }
  | { type: 'ui:settings:change'; payload: { key: string; value: unknown } }
  | { type: 'ui:settings:theme'; payload: { theme: string } }
  | { type: 'ui:download:start'; payload: { videoId: string; options?: Partial<DownloadPrefs> } }
  | { type: 'ui:grid:refresh' }
  | { type: 'ui:view:set'; payload: { view: ViewName } }
  | { type: 'ui:icons:load-needed' }
  | { type: 'ui:context-menu:show'; payload: { x: number; y: number; videoId?: string | null; bookmarkId?: string | null; noteId?: string | null; daId?: string | null; extId?: string | null; folderName?: string | null } }
  | { type: 'ui:context-menu:open-link'; payload: { id: string; type: string } }
  | { type: 'ui:grid:reorder'; payload: { id: string; direction: 'up' | 'down'; folder: string } }
  | { type: 'ui:grid:drop-on-folder'; payload: { videoId: string; folder: string } }
  | { type: 'ui:bookmark:create'; payload: { url: string; title: string } }
  | { type: 'ui:direct-access:create'; payload: { url: string; title: string } }
  | { type: 'ui:folder:rename-start'; payload: { name: string } }
  | { type: 'ui:ext:open'; payload: { id: string } }
  | { type: 'ui:settings:open' }
  | { type: 'ui:settings:close' }
  | { type: 'ui:sidebar:refresh' }
  | { type: 'ui:folder:create-dialog' }
  | { type: 'ui:bookmark:create-dialog' }
  | { type: 'ui:file:import' }
  | { type: 'data:video:created'; payload: { video: Video } }
  | { type: 'data:video:deleted'; payload: { videoId: string } }
  | { type: 'data:video:moved'; payload: { videoId: string; fromFolder?: string; toFolder?: string } }
  | { type: 'data:note:created'; payload: { note: Note } }
  | { type: 'data:note:updated'; payload: { id: string; changes: Partial<Note> } }
  | { type: 'data:note:deleted'; payload: { id: string } }
  | { type: 'data:folder:created'; payload: { name: string } }
  | { type: 'data:folder:deleted'; payload: { name: string } }
  | { type: 'data:settings:changed'; payload: { key: string; value: unknown } }
  | { type: 'search:started'; payload: { videoId: string } }
  | { type: 'search:complete'; payload: { videoId: string; metadata: Record<string, unknown> } }
  | { type: 'search:failed'; payload: { videoId: string; error?: string } }
  | { type: 'app:bootstrapped' }
  | { type: 'app:ready' }
  | { type: string; payload: Record<string, unknown> }

// ─── Event Payloads ───────────────────────────────────────

export interface VideoMetadata {
  title: string
  channel: string
  duration: string
  thumbnail: string
  url: string
  videoId: string
  privacy: string
  pubDate: string | null
}

// ─── Repository types ─────────────────────────────────────

export interface Repository<T> {
  getById(id: string): Promise<T | null>
  getAll(): Promise<T[]>
  save(item: T): Promise<string>
  delete(id: string): Promise<void>
  search?(query: string): Promise<T[]>
}

export interface VideoRepository extends Repository<Video> {
  getByFolder(folder: string): Promise<Video[]>
}

export interface NoteRepository extends Repository<Note> {
  getByFolder(folder: string): Promise<Note[]>
}

export interface FolderRepository {
  create(name: string, options?: { color?: string }): Promise<Folder>
  getByName(name: string): Promise<Folder | null>
  getAllSorted(): Promise<Folder[]>
  save(folder: Folder): Promise<string>
  delete(name: string): Promise<void>
  reorder(name: string, videoIds: string[]): Promise<void>
  addVideo(name: string, videoId: string): Promise<void>
  removeVideo(name: string, videoId: string): Promise<void>
}

export interface SettingsRepository {
  get(key: string): Promise<unknown>
  set(key: string, value: unknown): Promise<void>
  getAllSettings(): Promise<Record<string, unknown>>
}

// ─── Storage adapter ──────────────────────────────────────

export interface StorageAdapter {
  connect(): Promise<void>
  disconnect(): Promise<void>
  get<T>(store: string, id: string): Promise<T | null>
  getAll<T>(store: string): Promise<T[]>
  put<T>(store: string, item: T): Promise<string>
  delete(store: string, id: string): Promise<void>
  clear(store: string): Promise<void>
  queryByIndex<T>(store: string, index: string, value: unknown): Promise<T[]>
}
