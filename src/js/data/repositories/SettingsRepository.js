import { BaseRepository } from './BaseRepository.js'
import { db } from '../db.js'

export class SettingsRepository extends BaseRepository {
  constructor() {
    super('settings')
  }

  async get(name) {
    const entry = await this.getById(name)
    return entry ? entry.value : null
  }

  async set(name, value) {
    return this.save({ name, value })
  }

  async getAllSettings() {
    const entries = await this.getAll()
    const result = {}
    for (const entry of entries) {
      result[entry.name] = entry.value
    }
    return result
  }
}

export class MetadataRepository extends BaseRepository {
  constructor() {
    super('metadata')
  }

  async get(name) {
    const entry = await this.getById(name)
    return entry ? entry.value : null
  }

  async set(name, value) {
    return this.save({ name, value })
  }

  async getAllMetadata() {
    const entries = await this.getAll()
    const result = {}
    for (const entry of entries) {
      result[entry.name] = entry.value
    }
    return result
  }
}
