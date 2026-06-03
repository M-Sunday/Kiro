import { Component } from './base/Component'

export class SettingsPanel extends Component {
  private _panelEl: HTMLElement | null = null
  private _settingsContent: HTMLElement | null = null

  override render(): void {
    if (!this.rootEl) return
    this._panelEl = this.rootEl
    this._settingsContent = this.rootEl.querySelector('#settingsContent')

    this.listenTo(this.rootEl.querySelector('#settingsClose'), 'click', this.close.bind(this) as EventListener)
    this.subscribe('settings', () => this._syncUI())
    this.subscribe('userName', () => this._syncUI())

    const cats = this.rootEl?.querySelectorAll('.settings-cat')
    for (const cat of cats ?? []) {
      this.listenTo(cat, 'click', ((e: Event) => {
        const target = e.currentTarget as HTMLElement
        const tab = target.getAttribute('data-cat')
        if (!tab) return
        this._switchTab(tab)
      }) as EventListener)
    }
  }

  open(): void {
    if (this.rootEl) this.rootEl.classList.add('open')
    this.state.set('ui.settingsOpen', true)
    this._syncUI()
  }

  close(): void {
    if (this.rootEl) this.rootEl.classList.remove('open')
    this.state.set('ui.settingsOpen', false)
  }

  toggle(): void {
    if (this.rootEl?.classList.contains('open')) this.close()
    else this.open()
  }

  override destroy(): void {
    this._panelEl = null
    this._settingsContent = null
    super.destroy()
  }

  private _switchTab(tab: string): void {
    const sidebar = this.rootEl?.querySelector('.settings-sidebar')
    sidebar?.querySelectorAll('.settings-cat').forEach(c => c.classList.remove('active'))
    sidebar?.querySelector(`[data-cat="${tab}"]`)?.classList.add('active')

    const content = this.rootEl?.querySelector('#settingsContent')
    content?.querySelectorAll('.settings-pane').forEach(p => p.classList.remove('active'))
    content?.querySelector(`#pane-${tab}`)?.classList.add('active')
  }

  private _syncUI(): void {
    if (!this.rootEl) return
    const settings = this.state.get<Record<string, unknown>>('settings') ?? {}
    const userName = this.state.get<string>('userName') ?? ''

    const nameDisplay = this.rootEl.querySelector('#settingsUserNameDisplay')
    if (nameDisplay) nameDisplay.textContent = userName || '—'

    const nameInput = this.rootEl.querySelector<HTMLInputElement>('#settingsUserNameEditInput')
    if (nameInput) nameInput.value = userName
  }

  private _escapeHtml(str: string): string {
    const div = document.createElement('div')
    div.textContent = str
    return div.innerHTML
  }
}
