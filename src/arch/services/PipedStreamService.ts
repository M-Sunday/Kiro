interface PipedStream {
  url: string
  quality?: string
  mimeType: string
  codec?: string
  bitrate?: number
  height?: number
  width?: number
  fps?: number
}

interface PipedStreamsResponse {
  title?: string
  duration?: number
  videoStreams?: PipedStream[]
  audioStreams?: PipedStream[]
  videoOnlyStreams?: PipedStream[]
  selectedVideoStream?: PipedStream
}

interface StreamOptions {
  type?: 'video' | 'audio'
  quality?: string
  codec?: string
}

interface StreamInfo {
  url: string
  mimeType: string
  contentLength: number
  filename: string
  quality: string
  hasAudio: boolean
  hasVideo: boolean
}

const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.smnz.de',
  'https://pipedapi.syncpundit.com',
  'https://pipedapi.adminforge.de',
]

let _instance: PipedStreamService | null = null

export class PipedStreamService {
  static getInstance(): PipedStreamService {
    if (!_instance) _instance = new PipedStreamService()
    return _instance
  }

  async getStreamURL(videoId: string, options: StreamOptions = {}): Promise<StreamInfo> {
    const { type = 'video', quality = '720', codec = 'h264' } = options
    const data = await this._fetchStreams(videoId)
    if (!data) throw new Error('No stream data available from Piped API')

    const streams = type === 'audio' ? (data.audioStreams ?? []) : (data.videoStreams ?? [])
    if (!streams.length) throw new Error(`No ${type} streams available`)

    const targetHeight = quality === 'max' ? Infinity : parseInt(quality)
    const targetCodec = this._normalizeCodec(codec)

    let selected: PipedStream | null = null
    let bestScore = -1

    for (const s of streams) {
      let score = 0
      const height = s.height ?? 0

      if (targetHeight === Infinity || height <= targetHeight) {
        score += height
      } else {
        continue
      }

      const streamCodec = (s.codec ?? s.mimeType ?? '').toLowerCase()
      if (targetCodec && streamCodec.includes(targetCodec)) {
        score += 10000
      }

      score += (s.bitrate ?? 0) / 1000

      if (score > bestScore) {
        bestScore = score
        selected = s
      }
    }

    if (!selected) {
      selected = streams.reduce((a, b) => ((a.height ?? 0) > (b.height ?? 0) ? a : b))
    }

    const filename = this._generateFilename(data, type, selected)
    const mime = selected.mimeType ?? ''

    return {
      url: selected.url,
      mimeType: mime,
      contentLength: 0,
      filename,
      quality: selected.quality ?? quality + 'p',
      hasAudio: type === 'audio' || mime.includes('audio'),
      hasVideo: type === 'video' && mime.includes('video'),
    }
  }

  private async _fetchStreams(videoId: string): Promise<PipedStreamsResponse | null> {
    for (const base of PIPED_INSTANCES) {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 8000)
      try {
        const res = await fetch(`${base}/streams/${videoId}`, { signal: controller.signal })
        if (!res.ok) continue
        return (await res.json()) as PipedStreamsResponse
      } catch {
        continue
      } finally {
        clearTimeout(timer)
      }
    }
    return null
  }

  private _normalizeCodec(codec: string): string {
    if (codec === 'h264') return 'avc1'
    if (codec === 'av1') return 'av01'
    if (codec === 'vp9') return 'vp9'
    return codec
  }

  private _generateFilename(
    data: PipedStreamsResponse,
    type: string,
    stream: PipedStream
  ): string {
    const title = data.title ?? 'video'
    const safeTitle = title.replace(/[<>:"/\\|?*]/g, '_').substring(0, 100)
    const mime = (stream.mimeType ?? '').split(';')[0] ?? ''
    if (type === 'audio') {
      const ext = mime.includes('mp4') || mime.includes('m4a') ? 'm4a' : mime.includes('ogg') ? 'ogg' : 'webm'
      return `${safeTitle}.${ext}`
    }
    const ext = mime.includes('mp4') ? 'mp4' : mime.includes('webm') ? 'webm' : 'mp4'
    return `${safeTitle}.${ext}`
  }
}
