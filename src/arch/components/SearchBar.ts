import { Component } from './base/Component'
import type { ViewName } from '../../shared/types'

export class SearchBar extends Component {
  private _inputEl: HTMLInputElement | null = null
  private _btnEl: HTMLElement | null = null

  override render(): void {
    if (!this.rootEl) return
    this.rootEl.innerHTML = `
      <div class="top-bar" data-ref="topBar">
        <input type="text" id="kiroInput" placeholder="Paste a video URL..." aria-label="Search" data-ref="input" />
        <button id="kiroBtn" data-ref="btn" aria-label="Search">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        </button>
      </div>
    `
    this._inputEl = this.rootEl.querySelector('#kiroInput')
    this._btnEl = this.rootEl.querySelector('#kiroBtn')

    if (this._inputEl) {
      this.listenTo(this._inputEl, 'keydown', this._onKeyDown as EventListener)
      this.listenTo(this._inputEl, 'focus', this._onFocus as EventListener)
      this.listenTo(this._inputEl, 'blur', this._onBlur as EventListener)
    }
    if (this._btnEl) {
      this.listenTo(this._btnEl, 'click', this._onSearch as EventListener)
    }
  }

  override destroy(): void {
    this._inputEl = null
    this._btnEl = null
    super.destroy()
  }

  focus(): void {
    this._inputEl?.focus()
  }

  blur(): void {
    this._inputEl?.blur()
  }

  getValue(): string {
    return this._inputEl?.value ?? ''
  }

  setValue(val: string): void {
    if (this._inputEl) this._inputEl.value = val
  }

  private _onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter') {
      e.preventDefault()
      this._triggerSearch()
    }
    if (e.key === 'Escape') {
      this._inputEl?.blur()
    }
  }

  private _onFocus(): void {
    this.emit('ui:view:set', { view: 'landing' as ViewName })
  }

  private _onBlur(): void {
    this._inputEl?.classList.remove('search-expanded')
  }

  private _onSearch(): void {
    this._triggerSearch()
  }

  private _triggerSearch(): void {
    const url = this._inputEl?.value?.trim()
    if (!url) return
    this.emit('ui:search:video', { url })
  }
}
