import { describe, it, expect, vi } from 'vitest'
import { EventBus } from '../core/EventBus'
import { AppStateManager } from '../core/AppState'

describe('AppStateManager', () => {
  function createState() {
    const bus = new EventBus()
    const state = new AppStateManager(bus)
    return { bus, state }
  }

  it('should initialize with default state', () => {
    const { state } = createState()
    const full = state.fullState
    expect(full.ui.currentView).toBe('grid')
    expect(full.ui.sidebarClosed).toBe(false)
    expect(full.folders['Videos']).toEqual([])
    expect(full.folders['Archived']).toEqual([])
  })

  it('should get and set state', () => {
    const { state } = createState()
    state.set('userName', 'TestUser')
    expect(state.get('userName')).toBe('TestUser')
  })

  it('should set nested state', () => {
    const { state } = createState()
    state.set('ui.currentView', 'card')
    expect(state.get('ui.currentView')).toBe('card')
    expect(state.get('ui.sidebarClosed')).toBe(false)
  })

  it('should notify subscribers on state change', () => {
    const { state } = createState()
    const callback = vi.fn()
    state.subscribe('userName', callback)
    state.set('userName', 'Alice')
    expect(callback).toHaveBeenCalledWith('Alice', '', 'userName')
  })

  it('should notify wildcard subscribers', () => {
    const { state } = createState()
    const callback = vi.fn()
    state.subscribe('*', callback)
    state.set('userName', 'Bob')
    expect(callback).toHaveBeenCalledWith('Bob', '', 'userName')
  })

  it('should unsubscribe', () => {
    const { state } = createState()
    const callback = vi.fn()
    const unsub = state.subscribe('userName', callback)
    unsub()
    state.set('userName', 'Charlie')
    expect(callback).not.toHaveBeenCalled()
  })

  it('should set partial state', () => {
    const { state } = createState()
    state.setPartial('ui', { currentView: 'card', sidebarClosed: true })
    expect(state.get('ui.currentView')).toBe('card')
    expect(state.get('ui.sidebarClosed')).toBe(true)
  })

  it('should reset to initial state', () => {
    const { state } = createState()
    state.set('userName', 'Test')
    state.reset()
    expect(state.get('userName')).toBe('')
  })

  it('should set convenience methods', () => {
    const { state } = createState()
    state.setActiveView('note')
    expect(state.get('ui.currentView')).toBe('note')
    state.setCurrentVideoId('abc123')
    expect(state.get('ui.currentVideoId')).toBe('abc123')
    state.setCurrentNoteId('note456')
    expect(state.get('ui.currentNoteId')).toBe('note456')
    state.setSidebarClosed(true)
    expect(state.get('ui.sidebarClosed')).toBe(true)
  })

  it('should not set if value unchanged', () => {
    const { state } = createState()
    state.set('userName', 'Test')
    expect(state.get('userName')).toBe('Test')
  })

  it('should handle deep paths for missing parent objects', () => {
    const { state } = createState()
    state.set('a.b.c', 'deep')
    expect(state.get('a.b.c')).toBe('deep')
  })
})
