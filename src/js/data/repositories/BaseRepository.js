import { db } from '../db.js'

export class BaseRepository {
  constructor(storeName) {
    this.storeName = storeName
  }

  async getAll() {
    return db.getAll(this.storeName)
  }

  async getById(id) {
    return db.getById(this.storeName, id)
  }

  async save(record) {
    return db.save(this.storeName, record)
  }

  async delete(id) {
    return db.remove(this.storeName, id)
  }

  async clear() {
    return db.clear(this.storeName)
  }

  async count() {
    return db.count(this.storeName)
  }

  async queryByIndex(indexName, value) {
    return db.queryByIndex(this.storeName, indexName, value)
  }

  async getByIndex(indexName, value) {
    return db.getByIndex(this.storeName, indexName, value)
  }

  async saveAll(records) {
    return db.saveAll(this.storeName, records)
  }
}
