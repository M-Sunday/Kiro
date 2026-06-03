import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EventBus } from '../core/EventBus'
import { AppStateManager } from '../core/AppState'
import { VideoService } from '../services/VideoService'
import type { Video, VideoRepository } from '../../shared/types'

class MockVideoRepo implements VideoRepository {
  private _videos = new Map<string, Video>()

  async getById(id: string): Promise<Video | null> {
    return this._videos.get(id) ?? null
  }

  async getAll(): Promise<Video[]> {
    return Array.from(this._videos.values())
  }

  async save(video: Video): Promise<string> {
    this._videos.set(video.videoId, video)
    return video.videoId
  }

  async delete(id: string): Promise<void> {
    this._videos.delete(id)
  }

  async getByFolder(_folder: string): Promise<Video[]> {
    return []
  }

  async search(_query: string): Promise<Video[]> {
    return []
  }
}

describe('VideoService', () => {
  let bus: EventBus
  let state: AppStateManager
  let repo: MockVideoRepo
  let service: VideoService

  beforeEach(() => {
    bus = new EventBus()
    state = new AppStateManager(bus)
    repo = new MockVideoRepo()
    service = new VideoService(repo, bus, state)
  })

  it('should create a video via event', async () => {
    const handler = vi.fn()
    bus.on('data:video:created', handler)

    bus.emit('ui:video:create', {
      data: {
        videoId: 'abc123',
        title: 'Test Video',
        channel: 'Test Channel',
        duration: '5:00',
      },
    })

    await vi.waitFor(() => {
      const video = state.get<Video>('videos.abc123')
      expect(video).toBeTruthy()
      expect(video?.title).toBe('Test Video')
    })

    expect(handler).toHaveBeenCalled()
  })

  it('should toggle pin state', async () => {
    state.set('pins', [])
    const pinned = await service.togglePin('video1')
    expect(pinned).toBe(true)
    expect(state.get<string[]>('pins')).toContain('video1')

    const unpinned = await service.togglePin('video1')
    expect(unpinned).toBe(false)
    expect(state.get<string[]>('pins')).not.toContain('video1')
  })

  it('should toggle blur state', async () => {
    const video: Video = {
      videoId: 'abc',
      title: 'Test',
      channel: 'Chan',
      duration: '1:00',
      thumbnail: '',
      url: '',
      added: Date.now(),
      blurred: false,
      archived: false,
    }
    await repo.save(video)

    const blurred = await service.toggleBlur('abc')
    expect(blurred).toBe(true)

    const updated = await repo.getById('abc')
    expect(updated?.blurred).toBe(true)
  })

  it('should delete a video', async () => {
    const video: Video = {
      videoId: 'abc',
      title: 'Test',
      channel: 'Chan',
      duration: '1:00',
      thumbnail: '',
      url: '',
      added: Date.now(),
      blurred: false,
      archived: false,
    }
    await repo.save(video)

    const handler = vi.fn()
    bus.on('data:video:deleted', handler)

    await service.deleteVideo('abc')
    const deleted = await repo.getById('abc')
    expect(deleted).toBeNull()
    expect(handler).toHaveBeenCalledWith({ videoId: 'abc' })
  })
})
