import { EventBus } from '../core/EventBus'

const YT_PATTERNS = [
  /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
]

const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.smnz.de',
]

export class SearchService {
  private _bus: EventBus

  constructor(bus: EventBus) {
    this._bus = bus
    this._bindEvents()
  }

  private _bindEvents(): void {
    this._bus.on('ui:search:video', (payload: { url: string }) => {
      void this.searchVideo(payload.url)
    })
  }

  getVideoId(url: string): string | null {
    for (const p of YT_PATTERNS) {
      const m = url.match(p)
      if (m?.[1]) return m[1]
    }
    return null
  }

  isYouTubeUrl(url: string): boolean {
    return this.getVideoId(url) !== null
  }

  async searchVideo(url: string): Promise<{
    videoId: string
    title: string
    channel: string
    duration: string
    thumbnail: string
    url: string
  } | null> {
    const videoId = this.getVideoId(url)
    if (!videoId) {
      this._bus.emit('search:not-youtube', { url })
      return null
    }

    this._bus.emit('search:started', { videoId })

    try {
      const data = await this._fetchOembed(videoId)
      const dataTitle = data['title'] as string | undefined
      const dataAuthor = data['author_name'] as string | undefined
      const metadata = {
        videoId,
        title: dataTitle ?? 'Unknown',
        channel: dataAuthor ?? 'Unknown',
        duration: '',
        thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        url: `https://youtube.com/watch?v=${videoId}`,
      }

      this._bus.emit('search:complete', { videoId, metadata })
      void this._enrichWithPiped(videoId, metadata)
      return { ...metadata }
    } catch (err) {
      this._bus.emit('search:failed', {
        videoId,
        error: (err as Error).message,
      })
      return null
    }
  }

  private async _enrichWithPiped(
    videoId: string,
    metadata: Record<string, unknown>
  ): Promise<void> {
    try {
      const extra = await this._fetchPiped(videoId)
      if (!extra) return

      let changed = false
      const extraTitle = extra['title'] as string | undefined
      const extraUploader = extra['uploader'] as string | undefined
      const extraDuration = extra['duration'] as string | undefined
      if (extraTitle && extraTitle !== metadata['title']) {
        metadata['title'] = extraTitle
        changed = true
      }
      if (extraUploader && extraUploader !== metadata['channel']) {
        metadata['channel'] = extraUploader
        changed = true
      }
      if (extraDuration) {
        metadata['duration'] = extraDuration
        changed = true
      }
      if (changed) {
        this._bus.emit('search:enriched', { videoId, metadata })
      }
    } catch {
      // Silent fail on enrichment
    }
  }

  private async _fetchOembed(
    videoId: string
  ): Promise<Record<string, unknown>> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)
    try {
      const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
      const res = await fetch(url, { signal: controller.signal })
      if (!res.ok) throw new Error(`oEmbed failed: ${res.status}`)
      return (await res.json()) as Record<string, unknown>
    } finally {
      clearTimeout(timer)
    }
  }

  private async _fetchPiped(
    videoId: string
  ): Promise<Record<string, unknown> | null> {
    for (const base of PIPED_INSTANCES) {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 5000)
      try {
        const res = await fetch(`${base}/streams/${videoId}`, {
          signal: controller.signal,
        })
        if (!res.ok) continue
        return (await res.json()) as Record<string, unknown>
      } catch {
        continue
      } finally {
        clearTimeout(timer)
      }
    }
    return null
  }
}
