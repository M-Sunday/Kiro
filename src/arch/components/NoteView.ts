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
    this._panelEl = this.rootEl.querySelector('#noteView')
    this._titleInput = this.rootEl.querySelector('#noteViewTitle')
    this._contentEl = this.rootEl.querySelector('#noteViewContent')
    this._todosEl = this.rootEl.querySelector('#noteViewTodos')

    this.listenTo(this.rootEl.querySelector('#noteCloseBtn'), 'click', this.close.bind(this) as EventListener)
    this.listenTo(this.rootEl.querySelector('#noteDeleteBtn'), 'click', this._deleteNote.bind(this) as EventListener)
    this.listenTo(this.rootEl.querySelector('#newNoteBtn'), 'click', this._createNew.bind(this) as EventListener)
    this.listenTo(this.rootEl.querySelector('#todoAddBtn'), 'click', this._addTodo.bind(this) as EventListener)

    if (this._titleInput) {
      this.listenTo(this._titleInput, 'input', this._scheduleSave.bind(this) as EventListener)
    }
    if (this._contentEl) {
      this.listenTo(this._contentEl, 'input', this._scheduleSave.bind(this) as EventListener)
      this.listenTo(this._contentEl, 'paste', this._handlePaste as EventListener)
    }

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
      <div id="noteView" data-ref="noteView" class="note-panel" style="display:none">
        <div class="note-header">
          <button id="newNoteBtn" data-ref="newNoteBtn" title="New note">+</button>
          <input id="noteViewTitle" data-ref="noteTitle" type="text" placeholder="Note title" />
          <button id="noteDeleteBtn" data-ref="noteDeleteBtn" title="Delete note">🗑</button>
          <button id="noteCloseBtn" data-ref="noteCloseBtn" title="Close">&times;</button>
        </div>
        <div id="noteViewContent" data-ref="noteContent" class="note-content" contenteditable="true" placeholder="Write something..."></div>
        <div class="note-footer">
          <button id="todoAddBtn" data-ref="todoAddBtn">+ Add todo</button>
        </div>
        <div id="noteViewTodos" data-ref="noteTodos" class="note-todos"></div>
      </div>
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
