import { View } from '../core/ViewRouter'
import { EventBus } from '../core/EventBus'
import { AppStateManager } from '../core/AppState'
import type { ViewName } from '../../shared/types'

export class SearchLandingView implements View {
  readonly name: ViewName = 'landing'
  private _bus: EventBus
  private _state: AppStateManager
  private _active = false

  constructor(bus: EventBus, state: AppStateManager) {
    this._bus = bus
    this._state = state
  }

  mount(): void {
    this._active = true
    const sl = document.getElementById('searchLanding')
    if (sl) sl.style.display = 'flex'
    this._hideAllOtherViews()
  }

  unmount(): void {
    this._active = false
    const sl = document.getElementById('searchLanding')
    if (sl) sl.style.display = 'none'
  }

  isActive(): boolean {
    return this._active
  }

  private _hideAllOtherViews(): void {
    const nv = document.getElementById('noteView')
    if (nv) nv.style.display = 'none'
    const ct = document.querySelector('.content') as HTMLElement | null
    if (ct) ct.style.display = 'none'
    const gv = document.getElementById('gridView')
    if (gv) gv.classList.remove('open')
  }
}
