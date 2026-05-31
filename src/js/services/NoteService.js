import { Api } from '../core/Api.js'

export class NoteService {
  constructor() {
    this.api = Api.getInstance()
    this.repo = this.api.getRepository('notes')
    this.bus = this.api.bus
    this.state = this.api.state
    this._bindEvents()
  }

  _bindEvents() {
    this.bus.on('ui:note:create', (e) => this.createNote(e.data))
    this.bus.on('ui:note:update', (e) => this.updateNote(e.id, e.changes))
    this.bus.on('ui:note:delete', (e) => this.deleteNote(e.id))
    this.bus.on('ui:note:move', (e) => this.moveNote(e.id, e.folder))
    this.bus.on('ui:todo:toggle', (e) => this.toggleTodo(e.noteId, e.todoIndex))
  }

  async createNote(data) {
    const now = Date.now()
    const note = {
      id: now,
      title: data.title || '',
      content: data.content || '',
      folder: data.folder || null,
      todos: data.todos || [],
      added: now,
      updated: now,
    }
    await this.repo.save(note)
    this.state.setState(`notes.${note.id}`, note)
    this.bus.emit('data:note:created', { note })
    return note
  }

  async updateNote(id, changes) {
    const note = await this.repo.getById(id)
    if (!note) return
    const updated = { ...note, ...changes, updated: Date.now() }
    await this.repo.save(updated)
    this.state.setState(`notes.${id}`, updated)
    this.bus.emit('data:note:updated', { id, changes })
    return updated
  }

  async deleteNote(id) {
    await this.repo.delete(id)
    this.state.setState(`notes.${id}`, null)
    this.bus.emit('data:note:deleted', { id })
  }

  async moveNote(id, folder) {
    return this.updateNote(id, { folder })
  }

  async toggleTodo(noteId, todoIndex) {
    const note = await this.repo.getById(noteId)
    if (!note || !note.todos || !note.todos[todoIndex]) return
    note.todos[todoIndex].done = !note.todos[todoIndex].done
    note.updated = Date.now()
    await this.repo.save(note)
    this.state.setState(`notes.${noteId}`, note)
    this.bus.emit('data:note:todo-toggled', { noteId, todoIndex, done: note.todos[todoIndex].done })
    return note.todos[todoIndex].done
  }

  async getNote(id) {
    return this.repo.getById(id)
  }

  async getAllNotes() {
    return this.repo.getAll()
  }

  async getNotesByFolder(folder) {
    return this.repo.getByFolder(folder)
  }
}
