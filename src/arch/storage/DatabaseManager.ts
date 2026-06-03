import type { StorageAdapter } from '../../shared/types'
import { MigrationRunner } from './migrations/MigrationRunner'
import { IndexedDbAdapter } from './adapters/IndexedDbAdapter'
import { ElectronSQLiteAdapter } from './adapters/ElectronSQLiteAdapter'
import { CapacitorSQLiteAdapter } from './adapters/CapacitorSQLiteAdapter'
import { BrowserStorageAdapter } from './adapters/BrowserStorageAdapter'

export type PlatformType = 'electron' | 'capacitor' | 'browser'

export interface DatabaseConfig {
  platform: PlatformType
  electronDbPath?: string
  capacitorDbName?: string
  autoMigrate?: boolean
}

function detectPlatform(): PlatformType {
  if (typeof window !== 'undefined') {
    const w = window as unknown as Record<string, unknown>
    if (typeof (w as any)?.process?.versions?.electron === 'string') return 'electron'
    if (!!(w as any)?.Capacitor?.isNativePlatform) return 'capacitor'
  }
  return 'browser'
}

export class DatabaseManager {
  private _adapter: StorageAdapter | null = null
  private _migrationRunner: MigrationRunner | null = null
  private _config: DatabaseConfig

  constructor(config?: Partial<DatabaseConfig>) {
    this._config = {
      platform: config?.platform ?? detectPlatform(),
      electronDbPath: config?.electronDbPath,
      capacitorDbName: config?.capacitorDbName,
      autoMigrate: config?.autoMigrate ?? true,
    }
  }

  get adapter(): StorageAdapter {
    if (!this._adapter) {
      throw new Error('[DatabaseManager] Not initialized. Call connect() first.')
    }
    return this._adapter
  }

  get migrationRunner(): MigrationRunner {
    if (!this._migrationRunner) {
      throw new Error('[DatabaseManager] Not initialized. Call connect() first.')
    }
    return this._migrationRunner
  }

  get config(): DatabaseConfig {
    return { ...this._config }
  }

  get platform(): PlatformType {
    return this._config.platform
  }

  async connect(): Promise<StorageAdapter> {
    if (this._adapter) return this._adapter

    this._adapter = this._createAdapter()
    await this._adapter.connect()

    this._migrationRunner = new MigrationRunner(this._adapter)

    if (this._config.autoMigrate) {
      try {
        await this._migrationRunner.runPending()
      } catch (err) {
        console.warn('[DatabaseManager] Migration warning:', err)
      }
    }

    return this._adapter
  }

  async disconnect(): Promise<void> {
    if (!this._adapter) return
    await this._adapter.disconnect()
    this._adapter = null
    this._migrationRunner = null
  }

  async runMigrations(): Promise<void> {
    if (!this._migrationRunner) {
      throw new Error('[DatabaseManager] Not connected.')
    }
    await this._migrationRunner.runPending()
  }

  async resetDatabase(): Promise<void> {
    if (!this._migrationRunner) {
      throw new Error('[DatabaseManager] Not connected.')
    }
    await this._migrationRunner.reset()
    await this._migrationRunner.runAll()
  }

  private _createAdapter(): StorageAdapter {
    switch (this._config.platform) {
      case 'electron':
        return new ElectronSQLiteAdapter(this._config.electronDbPath)
      case 'capacitor':
        return new CapacitorSQLiteAdapter(this._config.capacitorDbName)
      case 'browser':
        return new BrowserStorageAdapter()
    }
  }
}
