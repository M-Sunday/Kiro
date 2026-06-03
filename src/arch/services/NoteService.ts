import type { Note, NoteRepository } from '../../shared/types'
import { EventBus } from '../core/EventBus'
import { AppStateManager } from '../core/AppState'

export class NoteService {
  private _repo: NoteRepository
  private _bus: EventBus
  private _state: AppStateManager

  constructor(repo: NoteRepository, bus: EventBus, state: AppStateManager) {
    this._repo = repo
    this._bus = bus
    this._state = state
    this._bindEvents()
  }

  private _bindEvents(): void {
    this._bus.on('ui:note:create', (payload: { data: Partial<Note> }) => {
      void this.createNote(payload.data)
    })
    this._bus.on(
      'ui:note:update',
      (payload: { id: string; changes: Partial<Note> }) => {
        void this.updateNote(payload.id, payload.changes)
      }
    )
    this._bus.on('ui:note:delete', (payload: { id: string }) => {
      void this.deleteNote(payload.id)
    })
    this._bus.on(
      'ui:note:move',
      (payload: { id: string; folder: string | null }) => {
        void this.moveNote(payload.id, payload.folder)
      }
    )
    this._bus.on(
      'ui:todo:toggle',
      (payload: { noteId: string; todoIndex: number }) => {
        void this.toggleTodo(payload.noteId, payload.todoIndex)
      }
    )
  }

  async createNote(data: Partial<Note>): Promise<Note | null> {
    const now = Date.now()
    const note: Note = {
      id: data.id ?? String(now),
      title: data.title ?? '',
      content: data.content ?? '',
      folder: data.folder ?? null,
      todos: data.todos ?? [],
      added: data.added ?? now,
      updated: now,
    }
    await this._repo.save(note)
    this._state.set(`notes.${note.id}`, note)
    this._bus.emit('data:note:created', { note })
    return note
  }

  async updateNote(
    id: string,
    changes: Partial<Note>
  ): Promise<Note | undefined> {
    const note = await this._repo.getById(id)
    if (!note) return
    const updated: Note = { ...note, ...changes, updated: Date.now() }
    await this._repo.save(updated)
    this._state.set(`notes.${id}`, updated)
    this._bus.emit('data:note:updated', { id, changes })
    return updated
  }

  async deleteNote(id: string): Promise<void> {
    await this._repo.delete(id)
    this._state.set(`notes.${id}`, undefined)
    this._bus.emit('data:note:deleted', { id })
  }

  async moveNote(id: string, folder: string | null): Promise<Note | undefined> {
    return this.updateNote(id, { folder })
  }

  async toggleTodo(
    noteId: string,
    todoIndex: number
  ): Promise<boolean | undefined> {
    const note = await this._repo.getById(noteId)
    if (!note || !note.todos || !note.todos[todoIndex]) return
    note.todos[todoIndex]!.done = !note.todos[todoIndex]!.done
    note.updated = Date.now()
    await this._repo.save(note)
    this._state.set(`notes.${noteId}`, note)
    this._bus.emit('data:note:todo-toggled', {
      noteId,
      todoIndex,
      done: note.todos[todoIndex]!.done,
    })
    return note.todos[todoIndex]!.done
  }

  async getNote(id: string): Promise<Note | null> {
    return this._repo.getById(id)
  }

  async getAllNotes(): Promise<Note[]> {
    return this._repo.getAll()
  }

  async getNotesByFolder(folder: string): Promise<Note[]> {
    return this._repo.getByFolder(folder)
  }
}
