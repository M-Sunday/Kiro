import type { EventBus } from '../core/EventBus'
import type { AppStateManager } from '../core/AppState'
import type { ExternalFile } from '../../shared/types'
import { PermissionService } from '../platform/PermissionService'

export class CameraService {
  constructor(
    private bus: EventBus,
    private state: AppStateManager,
    private permissions: PermissionService,
  ) {
    this.bus.on('ui:camera:open', () => this._handleOpen())
  }

  private async _handleOpen(): Promise<void> {
    try {
      const result = await this.permissions.request('camera')
      if (result !== 'granted') {
        this.bus.emit('ui:permission:denied', { type: 'camera' })
        return
      }
      const photo = await this._capture()
      if (!photo) return
      this._store(photo)
    } catch (err) {
      console.warn('[CameraService] _handleOpen failed:', err)
    }
  }

  private async _capture(): Promise<{ dataUrl: string; name: string } | null> {
    const isNative = this.state.get<boolean>('platform.isNative') ?? false
    const isElectron = this.state.get<boolean>('platform.isElectron') ?? false

    if (isNative && typeof window !== 'undefined' && (window as any).Capacitor?.Plugins?.Camera) {
      return this._captureCapacitor()
    }
    if (isElectron) {
      return this._captureElectron()
    }
    return null
  }

  private async _captureCapacitor(): Promise<{ dataUrl: string; name: string } | null> {
    try {
      const Camera = (window as any).Capacitor.Plugins.Camera
      const image = await Camera.getPhoto({ quality: 90, source: 'CAMERA', saveToGallery: false })
      const dataUrl = image.webPath ?? image.dataUrl ?? image.thumbnail ?? ''
      if (!dataUrl) return null
      const name = `Photo_${new Date().toISOString().slice(0, 10)}_${Date.now()}.jpg`
      return { dataUrl, name }
    } catch (err: any) {
      if (!err.message?.includes?.('cancel')) {
        console.warn('[CameraService] Capacitor capture failed:', err)
      }
      return null
    }
  }

  private async _captureElectron(): Promise<{ dataUrl: string; name: string } | null> {
    try {
      const { dialog } = (window as any).require('@electron/remote') ?? {}
      if (dialog) {
        const result = await dialog.showOpenDialog({ properties: ['openFile'], filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }] })
        if (result.canceled || !result.filePaths?.length) return null
        const path = result.filePaths[0]
        const name = path.split(/[/\\]/).pop() ?? `Photo_${Date.now()}.jpg`
        const fs = (window as any).require('fs')
        const buf = fs.readFileSync(path)
        const ext = name.split('.').pop()?.toLowerCase() ?? 'jpg'
        const mime = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : 'image/jpeg'
        const dataUrl = `data:${mime};base64,${buf.toString('base64')}`
        return { dataUrl, name }
      }
    } catch {}
    return null
  }

  private _store(photo: { dataUrl: string; name: string }): void {
    const id = `_ext_${Date.now()}`
    const entry: ExternalFile = {
      id, name: photo.name, path: photo.dataUrl, size: 0,
      mimeType: 'image/jpeg', added: Date.now(), blurred: false,
      folder: null, thumbnail: photo.dataUrl,
    }
    const files = this.state.get<ExternalFile[]>('externalFiles') ?? []
    files.push(entry)
    this.state.set('externalFiles', files)
    this._bridgeToLegacy(entry)
    this.bus.emit('ui:camera:captured', { dataUrl: photo.dataUrl })
  }

  private _bridgeToLegacy(entry: ExternalFile): void {
    if (typeof window === 'undefined') return
    const getExt = (window as any).getExternalFiles
    const saveExt = (window as any).saveExternalFiles
    if (typeof getExt === 'function' && typeof saveExt === 'function') {
      const files = getExt() ?? []
      files.push(entry)
      saveExt(files)
    }
  }
}
