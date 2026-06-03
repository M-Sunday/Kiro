import type { StorageAdapter, PermissionType, PermissionRecord } from '../../shared/types'

const STORE = 'settings'

export class PermissionRepository {
  constructor(private adapter: StorageAdapter) {}

  async findByType(type: PermissionType): Promise<PermissionRecord | null> {
    return this.adapter.get<PermissionRecord>(STORE, `perm_${type}`)
  }

  async save(record: PermissionRecord): Promise<string> {
    return this.adapter.put(STORE, { name: record.id, value: record })
  }

  async remove(type: PermissionType): Promise<void> {
    return this.adapter.delete(STORE, `perm_${type}`)
  }

  async getAll(): Promise<PermissionRecord[]> {
    const all = await this.adapter.getAll<{ name: string; value: PermissionRecord }>(STORE)
    return all.filter((item): item is { name: string; value: PermissionRecord } => item.name?.startsWith('perm_')).map(item => item.value)
  }

  async clearAll(): Promise<void> {
    const all = await this.getAll()
    for (const record of all) {
      await this.adapter.delete(STORE, record.id)
    }
  }
}
