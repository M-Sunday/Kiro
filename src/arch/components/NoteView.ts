import { Component } from './base/Component'
import type { Note, TodoItem } from '../../shared/types'

export class NoteView extends Component {
  private _panelEl: HTMLElement | null = null
  private _titleInput: HTMLInputElement | null = null
  private _contentEl: HTMLElement | null = null
  private _todosEl: HTMLElement | null = null
  private _currentNoteId: string | null = null
  private _saveTimer: ReturnType<typeof setTimeout> | null = null

  override render(): void {
    if (!this.rootEl) return
    this.rootEl.innerHTML = this._baseHTML()
    this._panelEl = this.rootEl
    this._titleInput = this.rootEl.querySelector('#noteViewTitle')
    this._contentEl = this.rootEl.querySelector('#noteViewContent')
    this._todosEl = this.rootEl.querySelector('#noteViewTodos')

    this.listenTo(this.rootEl.querySelector('#noteCloseBtn'), 'click', this.close.bind(this) as EventListener)
    this.listenTo(this.rootEl.querySelector('#noteDeleteBtn'), 'click', this._deleteNote.bind(this) as EventListener)
    this.listenTo(this.rootEl.querySelector('#noteTodoBtn'), 'click', this._addTodo.bind(this) as EventListener)
    this.listenTo(this.rootEl.querySelector('#notePasteBtn'), 'click', this._pasteFromClipboard.bind(this) as EventListener)

    if (this._titleInput) {
      this.listenTo(this._titleInput, 'input', this._scheduleSave.bind(this) as EventListener)
    }
    if (this._contentEl) {
      this.listenTo(this._contentEl, 'input', this._scheduleSave.bind(this) as EventListener)
      this.listenTo(this._contentEl, 'paste', this._handlePaste as EventListener)
    }

    this.on('ui:clipboard:paste', (payload: { data: string; type: string }) => {
      if (!this._currentNoteId || !this._contentEl) return
      if (payload.type.startsWith('image/')) {
        this._contentEl.innerHTML += `<img src="${payload.data}" />`
      } else {
        const text = document.createElement('div')
        text.textContent = payload.data
        this._contentEl.innerHTML += text.innerHTML
      }
      this._scheduleSave()
    })

    this.on('ui:camera:captured', (payload: { dataUrl: string }) => {
      if (!this._currentNoteId || !this._contentEl) return
      this._contentEl.innerHTML += `<img src="${payload.dataUrl}" />`
      this._scheduleSave()
    })

    this.on('ui:note:open', (payload: { id: string }) => this.open(payload.id))
    this.on('ui:note:create', (payload: { data: Partial<Note> }) => {
      const note: Note = {
        id: crypto.randomUUID(),
        title: payload.data.title ?? 'Untitled',
        content: payload.data.content ?? '',
        folder: payload.data.folder ?? null,
        todos: payload.data.todos ?? [],
        added: Date.now(),
        updated: Date.now(),
      }
      this.emit('data:note:created', { note })
      this.open(note.id)
    })
  }

  open(id: string): void {
    const notes = this.state.get<Note[]>('notes') ?? []
    const note = notes.find(n => n.id === id)
    if (!note) return

    this._currentNoteId = id
    this.state.setCurrentNoteId(id)

    if (this._panelEl) this._panelEl.classList.add('open')
    if (this._titleInput) this._titleInput.value = note.title
    if (this._contentEl) this._contentEl.innerHTML = note.content

    this._renderTodos(note.todos)
  }

  close(): void {
    this._currentNoteId = null
    this.state.setCurrentNoteId(null)
    if (this._panelEl) this._panelEl.classList.remove('open')
  }

  override destroy(): void {
    if (this._saveTimer) clearTimeout(this._saveTimer)
    this._panelEl = null
    this._titleInput = null
    this._contentEl = null
    this._todosEl = null
    super.destroy()
  }

  private _baseHTML(): string {
    return `
      <div class="note-view-header">
        <input class="note-view-title" id="noteViewTitle" data-ref="noteTitle" placeholder="Note title" spellcheck="false">
        <div class="note-view-actions">
          <button class="note-view-btn" id="noteTodoBtn" data-ref="noteTodoBtn" title="Add todo">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          </button>
          <button class="note-view-btn" id="notePasteBtn" data-ref="notePasteBtn" title="Paste from clipboard">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>
          </button>
          <button class="note-view-btn" id="noteUndoBtn" data-ref="noteUndoBtn" title="Undo">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
          </button>
          <button class="note-view-btn" id="noteRedoBtn" data-ref="noteRedoBtn" title="Redo">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/></svg>
          </button>
          <button class="note-view-btn" id="noteDeleteBtn" data-ref="noteDeleteBtn" title="Delete note">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:#ff453a"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
          <button class="note-view-btn" id="noteCloseBtn" data-ref="noteCloseBtn" title="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
      <div class="note-view-content" id="noteViewContent" data-ref="noteContent" contenteditable="true" spellcheck="false"></div>
      <div class="note-view-todos" id="noteViewTodos" data-ref="noteTodos"></div>
      <div class="note-view-footer" id="noteViewFooter" data-ref="noteFooter"></div>
    `
  }

  private _scheduleSave(): void {
    if (this._saveTimer) clearTimeout(this._saveTimer)
    this._saveTimer = setTimeout(() => this._save(), 300)
  }

  private _save(): void {
    if (!this._currentNoteId) return
    const notes = this.state.get<Note[]>('notes') ?? []
    const note = notes.find(n => n.id === this._currentNoteId)
    if (!note) return

    const changes: Partial<Note> = {
      title: this._titleInput?.value ?? note.title,
      content: this._contentEl?.innerHTML ?? note.content,
      updated: Date.now(),
    }
    this.emit('data:note:updated', { id: this._currentNoteId, changes })
  }

  private _deleteNote(): void {
    if (this._currentNoteId) {
      this.emit('data:note:deleted', { id: this._currentNoteId })
    }
    this.close()
  }

  private _createNew(): void {
    const note: Note = {
      id: crypto.randomUUID(),
      title: 'Untitled',
      content: '',
      folder: null,
      todos: [],
      added: Date.now(),
      updated: Date.now(),
    }
    this.emit('data:note:created', { note })
    this.open(note.id)
    setTimeout(() => this._titleInput?.select(), 100)
  }

  private _addTodo(): void {
    if (!this._currentNoteId) return
    const notes = this.state.get<Note[]>('notes') ?? []
    const note = notes.find(n => n.id === this._currentNoteId)
    if (!note) return

    const todos = [...note.todos, { text: '', done: false }]
    this.emit('data:note:updated', { id: this._currentNoteId, changes: { todos, updated: Date.now() } })
    this._renderTodos(todos)
  }

  private _renderTodos(todos: TodoItem[]): void {
    if (!this._todosEl) return
    this._todosEl.innerHTML = todos.map((todo, i) => `
      <div class="todo-item">
        <span class="todo-cb" data-index="${i}" style="cursor:pointer">${todo.done ? '✅' : '⬜'}</span>
        <span class="todo-text" contenteditable="true" data-index="${i}">${this._escapeHtml(todo.text)}</span>
      </div>
    `).join('')

    const checkboxes = this._todosEl.querySelectorAll('.todo-cb')
    for (const cb of checkboxes) {
      this.listenTo(cb, 'click', ((e: Event) => {
        const idx = parseInt((e.currentTarget as HTMLElement).getAttribute('data-index') ?? '-1')
        if (idx < 0 || !this._currentNoteId) return
        const notes = this.state.get<Note[]>('notes') ?? []
        const note = notes.find(n => n.id === this._currentNoteId)
        if (!note) return
        const todos = note.todos.map((t, i) => i === idx ? { ...t, done: !t.done } : t)
        this.emit('data:note:updated', { id: this._currentNoteId, changes: { todos, updated: Date.now() } })
      }) as EventListener)
    }

    const texts = this._todosEl.querySelectorAll('.todo-text')
    for (const txt of texts) {
      this.listenTo(txt, 'blur', ((e: Event) => {
        const idx = parseInt((e.currentTarget as HTMLElement).getAttribute('data-index') ?? '-1')
        if (idx < 0 || !this._currentNoteId) return
        const notes = this.state.get<Note[]>('notes') ?? []
        const note = notes.find(n => n.id === this._currentNoteId)
        if (!note) return
        const text = (e.currentTarget as HTMLElement).textContent ?? ''
        const todos = note.todos.map((t, i) => i === idx ? { text, done: t.done } : t)
        this.emit('data:note:updated', { id: this._currentNoteId, changes: { todos, updated: Date.now() } })
      }) as EventListener)
    }
  }

  private _pasteFromClipboard(): void {
    this.emit('ui:clipboard:paste')
  }

  private _handlePaste(e: ClipboardEvent): void {
    const items = e.clipboardData?.items
    if (!items) return
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (!item) continue
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const blob = item.getAsFile()
        if (!blob) continue
        const reader = new FileReader()
        reader.onload = () => {
          if (this._contentEl && reader.result) {
            const img = `<img src="${reader.result}" />`
            document.execCommand('insertHTML', false, img)
          }
        }
        reader.readAsDataURL(blob)
      }
    }
  }

  private _escapeHtml(str: string): string {
    const div = document.createElement('div')
    div.textContent = str
    return div.innerHTML
  }
}
