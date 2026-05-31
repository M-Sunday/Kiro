import { Api } from '../core/Api.js'

export class GoalService {
  constructor() {
    this.api = Api.getInstance()
    this.repo = this.api.getRepository('goals')
    this.bus = this.api.bus
    this.state = this.api.state
    this._bindEvents()
  }

  _bindEvents() {
    this.bus.on('ui:goal:create', (e) => this.create(e.data))
    this.bus.on('ui:goal:update', (e) => this.update(e.id, e.changes))
    this.bus.on('ui:goal:delete', (e) => this.delete(e.id))
    this.bus.on('ui:goal:progress', (e) => this.updateProgress(e.id, e.progress))
  }

  async create(data) {
    const goal = {
      ...data,
      id: data.id || Date.now(),
      created: Date.now(),
      progress: data.progress || 0,
    }
    await this.repo.save(goal)
    this.bus.emit('data:goal:created', { goal })
    return goal
  }

  async update(id, changes) {
    const goal = await this.repo.getById(id)
    if (!goal) return
    const updated = { ...goal, ...changes }
    await this.repo.save(updated)
    this.bus.emit('data:goal:updated', { id, changes })
    return updated
  }

  async delete(id) {
    await this.repo.delete(id)
    this.bus.emit('data:goal:deleted', { id })
  }

  async updateProgress(id, progress) {
    return this.update(id, { progress })
  }

  async getAll() {
    return this.repo.getAll()
  }
}
