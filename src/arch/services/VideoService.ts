import type { Video, VideoRepository } from '../../shared/types'
import { EventBus } from '../core/EventBus'
import { AppStateManager } from '../core/AppState'

export class VideoService {
  private _repo: VideoRepository
  private _bus: EventBus
  private _state: AppStateManager

  constructor(repo: VideoRepository, bus: EventBus, state: AppStateManager) {
    this._repo = repo
    this._bus = bus
    this._state = state
    this._bindEvents()
  }

  private _bindEvents(): void {
    this._bus.on('ui:video:create', (payload: { data: Partial<Video> }) => {
      void this.createVideo(payload.data)
    })
    this._bus.on(
      'ui:video:delete',
      (payload: { id: string; folder?: string }) => {
        void this.deleteVideo(payload.id, payload.folder)
      }
    )
    this._bus.on(
      'ui:video:move',
      (payload: { id: string; from: string; to: string }) => {
        void this.moveVideo(payload.id, payload.from, payload.to)
      }
    )
    this._bus.on('ui:video:pin', (payload: { id: string }) => {
      void this.togglePin(payload.id)
    })
    this._bus.on('ui:video:archive', (payload: { id: string }) => {
      void this.toggleArchive(payload.id)
    })
    this._bus.on('ui:video:blur', (payload: { id: string }) => {
      void this.toggleBlur(payload.id)
    })
  }

  async createVideo(data: Partial<Video>): Promise<Video | null> {
    const video: Video = {
      videoId: data.videoId ?? '',
      title: data.title ?? '',
      channel: data.channel ?? '',
      duration: data.duration ?? '',
      thumbnail: data.thumbnail ?? '',
      url: data.url ?? '',
      added: data.added ?? Date.now(),
      blurred: data.blurred ?? false,
      archived: data.archived ?? false,
      pubDate: data.pubDate ?? null,
      privacy: data.privacy ?? 'PUBLIC',
    }
    if (!video.videoId) return null
    await this._repo.save(video)
    this._state.set(`videos.${video.videoId}`, video)
    this._bus.emit('data:video:created', { video })
    return video
  }

  async deleteVideo(videoId: string, folderName?: string): Promise<void> {
    const video = await this._repo.getById(videoId)
    if (!video) return
    await this._repo.delete(videoId)
    this._state.set(`videos.${videoId}`, undefined)
    this._bus.emit('data:video:deleted', { videoId })
  }

  async moveVideo(
    videoId: string,
    fromFolder: string,
    toFolder: string
  ): Promise<void> {
    await this._repo.getById(videoId) // verify exists
    this._bus.emit('data:video:moved', { videoId, fromFolder, toFolder })
  }

  async togglePin(videoId: string): Promise<boolean> {
    const current = this._state.get<string[]>('pins') ?? []
    const exists = current.includes(videoId)
    const pins = exists
      ? current.filter((id) => id !== videoId)
      : [...current, videoId]
    this._state.set('pins', pins)
    this._bus.emit('data:video:pin-toggled', { videoId, pinned: !exists })
    return !exists
  }

  async toggleArchive(videoId: string): Promise<boolean | undefined> {
    const video = await this._repo.getById(videoId)
    if (!video) return
    video.archived = !video.archived
    await this._repo.save(video)
    this._state.set(`videos.${videoId}.archived`, video.archived)
    this._bus.emit('data:video:archive-toggled', {
      videoId,
      archived: video.archived,
    })
    return video.archived
  }

  async toggleBlur(videoId: string): Promise<boolean | undefined> {
    const video = await this._repo.getById(videoId)
    if (!video) return
    video.blurred = !video.blurred
    await this._repo.save(video)
    this._state.set(`videos.${videoId}.blurred`, video.blurred)
    this._bus.emit('data:video:blur-toggled', { videoId, blurred: video.blurred })
    return video.blurred
  }

  async getVideo(videoId: string): Promise<Video | null> {
    return this._repo.getById(videoId)
  }

  async getAllVideos(): Promise<Video[]> {
    return this._repo.getAll()
  }

  async searchVideos(query: string): Promise<Video[]> {
    if (!this._repo.search) return []
    return this._repo.search(query)
  }
}
