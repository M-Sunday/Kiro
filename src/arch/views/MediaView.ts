import { View } from '../core/ViewRouter'
import { EventBus } from '../core/EventBus'
import { AppStateManager } from '../core/AppState'
import type { ViewName } from '../../shared/types'

export class MediaView implements View {
  readonly name: ViewName = 'grid'
  private _bus: EventBus
  private _state: AppStateManager
  private _container: HTMLElement | null = null
  private _active = false

  constructor(bus: EventBus, state: AppStateManager) {
    this._bus = bus
    this._state = state
  }

  mount(): void {
    this._active = true
    const el = document.getElementById('gridView')
    if (el) el.classList.add('open')
    const btn = document.getElementById('gridBtn')
    if (btn) btn.classList.add('active')
    const deckBtn = document.getElementById('deckBtn')
    if (deckBtn) deckBtn.classList.remove('active')
    this._hideAllOtherViews('grid')
    this._bus.emit('ui:icons:load-needed')
  }

  unmount(): void {
    this._active = false
    const el = document.getElementById('gridView')
    if (el) el.classList.remove('open')
    const btn = document.getElementById('gridBtn')
    if (btn) btn.classList.remove('active')
    this._container = null
  }

  isActive(): boolean {
    return this._active
  }

  private _hideAllOtherViews(except: string): void {
    const views: Record<string, string[]> = {
      noteView: ['noteView'],
      gallery: ['canvasGallery', 'gallery-open'],
      textView: ['extTextView'],
      videoView: ['extVideoView'],
      imageView: ['extImageView'],
      card: ['content'],
    }
    for (const [key, ids] of Object.entries(views)) {
      if (key === except) continue
      for (const id of ids) {
        const el = document.getElementById(id)
        if (el) el.style.display = 'none'
      }
    }
  }
}
