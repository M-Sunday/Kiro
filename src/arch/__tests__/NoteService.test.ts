import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EventBus } from '../core/EventBus'
import { AppStateManager } from '../core/AppState'
import { NoteService } from '../services/NoteService'
import type { Note, NoteRepository } from '../../shared/types'

class MockNoteRepo implements NoteRepository {
  private _notes = new Map<string, Note>()

  async getById(id: string): Promise<Note | null> {
    return this._notes.get(id) ?? null
  }

  async getAll(): Promise<Note[]> {
    return Array.from(this._notes.values())
  }

  async save(note: Note): Promise<string> {
    this._notes.set(note.id, note)
    return note.id
  }

  async delete(id: string): Promise<void> {
    this._notes.delete(id)
  }

  async getByFolder(_folder: string): Promise<Note[]> {
    return []
  }
}

describe('NoteService', () => {
  let bus: EventBus
  let state: AppStateManager
  let repo: MockNoteRepo
  let service: NoteService

  beforeEach(() => {
    bus = new EventBus()
    state = new AppStateManager(bus)
    repo = new MockNoteRepo()
    service = new NoteService(repo, bus, state)
  })

  it('should create a note', async () => {
    const note = await service.createNote({
      title: 'My Note',
      content: 'Hello world',
    })

    expect(note).toBeTruthy()
    expect(note?.title).toBe('My Note')
    expect(note?.content).toBe('Hello world')

    const saved = await repo.getById(note!.id)
    expect(saved?.title).toBe('My Note')
  })

  it('should update a note', async () => {
    const note = await service.createNote({ title: 'Original' })
    await service.updateNote(note!.id, { title: 'Updated' })

    const updated = await repo.getById(note!.id)
    expect(updated?.title).toBe('Updated')
  })

  it('should toggle todo', async () => {
    const note = await service.createNote({
      title: 'Todo Note',
      todos: [{ text: 'Task 1', done: false }],
    })

    const done = await service.toggleTodo(note!.id, 0)
    expect(done).toBe(true)

    const updated = await repo.getById(note!.id)
    expect(updated?.todos[0]?.done).toBe(true)
  })

  it('should delete a note', async () => {
    const note = await service.createNote({ title: 'Delete me' })
    await service.deleteNote(note!.id)

    const deleted = await repo.getById(note!.id)
    expect(deleted).toBeNull()
  })

  it('should move note to folder', async () => {
    const note = await service.createNote({ title: 'Movable' })
    await service.moveNote(note!.id, 'MyFolder')

    const moved = await repo.getById(note!.id)
    expect(moved?.folder).toBe('MyFolder')
  })

  it('should create note via event', async () => {
    const handler = vi.fn()
    bus.on('data:note:created', handler)

    bus.emit('ui:note:create', {
      data: { title: 'Event Note', content: 'Created via event' },
    })

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalled()
    })
  })
})
