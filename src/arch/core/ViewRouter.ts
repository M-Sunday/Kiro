import type { ViewName } from '../../shared/types'
import { EventBus } from './EventBus'
import { AppStateManager } from './AppState'

export interface View {
  name: ViewName
  mount(): void
  unmount(): void
  isActive(): boolean
}

export class ViewRouter {
  private _views = new Map<ViewName, View>()
  private _activeView: View | null = null
  private _bus: EventBus
  private _state: AppStateManager

  constructor(bus: EventBus, state: AppStateManager) {
    this._bus = bus
    this._state = state

    this._bus.on('ui:view:set', (payload: { view: ViewName }) => {
      this.activate(payload.view)
    })
  }

  register(view: View): void {
    if (this._views.has(view.name)) {
      console.warn(`[ViewRouter] Overwriting view: "${view.name}"`)
    }
    this._views.set(view.name, view)
  }

  activate(name: ViewName): void {
    const view = this._views.get(name)
    if (!view) {
      console.warn(`[ViewRouter] View "${name}" not registered`)
      return
    }
    if (this._activeView === view) return

    if (this._activeView) {
      this._activeView.unmount()
    }

    this._activeView = view
    view.mount()
    this._state.setActiveView(name)
    this._bus.emit('view:activated', { name })
  }

  get activeView(): ViewName | null {
    return this._activeView?.name ?? null
  }

  isActive(name: ViewName): boolean {
    return this._activeView?.name === name
  }

  getRegisteredViews(): ViewName[] {
    return Array.from(this._views.keys())
  }

  destroy(): void {
    if (this._activeView) {
      this._activeView.unmount()
      this._activeView = null
    }
    this._views.clear()
  }
}
