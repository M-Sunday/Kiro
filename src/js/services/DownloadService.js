import { Api } from '../core/Api.js'
import { PlatformDetector } from '../platform/PlatformDetector.js'
import { PipedStreamService } from './PipedStreamService.js'
import { AndroidDownloadEngine } from './AndroidDownloadEngine.js'

export class DownloadService {
  constructor() {
    this.api = Api.getInstance()
    this.bus = this.api.bus
    this.state = this.api.state
    this._bindEvents()
  }

  _bindEvents() {
    this.bus.on('ui:download:start', (e) => this.startDownload(e.videoId, e.options))
  }

  async startDownload(videoId, options = {}) {
    if (PlatformDetector.isElectron()) {
      return this._electronDownload(videoId, options)
    }
    if (PlatformDetector.isNativeAndroid()) {
      return this._androidDownload(videoId, options)
    }
    this.bus.emit('download:not-supported', { videoId })
  }

  async _electronDownload(videoId, options) {
    this.bus.emit('download:started', { videoId })

    try {
      const video = await this.api.getRepository('videos').getById(videoId)
      if (!video) throw new Error('Video not found')

      const result = await this._executeIpcDownload(video.url, options)
      this.bus.emit('download:complete', { videoId, path: result.path })
      return result
    } catch (err) {
      this.bus.emit('download:failed', { videoId, error: err.message })
    }
  }

  async _androidDownload(videoId, options) {
    this.bus.emit('download:started', { videoId })

    try {
      const streamService = new PipedStreamService()
      const streamInfo = await streamService.getStreamURL(videoId, options)

      const engine = new AndroidDownloadEngine()
      const result = await engine.download(
        {
          url: streamInfo.url,
          filename: streamInfo.filename,
          contentLength: streamInfo.contentLength,
        },
        (progressData) => {
          this.bus.emit('download:progress', { videoId, ...progressData })
        }
      )

      this.bus.emit('download:complete', { videoId, path: result.path })
      return result
    } catch (err) {
      this.bus.emit('download:failed', { videoId, error: err.message })
    }
  }

  async _executeIpcDownload(url, options) {
    const { type = 'video', quality = '720', codec = 'h264',
            audioFormat = 'mp3', audioBitrate = 'auto' } = options

    return new Promise((resolve, reject) => {
      const { ipcRenderer } = window.require('electron')
      ipcRenderer.send('download-video', { url, type, quality, codec, audioFormat, audioBitrate })
      ipcRenderer.once('download-result', (event, result) => {
        if (result.error) reject(new Error(result.error))
        else resolve(result)
      })
    })
  }
}
