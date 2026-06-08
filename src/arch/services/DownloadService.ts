import { EventBus } from '../core/EventBus'
import { AppStateManager } from '../core/AppState'
import { PipedStreamService } from './PipedStreamService'

type CapacitorFilesystem = {
  writeFile: (opts: { path: string; data: string; directory: string }) => Promise<void>
  appendFile: (opts: { path: string; data: string; directory: string }) => Promise<void>
}

export class DownloadService {
  private _bus: EventBus
  private _state: AppStateManager

  constructor(bus: EventBus, state: AppStateManager) {
    this._bus = bus
    this._state = state
    this._bindEvents()
  }

  private _bindEvents(): void {
    this._bus.on(
      'ui:download:start',
      (payload: { videoId: string; options?: Record<string, unknown> }) => {
        void this.startDownload(payload.videoId, payload.options)
      }
    )
  }

  async startDownload(
    videoId: string,
    options?: Record<string, unknown>
  ): Promise<void> {
    const isElectron = this._state.get<boolean>('platform.isElectron')
    const isNative = this._state.get<boolean>('platform.isNative')

    if (isElectron) {
      this._bus.emit('download:started', { videoId })
      this._bus.emit('download:complete', { videoId, path: '' })
      return
    }

    if (isNative) {
      await this._androidDownload(videoId, options)
      return
    }

    this._bus.emit('download:not-supported', { videoId })
  }

  private async _androidDownload(
    videoId: string,
    options?: Record<string, unknown>
  ): Promise<void> {
    this._bus.emit('download:started', { videoId })

    try {
      const prefs = {
        type: ((options?.['type'] as string) || localStorage.getItem('dlType') || 'video') as 'video' | 'audio',
        quality: (options?.['quality'] as string) || localStorage.getItem('dlVideoQuality') || '720',
        codec: (options?.['codec'] as string) || localStorage.getItem('dlVideoCodec') || 'h264',
      }

      const streamService = new PipedStreamService()
      const streamInfo = await streamService.getStreamURL(videoId, prefs)
      const totalBytes = streamInfo.contentLength || 0

      const capacitor = (window as unknown as Record<string, unknown>)['Capacitor'] as
        | { Plugins: { Filesystem: CapacitorFilesystem } }
        | undefined
      if (!capacitor?.Plugins?.Filesystem) throw new Error('Capacitor Filesystem not available')

      const Filesystem = capacitor.Plugins.Filesystem
      const filePath = `Kiro/${streamInfo.filename}`
      const fileOpts = { path: filePath, directory: 'DOWNLOADS' as const }
      const CHUNK_SIZE = 2 * 1024 * 1024
      let downloadedBytes = 0

      await Filesystem.writeFile({ ...fileOpts, data: '' })

      while (downloadedBytes < totalBytes) {
        const end = Math.min(downloadedBytes + CHUNK_SIZE - 1, totalBytes - 1)
        const response = await fetch(streamInfo.url, {
          headers: { Range: `bytes=${downloadedBytes}-${end}` },
        })
        if (!response.ok && response.status !== 206) {
          throw new Error(`HTTP ${response.status}`)
        }

        const buffer = await response.arrayBuffer()
        const base64 = _arrayBufferToBase64(buffer)

        await Filesystem.appendFile({ ...fileOpts, data: base64 })

        downloadedBytes += buffer.byteLength
        this._bus.emit('download:progress', {
          videoId,
          loaded: downloadedBytes,
          total: totalBytes,
          percent: Math.min(100, (downloadedBytes / totalBytes) * 100),
        })
      }

      this._bus.emit('download:complete', { videoId, path: filePath })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      this._bus.emit('download:failed', { videoId, error: message })
    }
  }
}

function _arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }
  return btoa(binary)
}
