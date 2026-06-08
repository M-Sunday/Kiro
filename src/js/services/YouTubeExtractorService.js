export class YouTubeExtractorService {
  async getStreamURL(videoId, options = {}) {
    console.log('[Extractor] getStreamURL called, options:', options)
    const { type = 'video', quality = '720', codec = 'h264' } = options
    const data = await this._extractPlayerResponse(videoId)
    if (!data) throw new Error('Could not extract stream data from YouTube')
    console.log('[Extractor] Got player response data')

    const streamingData = data.streamingData
    if (!streamingData) throw new Error('No streaming data available')
    console.log('[Extractor] streamingData exists, formats:', streamingData.formats?.length, 'adaptiveFormats:', streamingData.adaptiveFormats?.length)

    const streams = type === 'audio'
      ? (streamingData.adaptiveFormats || []).filter(s => s.mimeType && s.mimeType.startsWith('audio/'))
      : (streamingData.formats || streamingData.adaptiveFormats || []).filter(s => s.mimeType && s.mimeType.startsWith('video/'))
    console.log('[Extractor] Filtered streams count:', streams.length)

    if (!streams.length) {
      console.log('[Extractor] No streams found in filter, trying all')
      const all = streamingData.adaptiveFormats || streamingData.formats || []
      if (!all.length) throw new Error('No streams available')
      streams.push(...all)
    }

    const targetHeight = quality === 'max' ? Infinity : parseInt(quality)
    const targetCodec = this._normalizeCodec(codec)

    let selected = null
    let bestScore = -1

    console.log('[Extractor] Scoring streams, targetHeight:', targetHeight, 'targetCodec:', targetCodec)
    for (const s of streams) {
      if (!s.url) continue
      let score = 0
      const height = s.height || 0

      if (type === 'audio') {
        score += (s.bitrate || 0) / 1000
        const streamCodec = (s.mimeType || '').toLowerCase()
        if (streamCodec.includes('mp4') || streamCodec.includes('m4a')) score += 5000
        if (streamCodec.includes('opus')) score += 3000
      } else {
        if (targetHeight === Infinity || height <= targetHeight) {
          score += height
        } else {
          continue
        }

        const streamCodec = (s.mimeType || '').toLowerCase()
        if (targetCodec && streamCodec.includes(targetCodec)) {
          score += 10000
        }

        score += (s.bitrate || 0) / 1000
      }

      if (score > bestScore) {
        bestScore = score
        selected = s
      }
    }

    if (!selected) selected = streams[0]
    if (!selected) throw new Error('No suitable stream found')
    console.log('[Extractor] Selected stream:', selected.qualityLabel, selected.mimeType)

    const filename = this._generateFilename(data, type, selected)
    const channelId = data.videoDetails?.channelId || null
    console.log('[Extractor] Filename:', filename, 'ChannelId:', channelId)
    if (channelId) {
      console.log('[Extractor] Starting avatar fetch (fire-and-forget)')
      this._fetchChannelAvatar(channelId).catch(() => {})
    }

    console.log('[Extractor] Returning stream info')
    return {
      url: selected.url,
      mimeType: selected.mimeType,
      contentLength: parseInt(selected.contentLength || '0'),
      filename,
      quality: selected.qualityLabel || quality + 'p',
      hasAudio: !!(selected.mimeType && selected.mimeType.includes('audio')),
      hasVideo: !!(selected.mimeType && selected.mimeType.includes('video')),
      channelId,
      channelAvatarUrl: null,
    }
  }

  async _extractPlayerResponse(videoId) {
    console.log('[Extractor] Starting extraction for', videoId)
    const url = `https://www.youtube.com/watch?v=${videoId}`
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 14; Nothing Phone 2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.147 Mobile Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    }
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15000)
    let html
    try {
      if (window.Capacitor?.isNativePlatform?.()) {
        console.log('[Extractor] Using CapacitorHttp')
        const { CapacitorHttp } = await import('@capacitor/core')
        console.log('[Extractor] About to fetch YouTube page')
        const res = await CapacitorHttp.get({ url, headers, responseType: 'text', connectTimeout: 10000, readTimeout: 15000 })
        console.log('[Extractor] Got response, status:', res.status)
        if (res.status < 200 || res.status >= 300) throw new Error(`HTTP ${res.status}`)
        html = res.data
        console.log('[Extractor] HTML length:', html?.length)
      } else {
        console.log('[Extractor] Using fetch()')
        const res = await fetch(url, { signal: controller.signal, headers })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        html = await res.text()
        console.log('[Extractor] HTML length:', html?.length)
      }
    } finally {
      clearTimeout(timer)
    }
    const match = html.match(/ytInitialPlayerResponse\s*=\s*({.*?});\s*(?:var|<\/script)/)
    if (!match) throw new Error('Could not find player response in page')
    console.log('[Extractor] Parsed player response successfully')
    return JSON.parse(match[1])
  }

  async _fetchChannelAvatar(channelId) {
    const url = `https://www.youtube.com/channel/${channelId}`
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 14; Nothing Phone 2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.147 Mobile Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    }
    let html
    if (window.Capacitor?.isNativePlatform?.()) {
      const { CapacitorHttp } = await import('@capacitor/core')
      const res = await CapacitorHttp.get({ url, headers, responseType: 'text', connectTimeout: 10000, readTimeout: 10000 })
      if (res.status < 200 || res.status >= 300) throw new Error(`HTTP ${res.status}`)
      html = res.data
    } else {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 10000)
      try {
        const res = await fetch(url, { headers, signal: controller.signal })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        html = await res.text()
      } finally {
        clearTimeout(timer)
      }
    }
    const match = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"\s*\/?>/i)
    if (!match) throw new Error('Could not find channel avatar in page')
    return match[1]
  }

  _normalizeCodec(codec) {
    if (codec === 'h264') return 'avc1'
    if (codec === 'av1') return 'av01'
    if (codec === 'vp9') return 'vp9'
    return codec
  }

  _generateFilename(data, type, stream) {
    const title = (data.videoDetails && data.videoDetails.title) || 'video'
    const safeTitle = title.replace(/[<>:"/\\|?*]/g, '_').substring(0, 100)
    const mime = (stream.mimeType || '').split(';')[0]
    if (type === 'audio') {
      const ext = mime.includes('mp4') || mime.includes('m4a') ? 'm4a' : mime.includes('ogg') ? 'ogg' : 'webm'
      return `${safeTitle}.${ext}`
    }
    const ext = mime.includes('mp4') ? 'mp4' : mime.includes('webm') ? 'webm' : 'mp4'
    return `${safeTitle}.${ext}`
  }
}
