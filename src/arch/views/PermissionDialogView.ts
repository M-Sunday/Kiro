import type { PermissionType, PermissionValue, PermissionScope } from '../../shared/types'
import type { EventBus } from '../core/EventBus'
import type { AppStateManager } from '../core/AppState'

const LABELS: Record<PermissionType, string> = {
  camera: 'Camera',
  files: 'File Access',
  folder: 'Folder Access',
  photos: 'Photo Library',
  clipboard: 'Clipboard',
}

const DESCRIPTIONS: Record<PermissionType, string> = {
  camera: 'Kiro needs camera access to take photos and attach them to notes.',
  files: 'Kiro needs file access to import media into your library.',
  folder: 'Kiro needs folder access to organize your files.',
  photos: 'Kiro needs access to your photo library.',
  clipboard: 'Kiro needs clipboard access to paste content into notes.',
}

export class PermissionDialogView {
  private _rootEl: HTMLDivElement
  private _visible = false

  constructor(
    private bus: EventBus,
    private state: AppStateManager,
  ) {
    this._rootEl = document.createElement('div')
    this._rootEl.id = 'arch-permission-dialog'
    this._rootEl.style.cssText = `
      display: none; position: fixed; inset: 0; z-index: 9999;
      background: rgba(0,0,0,0.5); align-items: center; justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    `
    document.body.appendChild(this._rootEl)
    this._render()
    this._bindEvents()
  }

  mount(): void {}
  unmount(): void {}

  private _bindEvents(): void {
    this.bus.on('permission:dialog:show', (payload: { type: PermissionType }) => {
      this._show(payload.type)
    })
    this._rootEl.addEventListener('click', (e) => {
      if (e.target === this._rootEl) this._dismiss()
    })
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this._visible) this._dismiss()
    })
  }

  private _show(type: PermissionType): void {
    this._rootEl.style.display = 'flex'
    this._visible = true
    this._renderContent(type)
  }

  private _dismiss(): void {
    this._resolve('denied')
  }

  private _resolve(value: PermissionValue, scope?: PermissionScope): void {
    const type = this.state.get<PermissionType>('permissions.dialog.type')
    if (!type) return
    this.bus.emit('permission:dialog:resolve', { type, value, scope })
    this._visible = false
    this._rootEl.style.display = 'none'
  }

  private _render(): void {
    this._rootEl.innerHTML = `<div class="perm-dialog" id="permDialogInner"></div>`
  }

  private _renderContent(type: PermissionType): void {
    const inner = this._rootEl.querySelector('#permDialogInner') as HTMLDivElement
    if (!inner) return
    const label = LABELS[type] ?? type
    const desc = DESCRIPTIONS[type] ?? ''
    inner.innerHTML = `
      <div style="background:#fff;border-radius:16px;padding:28px;max-width:380px;width:90%;box-shadow:0 8px 40px rgba(0,0,0,0.3);color:#1d1d1f;text-align:center">
        <div style="font-size:48px;margin-bottom:8px">${type === 'camera' ? '📷' : type === 'files' ? '📁' : '🔒'}</div>
        <h2 style="font-size:20px;font-weight:600;margin:0 0 4px 0">Allow Kiro to access your ${label.toLowerCase()}?</h2>
        <p style="font-size:14px;color:#6e6e73;margin:0 0 24px 0;line-height:1.4">${desc}</p>
        <div style="display:flex;flex-direction:column;gap:10px">
          <button class="perm-btn perm-always" data-value="granted" data-scope="permanent" style="padding:12px;border:none;border-radius:12px;font-size:15px;font-weight:500;cursor:pointer;background:#007aff;color:#fff">Always Allow</button>
          <button class="perm-btn perm-once" data-value="granted" data-scope="session" style="padding:12px;border:none;border-radius:12px;font-size:15px;font-weight:500;cursor:pointer;background:#e8e8ed;color:#1d1d1f">Only This Time</button>
          <button class="perm-btn perm-deny" data-value="denied" style="padding:12px;border:none;border-radius:12px;font-size:15px;font-weight:500;cursor:pointer;background:transparent;color:#ff3b30">Don't Allow</button>
        </div>
      </div>
    `
    inner.querySelectorAll('.perm-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const value = (btn as HTMLButtonElement).dataset['value'] as PermissionValue
        const scope = (btn as HTMLButtonElement).dataset['scope'] as PermissionScope | undefined
        this._resolve(value, scope)
      })
    })
  }
}
