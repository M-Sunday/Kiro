import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EventBus } from '../core/EventBus'
import { AppStateManager } from '../core/AppState'
import { FileService } from '../services/FileService'
import type { PermissionService } from '../platform/PermissionService'

const fakeFiles = [
  { name: 'photo.jpg', path: 'content://media/external/images/1', size: 102400, mimeType: 'image/jpeg' },
  { name: 'video.mp4', path: '/storage/emulated/0/DCIM/video.mp4', size: 5242880, mimeType: 'video/mp4' },
]

function createMockPermissions(): PermissionService {
  return {
    request: vi.fn().mockResolvedValue('granted'),
    check: vi.fn().mockReturnValue('prompt'),
    revoke: vi.fn(),
    resetAll: vi.fn(),
  } as unknown as PermissionService
}

describe('FileService', () => {
  let bus: EventBus
  let state: AppStateManager
  let mockPermissions: PermissionService

  beforeEach(() => {
    bus = new EventBus()
    state = new AppStateManager(bus)
    mockPermissions = createMockPermissions()
  })

  it('should pick and store files when ui:file:import is emitted', async () => {
    const service = new FileService(bus, state, mockPermissions)
    vi.spyOn(service as any, '_pickFiles').mockResolvedValue(fakeFiles)

    const selectedHandler = vi.fn()
    bus.on('ui:file:selected', selectedHandler)

    bus.emit('ui:file:import')

    await vi.waitFor(() => {
      const files = state.get<any[]>('externalFiles') ?? []
      expect(files.length).toBe(2)
      expect(files[0].name).toBe('photo.jpg')
      expect(files[1].name).toBe('video.mp4')
    })

    expect(selectedHandler).toHaveBeenCalledTimes(2)
    expect(selectedHandler).toHaveBeenCalledWith({
      name: 'photo.jpg', size: 102400, type: 'image/jpeg', data: 'content://media/external/images/1',
    })
  })

  it('should not pick files if permission is denied', async () => {
    (mockPermissions.request as any).mockResolvedValue('denied')

    const service = new FileService(bus, state, mockPermissions)
    const pickSpy = vi.spyOn(service as any, '_pickFiles').mockResolvedValue(fakeFiles)

    const deniedHandler = vi.fn()
    bus.on('ui:permission:denied', deniedHandler)

    bus.emit('ui:file:import')

    await vi.waitFor(() => {
      expect(pickSpy).not.toHaveBeenCalled()
      expect(deniedHandler).toHaveBeenCalledWith({ type: 'files' })
    })
  })

  it('should not store anything if no files are picked', async () => {
    const service = new FileService(bus, state, mockPermissions)
    vi.spyOn(service as any, '_pickFiles').mockResolvedValue([])

    bus.emit('ui:file:import')

    await vi.waitFor(() => {
      const files = state.get<any[]>('externalFiles') ?? []
      expect(files).toHaveLength(0)
    })
  })

  it('should bridge files to legacy window.getExternalFiles', async () => {
    const getExt = vi.fn(() => [])
    const saveExt = vi.fn()
    ;(window as any).getExternalFiles = getExt
    ;(window as any).saveExternalFiles = saveExt

    const service = new FileService(bus, state, mockPermissions)
    vi.spyOn(service as any, '_pickFiles').mockResolvedValue([fakeFiles[0]])

    bus.emit('ui:file:import')

    await vi.waitFor(() => {
      expect(saveExt).toHaveBeenCalled()
      const saved = saveExt.mock.calls[0]![0]
      expect(saved).toHaveLength(1)
      expect(saved[0].name).toBe('photo.jpg')
    })

    delete (window as any).getExternalFiles
    delete (window as any).saveExternalFiles
  })

  it('should handle pick error gracefully', async () => {
    const service = new FileService(bus, state, mockPermissions)
    vi.spyOn(service as any, '_pickFiles').mockRejectedValue(new Error('picker error'))

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    bus.emit('ui:file:import')

    await vi.waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled()
    })

    consoleSpy.mockRestore()
  })

  it('should store files with correct ExternalFile fields', async () => {
    const service = new FileService(bus, state, mockPermissions)
    vi.spyOn(service as any, '_pickFiles').mockResolvedValue([fakeFiles[0]])

    bus.emit('ui:file:import')

    await vi.waitFor(() => {
      const files = state.get<any[]>('externalFiles') ?? []
      expect(files.length).toBe(1)
      const f = files[0]
      expect(f.id).toMatch(/^_ext_/)
      expect(f.name).toBe('photo.jpg')
      expect(f.path).toBe('content://media/external/images/1')
      expect(f.mimeType).toBe('image/jpeg')
      expect(f.blurred).toBe(false)
      expect(f.folder).toBeNull()
    })
  })

  describe('_pickBrowser', () => {
    it('should exist as a method', () => {
      const service = new FileService(bus, state, mockPermissions)
      expect(typeof (service as any)._pickBrowser).toBe('function')
    })
  })
})
