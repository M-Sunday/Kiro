const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.syncpundit.io',
  'https://pipedapi.tokhmi.xyz',
  'https://pipedapi.moomoo.me',
  'https://api-piped.mha.fi',
  'https://pipedapi.rivo.lol',
  'https://pipedapi.leptons.xyz',
  'https://pipedapi-libre.kavin.rocks',
  'https://pipedapi.smnz.de',
  'https://pipedapi.adminforge.de',
]

export class PipedStreamService {
  async getStreamURL(videoId, options = {}) {
    const { type = 'video', quality = '720', codec = 'h264' } = options
    const data = await this._fetchStreams(videoId)
    if (!data) throw new Error('No stream data available from Piped API')

    const streams = type === 'audio' ? (data.audioStreams || []) : (data.videoStreams || [])
    if (!streams.length) throw new Error(`No ${type} streams available`)

    const targetHeight = quality === 'max' ? Infinity : parseInt(quality)
    const targetCodec = this._normalizeCodec(codec)

    let selected = null
    let bestScore = -1

    for (const s of streams) {
      let score = 0
      const height = s.height || 0

      // Prefer streams closest to target quality (not over)
      if (targetHeight === Infinity || height <= targetHeight) {
        score += height
      } else {
        continue
      }

      // Codec preference
      const streamCodec = (s.codec || s.mimeType || '').toLowerCase()
      if (targetCodec && streamCodec.includes(targetCodec)) {
        score += 10000 // codec match is most important
      }

      // Higher bitrate = better
      score += (s.bitrate || 0) / 1000

      if (score > bestScore) {
        bestScore = score
        selected = s
      }
    }

    if (!selected) {
      selected = streams.reduce((a, b) => ((a.height || 0) > (b.height || 0) ? a : b))
    }

    const filename = this._generateFilename(data, type, selected)

    return {
      url: selected.url,
      mimeType: selected.mimeType,
      contentLength: 0,
      filename,
      quality: selected.quality || quality + 'p',
      hasAudio: type === 'audio' || !!(selected.mimeType && selected.mimeType.includes('audio')),
      hasVideo: type === 'video' && !!(selected.mimeType && selected.mimeType.includes('video')),
    }
  }

  async _fetchStreams(videoId) {
    const errors = []
    for (const base of PIPED_INSTANCES) {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 12000)
      try {
        const res = await fetch(`${base}/streams/${videoId}`, { signal: controller.signal })
        if (!res.ok) {
          errors.push(`${base}: HTTP ${res.status}`)
          continue
        }
        return res.json()
      } catch (err) {
        const reason = err.name === 'AbortError' ? 'timeout' : err.message
        errors.push(`${base}: ${reason}`)
        continue
      } finally {
        clearTimeout(timer)
      }
    }
    console.warn('PipedStreamService: all instances failed', errors)
    return null
  }

  _normalizeCodec(codec) {
    if (codec === 'h264') return 'avc1'
    if (codec === 'av1') return 'av01'
    if (codec === 'vp9') return 'vp9'
    return codec
  }

  _generateFilename(data, type, stream) {
    const title = data.title || 'video'
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
