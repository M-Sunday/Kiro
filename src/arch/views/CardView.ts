import { View } from '../core/ViewRouter'
import { EventBus } from '../core/EventBus'
import { AppStateManager } from '../core/AppState'
import type { ViewName } from '../../shared/types'

export class CardViewMode implements View {
  readonly name: ViewName = 'card'
  private _bus: EventBus
  private _state: AppStateManager
  private _active = false

  constructor(bus: EventBus, state: AppStateManager) {
    this._bus = bus
    this._state = state
  }

  mount(): void {
    this._active = true
    const content = document.querySelector('.content') as HTMLElement | null
    if (content) content.style.display = ''
    this._hideAllOtherViews('card')
  }

  unmount(): void {
    this._active = false
    const content = document.querySelector('.content') as HTMLElement | null
    if (content) content.style.display = 'none'
  }

  isActive(): boolean {
    return this._active
  }

  private _hideAllOtherViews(_except: string): void {
    const el = document.getElementById('noteView')
    if (el) el.style.display = 'none'
    const gv = document.getElementById('gridView')
    if (gv) gv.classList.remove('open')
    const cg = document.getElementById('canvasGallery')
    if (cg) cg.classList.remove('open')
    document.body.classList.remove('gallery-open')
    const sl = document.getElementById('searchLanding')
    if (sl) sl.style.display = 'none'
    const ve = document.getElementById('extVideoElement') as HTMLVideoElement | null
    if (ve) ve.pause()
  }
}
