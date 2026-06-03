import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { EventBus } from '../core/EventBus'
import { AppStateManager } from '../core/AppState'
import { CameraService } from '../services/CameraService'
import type { PermissionService } from '../platform/PermissionService'

const fakePhoto = { dataUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==', name: 'Photo_2026-01-01_123456789.jpg' }

function createMockPermissions(): PermissionService {
  return {
    request: vi.fn().mockResolvedValue('granted'),
    check: vi.fn().mockReturnValue('prompt'),
    revoke: vi.fn(),
    resetAll: vi.fn(),
  } as unknown as PermissionService
}

describe('CameraService', () => {
  let bus: EventBus
  let state: AppStateManager
  let mockPermissions: PermissionService

  beforeEach(() => {
    bus = new EventBus()
    state = new AppStateManager(bus)
    mockPermissions = createMockPermissions()
  })

  it('should capture and store a photo when ui:camera:open is emitted', async () => {
    const service = new CameraService(bus, state, mockPermissions)
    vi.spyOn(service as any, '_capture').mockResolvedValue(fakePhoto)

    const capturedHandler = vi.fn()
    bus.on('ui:camera:captured', capturedHandler)

    bus.emit('ui:camera:open')

    await vi.waitFor(() => {
      const files = state.get<any[]>('externalFiles') ?? []
      expect(files.length).toBe(1)
      expect(files[0].name).toBe(fakePhoto.name)
      expect(files[0].mimeType).toBe('image/jpeg')
    })

    expect(capturedHandler).toHaveBeenCalledWith({ dataUrl: fakePhoto.dataUrl })
  })

  it('should not capture if permission is denied', async () => {
    (mockPermissions.request as any).mockResolvedValue('denied')

    const service = new CameraService(bus, state, mockPermissions)
    const captureSpy = vi.spyOn(service as any, '_capture').mockResolvedValue(fakePhoto)

    const deniedHandler = vi.fn()
    bus.on('ui:permission:denied', deniedHandler)

    bus.emit('ui:camera:open')

    await vi.waitFor(() => {
      expect(captureSpy).not.toHaveBeenCalled()
      expect(deniedHandler).toHaveBeenCalledWith({ type: 'camera' })
    })
  })

  it('should not store if capture returns null', async () => {
    const service = new CameraService(bus, state, mockPermissions)
    vi.spyOn(service as any, '_capture').mockResolvedValue(null)

    bus.emit('ui:camera:open')

    await vi.waitFor(() => {
      const files = state.get<any[]>('externalFiles') ?? []
      expect(files).toHaveLength(0)
    })
  })

  it('should bridge captured photo to legacy window.getExternalFiles', async () => {
    const getExt = vi.fn(() => [])
    const saveExt = vi.fn()
    ;(window as any).getExternalFiles = getExt
    ;(window as any).saveExternalFiles = saveExt

    const service = new CameraService(bus, state, mockPermissions)
    vi.spyOn(service as any, '_capture').mockResolvedValue(fakePhoto)

    bus.emit('ui:camera:open')

    await vi.waitFor(() => {
      expect(saveExt).toHaveBeenCalled()
      const saved = saveExt.mock.calls[0]![0]
      expect(saved).toHaveLength(1)
      expect(saved[0].name).toBe(fakePhoto.name)
    })

    delete (window as any).getExternalFiles
    delete (window as any).saveExternalFiles
  })

  it('should handle capture error gracefully', async () => {
    const service = new CameraService(bus, state, mockPermissions)
    vi.spyOn(service as any, '_capture').mockRejectedValue(new Error('camera error'))

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    bus.emit('ui:camera:open')

    await vi.waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled()
    })

    consoleSpy.mockRestore()
  })

  it('should store the ExternalFile with correct fields', async () => {
    const service = new CameraService(bus, state, mockPermissions)
    vi.spyOn(service as any, '_capture').mockResolvedValue(fakePhoto)

    bus.emit('ui:camera:open')

    await vi.waitFor(() => {
      const files = state.get<any[]>('externalFiles') ?? []
      expect(files.length).toBe(1)
      const f = files[0]
      expect(f.id).toMatch(/^_ext_/)
      expect(f.name).toBe(fakePhoto.name)
      expect(f.path).toBe(fakePhoto.dataUrl)
      expect(f.mimeType).toBe('image/jpeg')
      expect(f.blurred).toBe(false)
      expect(f.folder).toBeNull()
      expect(f.thumbnail).toBe(fakePhoto.dataUrl)
    })
  })

  describe('_captureBrowser', () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('should return null if getUserMedia fails', async () => {
      const service = new CameraService(bus, state, mockPermissions)
      ;(navigator.mediaDevices as any)?.getUserMedia?.mockRejectedValue(new Error('permission denied'))

      const result = await (service as any)._captureBrowser()
      expect(result).toBeNull()
    })
  })
})
