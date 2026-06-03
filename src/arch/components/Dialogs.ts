import { Component } from './base/Component'

export class Dialogs extends Component {
  private _folderDialog: HTMLElement | null = null
  private _folderNameInput: HTMLInputElement | null = null
  private _bookmarkDialog: HTMLElement | null = null
  private _bookmarkUrlInput: HTMLInputElement | null = null
  private _bookmarkTitleInput: HTMLInputElement | null = null
  private _daDialog: HTMLElement | null = null
  private _daUrlDisplay: HTMLElement | null = null
  private _daTitleInput: HTMLInputElement | null = null
  private _pendingDaUrl: string | null = null

  override render(): void {
    if (!this.rootEl) return
    this.rootEl.innerHTML = `
      <div id="folderDialog" data-ref="folderDialog" class="dialog" style="display:none">
        <div class="dialog-content">
          <h3>New Folder</h3>
          <input id="folderNameInput" data-ref="folderNameInput" type="text" placeholder="Folder name" />
          <div class="folder-colors" data-ref="folderColors">
            ${['#ff6b6b','#ffa94d','#ffd43b','#69db7c','#4dabf7','#9775fa','#f783ac','#868e96'].map(c =>
              `<div class="folder-color" data-color="${c}" style="background:${c}"></div>`
            ).join('')}
          </div>
          <div class="dialog-actions">
            <button id="folderDialogCancel" data-ref="folderCancel">Cancel</button>
            <button id="folderDialogConfirm" data-ref="folderConfirm">Create</button>
          </div>
        </div>
      </div>

      <div id="bookmarkDialog" data-ref="bookmarkDialog" class="dialog" style="display:none">
        <div class="dialog-content">
          <h3>New Bookmark</h3>
          <input id="bookmarkUrlInput" data-ref="bookmarkUrlInput" type="text" placeholder="URL" />
          <input id="bookmarkTitleInput" data-ref="bookmarkTitleInput" type="text" placeholder="Title (optional)" />
          <div class="dialog-actions">
            <button id="bookmarkDialogCancel" data-ref="bookmarkCancel">Cancel</button>
            <button id="bookmarkDialogConfirm" data-ref="bookmarkConfirm">Add</button>
          </div>
        </div>
      </div>

      <div id="daDialog" data-ref="daDialog" class="dialog" style="display:none">
        <div class="dialog-content">
          <h3>New Direct Access</h3>
          <p id="daUrlDisplay" data-ref="daUrlDisplay"></p>
          <input id="daTitleInput" data-ref="daTitleInput" type="text" placeholder="Title" />
          <div class="dialog-actions">
            <button id="daDialogCancel" data-ref="daCancel">Cancel</button>
            <button id="daDialogConfirm" data-ref="daConfirm">Add</button>
          </div>
        </div>
      </div>
    `

    this._folderDialog = this.rootEl.querySelector('#folderDialog')
    this._folderNameInput = this.rootEl.querySelector('#folderNameInput')
    this._bookmarkDialog = this.rootEl.querySelector('#bookmarkDialog')
    this._bookmarkUrlInput = this.rootEl.querySelector('#bookmarkUrlInput')
    this._bookmarkTitleInput = this.rootEl.querySelector('#bookmarkTitleInput')
    this._daDialog = this.rootEl.querySelector('#daDialog')
    this._daUrlDisplay = this.rootEl.querySelector('#daUrlDisplay')
    this._daTitleInput = this.rootEl.querySelector('#daTitleInput')

    this._bindFolderEvents()
    this._bindBookmarkEvents()
    this._bindDaEvents()
  }

  openFolder(): void {
    this._show(this._folderDialog)
    this._folderNameInput?.focus()
    this._folderNameInput?.select()
  }

  openBookmark(): void {
    this._show(this._bookmarkDialog)
    setTimeout(() => this._bookmarkUrlInput?.focus(), 100)
  }

  openDa(url: string): void {
    this._pendingDaUrl = url
    if (this._daUrlDisplay) this._daUrlDisplay.textContent = url
    this._show(this._daDialog)
    setTimeout(() => this._daTitleInput?.focus(), 100)
  }

  override destroy(): void {
    this._folderDialog = null
    this._bookmarkDialog = null
    this._daDialog = null
    super.destroy()
  }

  private _bindFolderEvents(): void {
    const folderCancel = this.rootEl?.querySelector('#folderDialogCancel') ?? null
    const folderConfirm = this.rootEl?.querySelector('#folderDialogConfirm') ?? null
    this.listenTo(folderCancel, 'click', () => this._hide(this._folderDialog))
    this.listenTo(folderConfirm, 'click', this._confirmFolder.bind(this) as EventListener)
    this.listenTo(this._folderNameInput, 'keydown', ((e: KeyboardEvent) => {
      if (e.key === 'Enter') this._confirmFolder()
      if (e.key === 'Escape') this._hide(this._folderDialog)
    }) as EventListener)
  }

  private _bindBookmarkEvents(): void {
    const bmCancel = this.rootEl?.querySelector('#bookmarkDialogCancel') ?? null
    const bmConfirm = this.rootEl?.querySelector('#bookmarkDialogConfirm') ?? null
    this.listenTo(bmCancel, 'click', () => this._hide(this._bookmarkDialog))
    this.listenTo(bmConfirm, 'click', this._confirmBookmark.bind(this) as EventListener)
    this.listenTo(this._bookmarkUrlInput, 'keydown', ((e: KeyboardEvent) => {
      if (e.key === 'Enter') { e.preventDefault(); this._bookmarkTitleInput?.focus() }
      if (e.key === 'Escape') this._hide(this._bookmarkDialog)
    }) as EventListener)
    this.listenTo(this._bookmarkTitleInput, 'keydown', ((e: KeyboardEvent) => {
      if (e.key === 'Enter') { e.preventDefault(); this._confirmBookmark() }
      if (e.key === 'Escape') this._hide(this._bookmarkDialog)
    }) as EventListener)
  }

  private _bindDaEvents(): void {
    const daCancel = this.rootEl?.querySelector('#daDialogCancel') ?? null
    const daConfirm = this.rootEl?.querySelector('#daDialogConfirm') ?? null
    this.listenTo(daCancel, 'click', () => this._hide(this._daDialog))
    this.listenTo(daConfirm, 'click', this._confirmDa.bind(this) as EventListener)
    this.listenTo(this._daTitleInput, 'keydown', ((e: KeyboardEvent) => {
      if (e.key === 'Enter') { e.preventDefault(); this._confirmDa() }
      if (e.key === 'Escape') this._hide(this._daDialog)
    }) as EventListener)
  }

  private _confirmFolder(): void {
    const name = this._folderNameInput?.value?.trim()
    if (!name) return
    const folders = this.state.get<Record<string, string[]>>('folders')
    if (folders?.[name]) return
    this.emit('ui:folder:create', { name })
    this._hide(this._folderDialog)
    if (this._folderNameInput) this._folderNameInput.value = ''
  }

  private _confirmBookmark(): void {
    const url = this._bookmarkUrlInput?.value?.trim()
    if (!url) return
    const title = this._bookmarkTitleInput?.value?.trim() || url
    this.emit('ui:bookmark:create', { url, title })
    this._hide(this._bookmarkDialog)
    if (this._bookmarkUrlInput) this._bookmarkUrlInput.value = ''
    if (this._bookmarkTitleInput) this._bookmarkTitleInput.value = ''
  }

  private _confirmDa(): void {
    const title = this._daTitleInput?.value?.trim()
    if (!title || !this._pendingDaUrl) return
    this.emit('ui:direct-access:create', { url: this._pendingDaUrl, title })
    this._pendingDaUrl = null
    this._hide(this._daDialog)
    if (this._daTitleInput) this._daTitleInput.value = ''
  }

  private _show(el: HTMLElement | null): void {
    if (el) el.style.display = 'flex'
  }

  private _hide(el: HTMLElement | null): void {
    if (el) el.style.display = 'none'
  }
}
