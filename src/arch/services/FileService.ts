import type { EventBus } from '../core/EventBus'
import type { AppStateManager } from '../core/AppState'
import type { ExternalFile } from '../../shared/types'
import { PermissionService } from '../platform/PermissionService'

export class FileService {
  constructor(
    private bus: EventBus,
    private state: AppStateManager,
    private permissions: PermissionService,
  ) {
    this.bus.on('ui:file:import', () => this._handleImport())
  }

  private async _handleImport(): Promise<void> {
    try {
      const result = await this.permissions.request('files')
      if (result !== 'granted') {
        this.bus.emit('ui:permission:denied', { type: 'files' })
        return
      }
      const files = await this._pickFiles()
      if (!files.length) return
      for (const file of files) {
        this._store(file)
      }
    } catch (err) {
      console.warn('[FileService] _handleImport failed:', err)
    }
  }

  private async _pickFiles(): Promise<Array<{ name: string; path: string; size: number; mimeType: string }>> {
    const isNative = this.state.get<boolean>('platform.isNative') ?? false
    const isElectron = this.state.get<boolean>('platform.isElectron') ?? false

    if (isNative && typeof window !== 'undefined' && (window as any).Capacitor?.Plugins?.FilePicker) {
      return this._pickCapacitor()
    }
    if (isElectron) {
      return this._pickElectron()
    }
    return this._pickBrowser()
  }

  private async _pickCapacitor(): Promise<Array<{ name: string; path: string; size: number; mimeType: string }>> {
    try {
      const FilePicker = (window as any).Capacitor.Plugins.FilePicker
      const result = await FilePicker.pickMedia({ limit: 0 })
      if (!result?.files?.length) return []
      return result.files.map((f: any) => ({
        name: f.name ?? `file_${Date.now()}`,
        path: f.path ?? f.uri ?? '',
        size: f.size ?? 0,
        mimeType: f.mimeType ?? '',
      }))
    } catch (err: any) {
      if (!err.message?.includes?.('cancel')) {
        console.warn('[FileService] Capacitor pick failed:', err)
      }
      return []
    }
  }

  private async _pickElectron(): Promise<Array<{ name: string; path: string; size: number; mimeType: string }>> {
    try {
      const { dialog } = (window as any).require('@electron/remote') ?? {}
      if (dialog) {
        const result = await dialog.showOpenDialog({ properties: ['openFile', 'multiSelections'] })
        if (result.canceled || !result.filePaths?.length) return []
        return result.filePaths.map((p: string) => {
          const name = p.split(/[/\\]/).pop() ?? `file_${Date.now()}`
          const ext = name.split('.').pop()?.toLowerCase() ?? ''
          const mimeMap: Record<string, string> = { mp4: 'video/mp4', webm: 'video/webm', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', mp3: 'audio/mpeg', pdf: 'application/pdf', txt: 'text/plain', md: 'text/markdown' }
          return { name, path: `file://${p}`, size: 0, mimeType: mimeMap[ext] ?? 'application/octet-stream' }
        })
      }
    } catch {}
    return []
  }

  private _pickBrowser(): Promise<Array<{ name: string; path: string; size: number; mimeType: string }>> {
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.multiple = true
      input.accept = '*/*'
      input.addEventListener('change', () => {
        const files = input.files
        if (!files || !files.length) { resolve([]); return }
        const result: Array<{ name: string; path: string; size: number; mimeType: string }> = []
        for (let i = 0; i < files.length; i++) {
          const f = files[i]
          if (!f) continue
          result.push({ name: f.name, path: URL.createObjectURL(f), size: f.size, mimeType: f.type })
        }
        resolve(result)
      })
      input.click()
    })
  }

  private _store(file: { name: string; path: string; size: number; mimeType: string }): void {
    const id = `_ext_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const entry: ExternalFile = {
      id, name: file.name, path: file.path, size: file.size,
      mimeType: file.mimeType, added: Date.now(), blurred: false,
      folder: null,
    }
    const files = this.state.get<ExternalFile[]>('externalFiles') ?? []
    files.push(entry)
    this.state.set('externalFiles', files)
    this._bridgeToLegacy(entry)
    this.bus.emit('ui:file:selected', { name: file.name, size: file.size, type: file.mimeType, data: file.path })
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
