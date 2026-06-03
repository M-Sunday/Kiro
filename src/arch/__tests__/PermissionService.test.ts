import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EventBus } from '../core/EventBus'
import { AppStateManager } from '../core/AppState'
import { PermissionService } from '../platform/PermissionService'

describe('PermissionService', () => {
  let bus: EventBus
  let state: AppStateManager
  let service: PermissionService

  beforeEach(() => {
    bus = new EventBus()
    state = new AppStateManager(bus)
    service = new PermissionService(bus, state)
  })

  it('should return prompt for unasked permission', () => {
    expect(service.check('camera')).toBe('prompt')
    expect(service.check('files')).toBe('prompt')
  })

  it('should trigger a dialog on request and resolve with granted (session)', async () => {
    const dialogHandler = vi.fn()
    bus.on('permission:dialog:show', dialogHandler)

    const promise = service.request('camera')

    await vi.waitFor(() => {
      expect(dialogHandler).toHaveBeenCalledWith({ type: 'camera' })
      expect(state.get('permissions.dialog')).toEqual({ open: true, type: 'camera' })
    })

    bus.emit('permission:dialog:resolve', { type: 'camera', value: 'granted', scope: 'session' })
    const result = await promise

    expect(result).toBe('granted')
    expect(state.get('permissions.dialog')).toEqual({ open: false, type: null })
    expect(service.check('camera')).toBe('granted')
  })

  it('should trigger a dialog on request and resolve with denied', async () => {
    const promise = service.request('files')

    await vi.waitFor(() => {
      expect(state.get('permissions.dialog')).toEqual({ open: true, type: 'files' })
    })

    bus.emit('permission:dialog:resolve', { type: 'files', value: 'denied' })
    const result = await promise

    expect(result).toBe('denied')
    expect(state.get('permissions.dialog')).toEqual({ open: false, type: null })
    expect(service.check('files')).toBe('denied')
  })

  it('should skip dialog if previously granted (session)', async () => {
    const first = service.request('camera')
    bus.emit('permission:dialog:resolve', { type: 'camera', value: 'granted', scope: 'session' })
    await first

    const dialogHandler = vi.fn()
    bus.on('permission:dialog:show', dialogHandler)

    const result = await service.request('camera')
    expect(result).toBe('granted')
    expect(dialogHandler).not.toHaveBeenCalled()
  })

  it('should skip dialog if previously granted (permanent)', async () => {
    const first = service.request('camera')
    bus.emit('permission:dialog:resolve', { type: 'camera', value: 'granted', scope: 'permanent' })
    await first

    state.set('permissions.records.camera', {
      id: 'perm_camera', type: 'camera', value: 'granted', scope: 'permanent', timestamp: Date.now(),
    })

    const dialogHandler = vi.fn()
    bus.on('permission:dialog:show', dialogHandler)

    const result = await service.request('camera')
    expect(result).toBe('granted')
    expect(dialogHandler).not.toHaveBeenCalled()
  })

  it('should skip dialog if previously denied (session)', async () => {
    const first = service.request('files')
    bus.emit('permission:dialog:resolve', { type: 'files', value: 'denied' })
    await first

    const dialogHandler = vi.fn()
    bus.on('permission:dialog:show', dialogHandler)

    const result = await service.request('files')
    expect(result).toBe('denied')
    expect(dialogHandler).not.toHaveBeenCalled()
  })

  it('should revoke a permission', async () => {
    const first = service.request('camera')
    bus.emit('permission:dialog:resolve', { type: 'camera', value: 'granted', scope: 'session' })
    await first

    service.revoke('camera')
    expect(service.check('camera')).toBe('prompt')
  })

  it('should reset all permissions', async () => {
    const first = service.request('camera')
    bus.emit('permission:dialog:resolve', { type: 'camera', value: 'granted', scope: 'session' })
    await first
    const second = service.request('files')
    bus.emit('permission:dialog:resolve', { type: 'files', value: 'granted', scope: 'session' })
    await second

    service.resetAll()
    expect(service.check('camera')).toBe('prompt')
    expect(service.check('files')).toBe('prompt')
    expect(state.get('permissions.records')).toEqual({})
  })

  it('should emit granted and denied events', async () => {
    const grantedHandler = vi.fn()
    const deniedHandler = vi.fn()
    bus.on('ui:permission:granted', grantedHandler)
    bus.on('ui:permission:denied', deniedHandler)

    const grantedPromise = service.request('camera')
    bus.emit('permission:dialog:resolve', { type: 'camera', value: 'granted', scope: 'permanent' })
    await grantedPromise

    expect(grantedHandler).toHaveBeenCalledWith({ type: 'camera', scope: 'permanent' })

    const deniedPromise = service.request('files')
    bus.emit('permission:dialog:resolve', { type: 'files', value: 'denied' })
    await deniedPromise

    expect(deniedHandler).toHaveBeenCalledWith({ type: 'files' })
  })

  it('should emit permission:state:changed on grant and deny', async () => {
    const stateHandler = vi.fn()
    bus.on('permission:state:changed', stateHandler)

    const promise = service.request('camera')
    bus.emit('permission:dialog:resolve', { type: 'camera', value: 'granted', scope: 'session' })
    await promise

    expect(stateHandler).toHaveBeenCalledWith({ type: 'camera', value: 'granted', scope: 'session' })
  })

  it('should emit ui:permission:revoke on revoke', async () => {
    const revokeHandler = vi.fn()
    bus.on('ui:permission:revoke', revokeHandler)

    service.revoke('camera')
    expect(revokeHandler).toHaveBeenCalledWith({ type: 'camera' })
  })

  it('should ignore dialog resolve for a different type than requested', async () => {
    const promise = service.request('camera')

    bus.emit('permission:dialog:resolve', { type: 'files', value: 'granted', scope: 'session' })

    const dialogHandler = vi.fn()
    bus.on('permission:dialog:show', dialogHandler)

    await vi.waitFor(() => {
      expect(state.get('permissions.dialog')).toEqual({ open: true, type: 'camera' })
    })

    bus.emit('permission:dialog:resolve', { type: 'camera', value: 'granted', scope: 'session' })
    const result = await promise
    expect(result).toBe('granted')
  })

  it('should persist permanent grants to state', async () => {
    const promise = service.request('camera')
    bus.emit('permission:dialog:resolve', { type: 'camera', value: 'granted', scope: 'permanent' })
    await promise

    const record = state.get<import('../../shared/types').PermissionRecord>('permissions.records.camera')
    expect(record).toBeTruthy()
    expect(record?.value).toBe('granted')
    expect(record?.scope).toBe('permanent')
    expect(record?.type).toBe('camera')
  })

  it('should not persist session grants to state', async () => {
    const promise = service.request('camera')
    bus.emit('permission:dialog:resolve', { type: 'camera', value: 'granted', scope: 'session' })
    await promise

    expect(state.get('permissions.records.camera')).toBeUndefined()
  })

  it('should clear persisted record on revoke', async () => {
    const promise = service.request('camera')
    bus.emit('permission:dialog:resolve', { type: 'camera', value: 'granted', scope: 'permanent' })
    await promise
    expect(state.get('permissions.records.camera')).toBeTruthy()

    service.revoke('camera')
    expect(state.get('permissions.records.camera')).toBeNull()
  })
})
