import { Component } from './base/Component'

export class SettingsPanel extends Component {
  private _panelEl: HTMLElement | null = null

  override render(): void {
    if (!this.rootEl) return
    this.rootEl.innerHTML = this._baseHTML()
    this._panelEl = this.rootEl.querySelector('#settingsPanel')

    this.listenTo(this.rootEl.querySelector('#settingsClose'), 'click', this.close.bind(this) as EventListener)
    this.listenTo(this.rootEl.querySelector('#settingsBackdrop'), 'click', this.close.bind(this) as EventListener)
    this.listenTo(this.rootEl.querySelector('#settingsBtn'), 'click', (() => this.open()) as EventListener)

    this.on('ui:settings:open', () => this.open())
    this.on('ui:settings:close', () => this.close())

    this.subscribe('settings', () => this._syncUI())
    this.subscribe('userName', () => this._syncUI())

    const cats = this.rootEl?.querySelectorAll('.settings-cat')
    for (const cat of cats ?? []) {
      this.listenTo(cat, 'click', ((e: Event) => {
        const target = e.currentTarget as HTMLElement
        const tab = target.getAttribute('data-tab')
        if (!tab) return
        this._switchTab(tab)
      }) as EventListener)
    }
  }

  open(): void {
    if (this._panelEl) this._panelEl.classList.add('open')
    this.state.set('ui.settingsOpen', true)
    this._syncUI()
  }

  close(): void {
    if (this._panelEl) this._panelEl.classList.remove('open')
    this.state.set('ui.settingsOpen', false)
  }

  toggle(): void {
    if (this._panelEl?.classList.contains('open')) this.close()
    else this.open()
  }

  override destroy(): void {
    this._panelEl = null
    super.destroy()
  }

  private _baseHTML(): string {
    const currentTheme = this.state.get<string>('settings.theme') || 'white'
    return `
      <div id="settingsBtn" data-ref="settingsToggle" class="settings-toggle-btn" title="Settings">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
      </div>
      <div id="settingsPanel" data-ref="settingsPanel" class="settings-overlay" style="display:none">
        <div id="settingsBackdrop" data-ref="settingsBackdrop" class="settings-backdrop"></div>
        <div class="settings-panel">
          <div class="settings-header">
            <h2>Settings</h2>
            <button id="settingsClose" data-ref="settingsClose">&times;</button>
          </div>
          <div class="settings-body">
            <div class="settings-nav">
              <div class="settings-cat active" data-tab="about">About</div>
              <div class="settings-cat" data-tab="theme">Theme</div>
              <div class="settings-cat" data-tab="toolbar">Toolbar</div>
              <div class="settings-cat" data-tab="files">Files</div>
              <div class="settings-cat" data-tab="download">Download</div>
              <div class="settings-cat" data-tab="nsfw">NSFW</div>
              <div class="settings-cat" data-tab="storage">Storage</div>
            </div>
            <div class="settings-content">
              <div class="settings-pane active" id="pane-about">
                <h3>About</h3>
                <p>Kiro v3.1.0 — A local-first media manager.</p>
                <div class="settings-row"><label>Username</label><input id="settingsUserName" data-ref="userName" type="text" value="${this._escapeHtml(this.state.get<string>('userName') ?? '')}" /></div>
              </div>
              <div class="settings-pane" id="pane-theme">
                <h3>Theme</h3>
                <div class="settings-row"><label>Theme</label>
                  <select id="settingsThemeSelect" data-ref="themeSelect">
                    <option value="white" ${currentTheme === 'white' ? 'selected' : ''}>Light</option>
                    <option value="dark" ${currentTheme === 'dark' ? 'selected' : ''}>Dark</option>
                    <option value="black" ${currentTheme === 'black' ? 'selected' : ''}>Black</option>
                  </select>
                </div>
                <div class="settings-row"><label>Frosted glass</label><input type="checkbox" id="settingsFrosted" data-ref="frosted" ${this.state.get<boolean>('settings.frosted') ? 'checked' : ''} /></div>
              </div>
              <div class="settings-pane" id="pane-toolbar">
                <h3>Toolbar</h3>
                <div class="settings-row"><label>Show sidebar button</label><input type="checkbox" id="settingsShowSidebarBtn" data-ref="showSidebarBtn" ${this.state.get<boolean>('settings.showSidebarBtn') ? 'checked' : ''} /></div>
                <div class="settings-row"><label>Show search input</label><input type="checkbox" id="settingsShowKiroInput" data-ref="showKiroInput" ${this.state.get<boolean>('settings.showKiroInput') ? 'checked' : ''} /></div>
                <div class="settings-row"><label>Compact mode</label><input type="checkbox" id="settingsCompactMode" data-ref="compactMode" ${this.state.get<boolean>('settings.compactMode') ? 'checked' : ''} /></div>
              </div>
              <div class="settings-pane" id="pane-files">
                <h3>Files</h3>
                <div class="settings-row"><label>Detect all extensions</label><input type="checkbox" id="settingsDetectAllExt" data-ref="detectAllExt" ${this.state.get<boolean>('settings.detectAllExt') ? 'checked' : ''} /></div>
                <div class="settings-row"><label>Auto update links</label><input type="checkbox" id="settingsAutoUpdateLinks" data-ref="autoUpdateLinks" ${this.state.get<boolean>('settings.autoUpdateLinks') ? 'checked' : ''} /></div>
              </div>
              <div class="settings-pane" id="pane-download">
                <h3>Download</h3>
                <div class="settings-row"><label>Default type</label>
                  <select id="settingsDlType" data-ref="dlType">
                    <option value="video" ${this.state.get<string>('download.type') === 'video' ? 'selected' : ''}>Video</option>
                    <option value="audio" ${this.state.get<string>('download.type') === 'audio' ? 'selected' : ''}>Audio</option>
                  </select>
                </div>
                <div class="settings-row video-only"><label>Video quality</label>
                  <select id="settingsDlQuality" data-ref="dlQuality">
                    ${['2160','1440','1080','720','480','360'].map(q => `<option value="${q}" ${this.state.get<string>('download.videoQuality') === q ? 'selected' : ''}>${q}p</option>`).join('')}
                  </select>
                </div>
                <div class="settings-row audio-only" style="display:none"><label>Audio format</label>
                  <select id="settingsDlAudioFormat" data-ref="dlAudioFormat">
                    ${['mp3','aac','flac','opus','wav'].map(f => `<option value="${f}" ${this.state.get<string>('download.audioFormat') === f ? 'selected' : ''}>${f}</option>`).join('')}
                  </select>
                </div>
              </div>
              <div class="settings-pane" id="pane-nsfw">
                <h3>NSFW Filter</h3>
                <div class="settings-row"><label>Blur all NSFW</label><input type="checkbox" id="settingsBlurAllNSFW" data-ref="blurAllNSFW" ${this.state.get<boolean>('blurAllNSFW') ? 'checked' : ''} /></div>
                <div class="settings-row">
                  <label>Keywords</label>
                  <div id="settingsNSFWList" data-ref="nsfwList"></div>
                </div>
              </div>
              <div class="settings-pane" id="pane-storage">
                <h3>Storage</h3>
                <div id="settingsStorageInfo" data-ref="storageInfo"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  }

  private _switchTab(tab: string): void {
    const nav = this.rootEl?.querySelector('.settings-nav')
    nav?.querySelectorAll('.settings-cat').forEach(c => c.classList.remove('active'))
    nav?.querySelector(`[data-tab="${tab}"]`)?.classList.add('active')

    const content = this.rootEl?.querySelector('.settings-content')
    content?.querySelectorAll('.settings-pane').forEach(p => p.classList.remove('active'))
    content?.querySelector(`#pane-${tab}`)?.classList.add('active')
  }

  private _syncUI(): void {
    if (!this.rootEl) return
    const settings = this.state.get('settings') as Record<string, unknown> ?? {}
    const userName = this.state.get<string>('userName') ?? ''

    const nameInput = this.rootEl.querySelector<HTMLInputElement>('#settingsUserName')
    if (nameInput) nameInput.value = userName

    const themeSelect = this.rootEl.querySelector<HTMLSelectElement>('#settingsThemeSelect')
    if (themeSelect) themeSelect.value = (settings['theme'] as string) ?? 'white'

    const frosted = this.rootEl.querySelector<HTMLInputElement>('#settingsFrosted')
    if (frosted) frosted.checked = !!settings['frosted']

    const showSidebar = this.rootEl.querySelector<HTMLInputElement>('#settingsShowSidebarBtn')
    if (showSidebar) showSidebar.checked = settings['showSidebarBtn'] !== false

    const showInput = this.rootEl.querySelector<HTMLInputElement>('#settingsShowKiroInput')
    if (showInput) showInput.checked = settings['showKiroInput'] !== false

    const compact = this.rootEl.querySelector<HTMLInputElement>('#settingsCompactMode')
    if (compact) compact.checked = !!settings['compactMode']

    const detectAll = this.rootEl.querySelector<HTMLInputElement>('#settingsDetectAllExt')
    if (detectAll) detectAll.checked = !!settings['detectAllExt']

    const autoUpdate = this.rootEl.querySelector<HTMLInputElement>('#settingsAutoUpdateLinks')
    if (autoUpdate) autoUpdate.checked = settings['autoUpdateLinks'] !== false

    const blurAll = this.rootEl.querySelector<HTMLInputElement>('#settingsBlurAllNSFW')
    if (blurAll) blurAll.checked = !!this.state.get<boolean>('blurAllNSFW')
  }

  private _escapeHtml(str: string): string {
    const div = document.createElement('div')
    div.textContent = str
    return div.innerHTML
  }
}
