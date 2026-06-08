import { Innertube, Misc } from 'youtubei.js'

type Format = Misc.Format

interface StreamOptions {
  type?: 'video' | 'audio'
  quality?: string
  codec?: string
}

interface StreamInfo {
  url: string
  mimeType: string
  contentLength?: number
  filename: string
  quality: string
  hasAudio: boolean
  hasVideo: boolean
}

type InnertubeInstance = Awaited<ReturnType<typeof Innertube.create>>
type VideoInfo = Awaited<ReturnType<InnertubeInstance['getInfo']>>

let _instance: YouTubeStreamService | null = null

export class YouTubeStreamService {
  static getInstance(): YouTubeStreamService {
    if (!_instance) _instance = new YouTubeStreamService()
    return _instance
  }

  private _yt: InnertubeInstance | null = null
  private _initPromise: Promise<InnertubeInstance> | null = null

  private async _ensureSession(): Promise<InnertubeInstance> {
    if (this._yt) return this._yt
    if (!this._initPromise) {
      this._initPromise = Innertube.create({
        retrieve_player: true,
      }).then(yt => {
        this._yt = yt
        return yt
      })
    }
    return this._initPromise
  }

  async getStreamURL(videoId: string, options: StreamOptions = {}): Promise<StreamInfo> {
    const yt = await this._ensureSession()
    const { type = 'video', quality = '720', codec = 'h264' } = options

    const formatOptions: Record<string, unknown> = {
      type: type === 'audio' ? 'audio' : 'video+audio',
      quality: quality === 'max' ? 'best' : quality + 'p',
      format: 'mp4',
    }

    if (type === 'video' && codec !== 'h264') {
      formatOptions['codec'] = codec === 'av1' ? 'av01' : 'vp9'
    }

    const info = await yt.getInfo(videoId)
    const playability = info.playability_status?.status
    if (playability && playability !== 'OK') {
      throw new Error(`Video is not playable: ${playability}`)
    }

    const format = info.chooseFormat(formatOptions as Parameters<VideoInfo['chooseFormat']>[0])
    if (!format) throw new Error('No suitable format found')

    const url = await format.decipher(yt.session.player)
    if (!url) throw new Error('Could not decipher stream URL')

    const filename = this._generateFilename(info, type, format)
    const contentLength = format.content_length ?? undefined

    return {
      url,
      mimeType: format.mime_type,
      contentLength,
      filename,
      quality: format.quality_label ?? quality + 'p',
      hasAudio: format.has_audio,
      hasVideo: format.has_video,
    }
  }

  private _generateFilename(info: VideoInfo, type: string, format: Format): string {
    const title = info.basic_info?.title ?? 'video'
    const safeTitle = title.replace(/[<>:"/\\|?*]/g, '_').substring(0, 100)
    if (type === 'audio') {
      const ext = format.mime_type?.includes('mp4') ? 'm4a' : 'webm'
      return `${safeTitle}.${ext}`
    }
    const mime = format.mime_type ?? ''
    const ext = mime.includes('mp4') ? 'mp4' : mime.includes('webm') ? 'webm' : 'mp4'
    return `${safeTitle}.${ext}`
  }
}
