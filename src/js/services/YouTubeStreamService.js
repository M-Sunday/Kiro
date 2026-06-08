import { Innertube } from 'youtubei.js'

let _instance = null

export class YouTubeStreamService {
  static getInstance() {
    if (!_instance) _instance = new YouTubeStreamService()
    return _instance
  }

  constructor() {
    this._yt = null
    this._initPromise = null
  }

  async _ensureSession() {
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

  async getStreamURL(videoId, options = {}) {
    const yt = await this._ensureSession()
    const { type = 'video', quality = '720', codec = 'h264' } = options

    const formatOptions = {
      type: type === 'audio' ? 'audio' : 'video+audio',
      quality: quality === 'max' ? 'best' : quality + 'p',
      format: 'mp4',
    }

    if (type === 'video' && codec !== 'h264') {
      formatOptions.codec = codec === 'av1' ? 'av01' : 'vp9'
    }

    const info = await yt.getInfo(videoId)
    const playability = info.playability_status?.status
    if (playability && playability !== 'OK') {
      throw new Error(`Video is not playable: ${playability}`)
    }

    const format = info.chooseFormat(formatOptions)
    if (!format) throw new Error('No suitable format found')

    const url = await format.decipher(yt.session.player)
    if (!url) throw new Error('Could not decipher stream URL')

    const filename = this._generateFilename(info, type, format)
    const contentLength = format.content_length || undefined

    return {
      url,
      mimeType: format.mime_type,
      contentLength,
      filename,
      quality: format.quality_label || quality + 'p',
      hasAudio: format.has_audio,
      hasVideo: format.has_video,
    }
  }

  _generateFilename(info, type, format) {
    const title = info.basic_info?.title || 'video'
    const safeTitle = title.replace(/[<>:"/\\|?*]/g, '_').substring(0, 100)
    if (type === 'audio') {
      const ext = format.mime_type?.includes('mp4') ? 'm4a' : 'webm'
      return `${safeTitle}.${ext}`
    }
    const mime = format.mime_type || ''
    const ext = mime.includes('mp4') ? 'mp4' : mime.includes('webm') ? 'webm' : 'mp4'
    return `${safeTitle}.${ext}`
  }
}
