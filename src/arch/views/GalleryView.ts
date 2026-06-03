import { View } from '../core/ViewRouter'
import { EventBus } from '../core/EventBus'
import { AppStateManager } from '../core/AppState'
import type { ViewName } from '../../shared/types'

export class GalleryViewMode implements View {
  readonly name: ViewName = 'gallery'
  private _bus: EventBus
  private _state: AppStateManager
  private _active = false

  constructor(bus: EventBus, state: AppStateManager) {
    this._bus = bus
    this._state = state
  }

  mount(): void {
    this._active = true
    const el = document.getElementById('canvasGallery')
    if (el) el.classList.add('open')
    document.body.classList.add('gallery-open')
    const btn = document.getElementById('deckBtn')
    if (btn) btn.classList.add('active')
    const gridBtn = document.getElementById('gridBtn')
    if (gridBtn) gridBtn.classList.remove('active')
    this._hideAllOtherViews('gallery')
    this._bus.emit('ui:icons:load-needed')
  }

  unmount(): void {
    this._active = false
    const el = document.getElementById('canvasGallery')
    if (el) el.classList.remove('open')
    document.body.classList.remove('gallery-open')
    const btn = document.getElementById('deckBtn')
    if (btn) btn.classList.remove('active')
  }

  isActive(): boolean {
    return this._active
  }

  private _hideAllOtherViews(_except: string): void {
    const views = ['noteView', 'extTextView', 'extVideoView', 'extImageView']
    for (const id of views) {
      const el = document.getElementById(id)
      if (el) el.style.display = 'none'
    }
    const content = document.querySelector('.content') as HTMLElement | null
    if (content) content.style.display = 'none'
  }
}
