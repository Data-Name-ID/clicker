export type ResourceId = 'ore' | 'alloy' | 'chip'

export type TutorialStepId = 'click' | 'drone' | 'ads' | 'smelter' | 'ore' | 'factory' | 'prestige'
export type BuildingId = 'drone' | 'excavator' | 'smelter' | 'factory' | 'laser'
export type ProducerId = 'drone' | 'excavator' | 'laser'
export type ProcessorId = 'smelter' | 'factory'

export type UpgradeId =
  | 'click1'
  | 'click2'
  | 'click3'
  | 'drone1'
  | 'drone2'
  | 'drone3'
  | 'excavator1'
  | 'excavator2'
  | 'smelter1'
  | 'smelter2'
  | 'factory1'
  | 'factory2'
  | 'laser1'
  | 'global1'

export type AchievementId =
  | 'clicks100'
  | 'clicks1k'
  | 'clicks10k'
  | 'ore1k'
  | 'ore1m'
  | 'ore1b'
  | 'chips100'
  | 'chips10k'
  | 'chips1m'
  | 'drones10'
  | 'drones50'
  | 'excavators10'
  | 'excavators50'
  | 'smelters10'
  | 'smelters50'
  | 'factories10'
  | 'factories50'
  | 'lasers10'
  | 'lasers50'
  | 'prestige1'
  | 'prestige5'
  | 'idle'
  | 'watcher'

export type Cost = Partial<Record<ResourceId, number>>
export type Resources = Record<ResourceId, number>

export interface GameStats {
  clicks: number
  totalProduced: Resources
  runChips: number
  adsWatched: number
  smelterIdleSeconds: number
  peakResources: Resources
}

export interface Effects {
  boostRemaining: number
  meteorRemaining: number
}

export interface Cooldowns {
  boostUntil: number
  supplyUntil: number
  meteorUntil: number
}

export interface Efficiency {
  smelter: number
  factory: number
}

export interface GameState {
  version: 1
  resources: Resources
  darkMatter: number
  buildings: Record<BuildingId, number>
  upgrades: UpgradeId[]
  achievements: AchievementId[]
  prestigeCount: number
  stats: GameStats
  effects: Effects
  cooldowns: Cooldowns
  efficiency: Efficiency
  tutorialDismissed: boolean
  tutorialSeen: TutorialStepId[]
  savedAt: number
}

export const zeroResources = (): Resources => ({ ore: 0, alloy: 0, chip: 0 })

export function createInitialState(): GameState {
  return {
    version: 1,
    resources: zeroResources(),
    darkMatter: 0,
    buildings: { drone: 0, excavator: 0, smelter: 0, factory: 0, laser: 0 },
    upgrades: [],
    achievements: [],
    prestigeCount: 0,
    stats: {
      clicks: 0,
      totalProduced: zeroResources(),
      runChips: 0,
      adsWatched: 0,
      smelterIdleSeconds: 0,
      peakResources: zeroResources(),
    },
    effects: { boostRemaining: 0, meteorRemaining: 0 },
    cooldowns: { boostUntil: 0, supplyUntil: 0, meteorUntil: 0 },
    efficiency: { smelter: 1, factory: 1 },
    tutorialDismissed: false,
    tutorialSeen: [],
    savedAt: 0,
  }
}
