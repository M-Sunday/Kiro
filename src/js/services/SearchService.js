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
      const metadata = await this.fetchYouTubeMetadata(videoId)
      this.bus.emit('search:complete', { videoId, metadata })
      return { videoId, ...metadata }
    } catch (err) {
      this.bus.emit('search:failed', { videoId, error: err.message })
      return null
    }
  }

  async fetchYouTubeMetadata(videoId) {
    const data = await this._fetchOembed(videoId)
    let extra = {}
    try { extra = await this._fetchPiped(videoId) } catch {}

    return {
      title: data.title || extra.title || 'Unknown',
      channel: data.author_name || extra.uploader || 'Unknown',
      duration: extra.duration || 0,
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      url: `https://youtube.com/watch?v=${videoId}`,
      videoId,
      privacy: extra.privacy || 'public',
      pubDate: data.pubDate || extra.publishDate || null,
    }
  }

  async _fetchOembed(videoId) {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`oEmbed failed: ${res.status}`)
    return res.json()
  }

  async _fetchPiped(videoId) {
    const instances = [
      'https://pipedapi.kavin.rocks',
      'https://pipedapi.smnz.de',
    ]
    for (const base of instances) {
      try {
        const res = await fetch(`${base}/streams/${videoId}`)
        if (!res.ok) continue
        return res.json()
      } catch {}
    }
    return {}
  }
}
