import { Api } from '../core/Api.js'
import { PlatformDetector } from '../platform/PlatformDetector.js'

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
    if (!PlatformDetector.isElectron()) {
      this.bus.emit('download:not-supported', { videoId })
      return
    }

    this.bus.emit('download:started', { videoId })

    try {
      const video = await this.api.getRepository('videos').getById(videoId)
      if (!video) throw new Error('Video not found')

      const result = await this._executeDownload(video.url, options)
      this.bus.emit('download:complete', { videoId, path: result.path })
      return result
    } catch (err) {
      this.bus.emit('download:failed', { videoId, error: err.message })
    }
  }

  async _executeDownload(url, options) {
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
