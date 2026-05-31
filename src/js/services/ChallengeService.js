import { Api } from '../core/Api.js'

export class ChallengeService {
  constructor() {
    this.api = Api.getInstance()
    this.repo = this.api.getRepository('challenges')
    this.bus = this.api.bus
    this.state = this.api.state
    this._bindEvents()
  }

  _bindEvents() {
    this.bus.on('ui:challenge:create', (e) => this.create(e.data))
    this.bus.on('ui:challenge:update', (e) => this.update(e.id, e.changes))
    this.bus.on('ui:challenge:delete', (e) => this.delete(e.id))
    this.bus.on('ui:challenge:progress', (e) => this.updateProgress(e.id, e.progress))
  }

  async create(data) {
    const challenge = {
      ...data,
      id: data.id || Date.now(),
      created: Date.now(),
      completed: false,
      progress: data.progress || 0,
      todos: data.todos || [],
    }
    await this.repo.save(challenge)
    this.bus.emit('data:challenge:created', { challenge })
    return challenge
  }

  async update(id, changes) {
    const challenge = await this.repo.getById(id)
    if (!challenge) return
    const updated = { ...challenge, ...changes }
    await this.repo.save(updated)
    this.bus.emit('data:challenge:updated', { id, changes })
    return updated
  }

  async delete(id) {
    await this.repo.delete(id)
    this.bus.emit('data:challenge:deleted', { id })
  }

  async updateProgress(id, progress) {
    return this.update(id, { progress })
  }

  async getAll() {
    return this.repo.getAll()
  }

  async getActive() {
    return this.repo.getActive()
  }
}
