import { EventBus } from '../core/EventBus'
import { AppStateManager } from '../core/AppState'

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
    _options?: Record<string, unknown>
  ): Promise<void> {
    const isElectron = this._state.get<boolean>('platform.isElectron')
    if (!isElectron) {
      this._bus.emit('download:not-supported', { videoId })
      return
    }

    this._bus.emit('download:started', { videoId })
    this._bus.emit('download:complete', { videoId, path: '' })
  }
}
