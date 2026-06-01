export class SearchService {
  constructor(eventBus) {
    this.bus = eventBus
    this._bindEvents()
  }

  _bindEvents() {
    this.bus.on('ui:search:video', (e) => this.searchVideo(e.url))
  }

  getVideoId(url) {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    ]
    for (const p of patterns) {
      const m = url.match(p)
      if (m) return m[1]
    }
    return null
  }

  isYouTubeUrl(url) {
    return this.getVideoId(url) !== null
  }

  async searchVideo(url) {
    const videoId = this.getVideoId(url)
    if (!videoId) {
      this.bus.emit('search:not-youtube', { url })
      return null
    }

    this.bus.emit('search:started', { videoId })

    try {
      const data = await this._fetchOembed(videoId)
      const metadata = {
        title: data.title || 'Unknown',
        channel: data.author_name || 'Unknown',
        duration: 0,
        thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        url: `https://youtube.com/watch?v=${videoId}`,
        videoId,
        privacy: 'public',
        pubDate: null,
      }

      this.bus.emit('search:complete', { videoId, metadata })

      this._enrichWithPiped(videoId, metadata)

      return { videoId, ...metadata }
    } catch (err) {
      this.bus.emit('search:failed', { videoId, error: err.message })
      return null
    }
  }

  async _enrichWithPiped(videoId, metadata) {
    try {
      const extra = await this._fetchPiped(videoId)
      if (!extra) return

      let changed = false
      if (extra.title && extra.title !== metadata.title) { metadata.title = extra.title; changed = true }
      if (extra.uploader && extra.uploader !== metadata.channel) { metadata.channel = extra.uploader; changed = true }
      if (extra.duration) { metadata.duration = extra.duration; changed = true }
      if (extra.publishDate) { metadata.pubDate = extra.publishDate; changed = true }
      if (extra.privacyStatus) { metadata.privacy = extra.privacyStatus; changed = true }
      if (changed) {
        this.bus.emit('search:enriched', { videoId, metadata })
      }
    } catch {}
  }

  async _fetchOembed(videoId) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)
    try {
      const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
      const res = await fetch(url, { signal: controller.signal })
      if (!res.ok) throw new Error(`oEmbed failed: ${res.status}`)
      return res.json()
    } finally {
      clearTimeout(timer)
    }
  }

  async _fetchPiped(videoId) {
    const instances = [
      'https://pipedapi.kavin.rocks',
      'https://pipedapi.smnz.de',
    ]
    for (const base of instances) {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 5000)
      try {
        const res = await fetch(`${base}/streams/${videoId}`, { signal: controller.signal })
        if (!res.ok) continue
        return res.json()
      } catch {
        continue
      } finally {
        clearTimeout(timer)
      }
    }
    return null
  }
}
