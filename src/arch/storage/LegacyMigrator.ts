import type { StorageAdapter, Video, Note, Folder, FolderMeta, Bookmark, DirectAccess, ExternalFile } from '../../shared/types'

export interface LegacyData {
  videos: Map<string, Video>
  folders: Map<string, string[]>
  folderMeta: Map<string, FolderMeta>
  notes: Note[]
  bookmarks: Bookmark[]
  directAccess: DirectAccess[]
  externalFiles: ExternalFile[]
  settings: Map<string, unknown>
  pins: string[]
  nsfw: string[]
  blurAllNSFW: boolean
  collapsed: Record<string, boolean>
}

export class LegacyMigrator {
  constructor(
    private _source: StorageAdapter,
    private _target: StorageAdapter,
  ) {}

  async readLegacyData(): Promise<LegacyData> {
    const [videosArr, foldersArr, folderMetaArr, notes, bookmarks, directAccess, settingsArr] =
      await Promise.all([
        this._source.getAll<Video>('videos'),
        this._source.getAll<Folder>('folders'),
        this._source.getAll<FolderMeta>('folderMeta'),
        this._source.getAll<Note>('notes'),
        this._source.getAll<Bookmark>('bookmarks'),
        this._source.getAll<DirectAccess>('directAccess'),
        this._source.getAll<{ name: string; value: unknown }>('settings'),
      ])

    const extArr = await this._source.getAll<ExternalFile>('directAccess')
      .then(() => this._source.getAll<ExternalFile>('videos').then(() => []))
      .catch(() => [])

    const videos = new Map<string, Video>()
    for (const v of videosArr) {
      videos.set(v.videoId, v)
    }

    const folders = new Map<string, string[]>()
    for (const f of foldersArr) {
      folders.set(f.name, f.videoIds)
    }

    const folderMeta = new Map<string, FolderMeta>()
    for (const fm of folderMetaArr) {
      folderMeta.set(fm.name ?? '', fm)
    }

    const settings = new Map<string, unknown>()
    let pins: string[] = []
    let nsfw: string[] = []
    let blurAllNSFW = false
    let collapsed: Record<string, boolean> = {}

    for (const entry of settingsArr) {
      settings.set(entry.name, entry.value)
      if (entry.name === 'pins') pins = (entry.value as string[]) ?? []
      if (entry.name === 'nsfw') nsfw = (entry.value as string[]) ?? []
      if (entry.name === 'blurAllNSFW') blurAllNSFW = entry.value === true
      if (entry.name === 'collapsed') collapsed = (entry.value as Record<string, boolean>) ?? {}
    }

    return { videos, folders, folderMeta, notes, bookmarks, directAccess, externalFiles: extArr, settings, pins, nsfw, blurAllNSFW, collapsed }
  }

  async migrate(): Promise<{ success: boolean; counts: Record<string, number>; error?: string }> {
    try {
      const data = await this.readLegacyData()
      return this._writeToTarget(data)
    } catch (err) {
      return { success: false, counts: {}, error: String(err) }
    }
  }

  private async _writeToTarget(data: LegacyData): Promise<{ success: boolean; counts: Record<string, number> }> {
    let videoCount = 0
    let noteCount = 0
    let folderCount = 0
    let bookmarkCount = 0
    let daCount = 0
    let extCount = 0

    await this._target.transaction(async () => {
      // Migrate videos with folder_id from folder membership
      const folderToId = new Map<string, string>()
      for (const [name, videoIds] of data.folders) {
        const folderId = name
        folderToId.set(name, folderId)
        await this._target.put('folders', {
          id: folderId,
          name,
          videoIds,
          created_at: Date.now(),
        })
        folderCount++
      }

      for (const [, video] of data.videos) {
        let folderId: string | null = null
        for (const [name, ids] of data.folders) {
          if (ids.includes(video.videoId)) {
            folderId = name
            break
          }
        }
        await this._target.put('videos', {
          id: video.videoId,
          title: video.title,
          channel: video.channel,
          duration: video.duration,
          thumbnail: video.thumbnail ?? '',
          url: video.url,
          folder_id: folderId,
          added: video.added,
          updated: video.added,
          blurred: video.blurred ? 1 : 0,
          archived: video.archived ? 1 : 0,
          pub_date: video.pubDate ?? null,
          privacy: video.privacy ?? null,
        })
        videoCount++
      }

      for (const note of data.notes) {
        await this._target.put('notes', {
          id: note.id,
          title: note.title,
          content: note.content,
          folder_id: note.folder,
          todos: JSON.stringify(note.todos),
          added: note.added,
          updated: note.updated,
        })
        noteCount++
      }

      for (const bm of data.bookmarks) {
        await this._target.put('bookmarks', {
          id: bm.id,
          url: bm.url,
          title: bm.title,
          image: bm.image ?? null,
          added: bm.added,
          blurred: bm.blurred ? 1 : 0,
        })
        bookmarkCount++
      }

      for (const da of data.directAccess) {
        await this._target.put('direct_access', {
          id: da.id,
          url: da.url,
          title: da.title,
          image: da.image ?? null,
          added: da.added,
          blurred: da.blurred ? 1 : 0,
        })
        daCount++
      }

      for (const ext of data.externalFiles) {
        await this._target.put('external_files', {
          id: ext.id,
          name: ext.name,
          path: ext.path,
          size: ext.size,
          mime_type: ext.mimeType,
          added: ext.added,
          blurred: ext.blurred ? 1 : 0,
          folder_id: ext.folder,
          thumbnail: ext.thumbnail ?? null,
        })
        extCount++
      }

      // Persist settings
      for (const [key, value] of data.settings) {
        await this._target.put('settings', { key, value: JSON.stringify(value) })
      }

      // Persist pins, nsfw, etc as settings
      await this._target.put('settings', { key: 'pins', value: JSON.stringify(data.pins) })
      await this._target.put('settings', { key: 'nsfw', value: JSON.stringify(data.nsfw) })
      await this._target.put('settings', { key: 'blurAllNSFW', value: JSON.stringify(data.blurAllNSFW) })
      await this._target.put('settings', { key: 'collapsed', value: JSON.stringify(data.collapsed) })
    })

    return {
      success: true,
      counts: {
        videos: videoCount,
        notes: noteCount,
        folders: folderCount,
        bookmarks: bookmarkCount,
        directAccess: daCount,
        externalFiles: extCount,
      },
    }
  }
}
