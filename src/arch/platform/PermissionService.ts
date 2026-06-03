import type { PermissionType, PermissionValue, PermissionScope, PermissionRecord, PermissionState } from '../../shared/types'
import type { EventBus } from '../core/EventBus'
import type { AppStateManager } from '../core/AppState'

export class PermissionService {
  private _sessionCache = new Map<PermissionType, PermissionValue>()
  private _pendingResolve: ((value: PermissionValue) => void) | null = null
  private _pendingScope: PermissionScope = 'session'

  constructor(
    private bus: EventBus,
    private state: AppStateManager,
  ) {}

  get permissions(): PermissionState {
    return this.state.get<PermissionState>('permissions') ?? { records: {}, dialog: { open: false, type: null, resolve: null } }
  }

  async request(type: PermissionType): Promise<PermissionValue> {
    const existing = this._checkPersisted(type)
    if (existing === 'granted') return 'granted'

    const session = this._sessionCache.get(type)
    if (session) return session

    return new Promise<PermissionValue>((resolve) => {
      this.bus.emit('permission:dialog:show', { type })
      this.state.set('permissions.dialog', { open: true, type })

      const handler = (payload: { type: PermissionType; value: PermissionValue; scope?: PermissionScope }) => {
        if (payload.type !== type) return
        this.bus.off('permission:dialog:resolve', handler)
        this.state.set('permissions.dialog', { open: false, type: null })

        if (payload.value === 'granted') {
          this._sessionCache.set(type, 'granted')
          if (payload.scope === 'permanent') {
            this._persist(type, 'granted', 'permanent')
          }
          this._emitGranted(type, payload.scope ?? 'session')
          resolve('granted')
        } else {
          this._sessionCache.set(type, 'denied')
          this._emitDenied(type)
          resolve('denied')
        }
      }
      this.bus.on('permission:dialog:resolve', handler)
    })
  }

  check(type: PermissionType): PermissionValue {
    const existing = this._checkPersisted(type)
    if (existing) return existing
    return this._sessionCache.get(type) ?? 'prompt'
  }

  revoke(type: PermissionType): void {
    this._sessionCache.delete(type)
    this._removePersisted(type)
    this.state.set(`permissions.records.${type}`, null)
    this.bus.emit('ui:permission:revoke', { type })
  }

  resetAll(): void {
    this._sessionCache.clear()
    this.state.set('permissions.records', {})
  }

  private _checkPersisted(type: PermissionType): PermissionValue | null {
    const record = this.state.get<PermissionRecord>(`permissions.records.${type}`)
    if (record && record.value === 'granted' && record.scope === 'permanent') return 'granted'
    if (record && record.value === 'denied') return 'denied'
    return null
  }

  private _persist(type: PermissionType, value: PermissionValue, scope: PermissionScope): void {
    const record: PermissionRecord = { id: `perm_${type}`, type, value, scope, timestamp: Date.now() }
    this.state.set(`permissions.records.${type}`, record)
  }

  private _removePersisted(type: PermissionType): void {
    this.state.set(`permissions.records.${type}`, null)
  }

  private _emitGranted(type: PermissionType, scope: PermissionScope): void {
    this.bus.emit('permission:state:changed', { type, value: 'granted', scope })
    this.bus.emit('ui:permission:granted', { type, scope })
  }

  private _emitDenied(type: PermissionType): void {
    this.bus.emit('permission:state:changed', { type, value: 'denied', scope: 'session' })
    this.bus.emit('ui:permission:denied', { type })
  }
}
