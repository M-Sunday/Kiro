import type { Video, Note, Folder, Bookmark, DirectAccess, ExternalFile } from '../../../shared/types'

export enum Table {
  Videos = 'videos',
  Notes = 'notes',
  Folders = 'folders',
  Bookmarks = 'bookmarks',
  DirectAccess = 'directAccess',
  ExternalFiles = 'externalFiles',
  Settings = 'settings',
  Permissions = 'permissions',
}

export interface DBVideo {
  id: string
  title: string
  channel: string
  duration: string
  thumbnail: string
  url: string
  folder_id: string | null
  added: number
  updated: number
  blurred: number
  archived: number
  pub_date: string | null
  privacy: string | null
}

export interface DBNote {
  id: string
  title: string
  content: string
  folder_id: string | null
  todos: string
  added: number
  updated: number
}

export interface DBFolder {
  id: string
  name: string
  color: string | null
  created_at: number
}

export interface DBBookmark {
  id: string
  url: string
  title: string
  image: string | null
  added: number
  blurred: number
}

export interface DBDirectAccess {
  id: string
  url: string
  title: string
  image: string | null
  added: number
  blurred: number
}

export interface DBExternalFile {
  id: string
  name: string
  path: string
  size: number
  mime_type: string
  added: number
  blurred: number
  folder_id: string | null
  thumbnail: string | null
}

export interface DBSetting {
  key: string
  value: string
}

export interface DBPermission {
  id: string
  type: string
  value: string
  scope: string
  updated_at: number
}

export function videoToDB(v: Video, folderId: string | null): DBVideo {
  return {
    id: v.videoId,
    title: v.title,
    channel: v.channel,
    duration: v.duration,
    thumbnail: v.thumbnail ?? '',
    url: v.url,
    folder_id: folderId,
    added: v.added,
    updated: v.added,
    blurred: v.blurred ? 1 : 0,
    archived: v.archived ? 1 : 0,
    pub_date: v.pubDate ?? null,
    privacy: v.privacy ?? null,
  }
}

export function dbToVideo(d: DBVideo): Video {
  return {
    videoId: d.id,
    title: d.title,
    channel: d.channel,
    duration: d.duration,
    thumbnail: d.thumbnail,
    url: d.url,
    added: d.added,
    blurred: d.blurred === 1,
    archived: d.archived === 1,
    pubDate: d.pub_date ?? undefined,
    privacy: d.privacy ?? undefined,
  }
}

export function noteToDB(n: Note): DBNote {
  return {
    id: n.id,
    title: n.title,
    content: n.content,
    folder_id: n.folder,
    todos: JSON.stringify(n.todos),
    added: n.added,
    updated: n.updated,
  }
}

export function dbToNote(d: DBNote): Note {
  let todos = []
  try { todos = JSON.parse(d.todos) } catch { todos = [] }
  return {
    id: d.id,
    title: d.title,
    content: d.content,
    folder: d.folder_id,
    todos,
    added: d.added,
    updated: d.updated,
  }
}

export function folderToDB(f: Folder): DBFolder {
  return {
    id: f.name,
    name: f.name,
    color: f.color ?? null,
    created_at: Date.now(),
  }
}

export function dbToFolder(d: DBFolder): Folder {
  return {
    name: d.name,
    videoIds: [],
    color: d.color ?? undefined,
  }
}

export function bookmarkToDB(b: Bookmark): DBBookmark {
  return {
    id: b.id,
    url: b.url,
    title: b.title,
    image: b.image ?? null,
    added: b.added,
    blurred: b.blurred ? 1 : 0,
  }
}

export function dbToBookmark(d: DBBookmark): Bookmark {
  return {
    id: d.id,
    url: d.url,
    title: d.title,
    image: d.image ?? undefined,
    added: d.added,
    blurred: d.blurred === 1,
  }
}

export function directAccessToDB(d: DirectAccess): DBDirectAccess {
  return {
    id: d.id,
    url: d.url,
    title: d.title,
    image: d.image ?? null,
    added: d.added,
    blurred: d.blurred ? 1 : 0,
  }
}

export function dbToDirectAccess(d: DBDirectAccess): DirectAccess {
  return {
    id: d.id,
    url: d.url,
    title: d.title,
    image: d.image ?? undefined,
    added: d.added,
    blurred: d.blurred === 1,
  }
}

export function externalFileToDB(f: ExternalFile): DBExternalFile {
  return {
    id: f.id,
    name: f.name,
    path: f.path,
    size: f.size,
    mime_type: f.mimeType,
    added: f.added,
    blurred: f.blurred ? 1 : 0,
    folder_id: f.folder,
    thumbnail: f.thumbnail ?? null,
  }
}

export function dbToExternalFile(d: DBExternalFile): ExternalFile {
  return {
    id: d.id,
    name: d.name,
    path: d.path,
    size: d.size,
    mimeType: d.mime_type,
    added: d.added,
    blurred: d.blurred === 1,
    folder: d.folder_id,
    thumbnail: d.thumbnail ?? undefined,
  }
}
