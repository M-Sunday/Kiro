import { BaseRepository } from './BaseRepository.js'

export class GoalRepository extends BaseRepository {
  constructor(storeName) {
    super(storeName)
  }
}

export class ChallengeRepository extends BaseRepository {
  constructor() {
    super('challenges')
  }

  async getActive() {
    const all = await this.getAll()
    return all.filter(c => !c.completed)
  }

  async getCompleted() {
    const all = await this.getAll()
    return all.filter(c => c.completed)
  }
}

export class AchievementRepository extends BaseRepository {
  constructor() {
    super('achievements')
  }

  async isUnlocked(name) {
    const all = await this.getAll()
    return all.some(a => a.name === name)
  }
}
