export type ResourceId = 'ore' | 'alloy' | 'chip' | 'core'

export type TutorialStepId = 'click' | 'drone' | 'ads' | 'smelter' | 'ore' | 'factory' | 'cores' | 'prestige'
export type BuildingId = 'drone' | 'excavator' | 'smelter' | 'factory' | 'laser' | 'neurolab'
export type ProducerId = 'drone' | 'excavator' | 'laser'
export type ProcessorId = 'smelter' | 'factory' | 'neurolab'

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
  | 'lab1'
  | 'ai1'
  | 'protocols'
  | 'laser2'
  | 'click4'
  | 'factory3'
  | 'smelter3'
  | 'dream'
  | 'ai2'
  | 'singularity'
  | 'crowd'
  | 'ionwind'
  | 'tailings'
  | 'sling'
  | 'resonance'
  | 'crit1'

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
  | 'cores10'
  | 'cores1k'
  | 'cores100k'
  | 'neurolabs10'
  | 'neurolabs50'
  | 'events10'
  | 'events50'
  | 'meteors100'
  | 'protocols10'
  | 'collector'
  | 'quartermaster'
  | 'secretRage'
  | 'secretJackpot'
  | 'secretNight'
  | 'secretCat'
  | 'secretDisco'
  | 'secretAnswer'
  | 'secretMinimalist'
  | 'secretHandsFree'
  | 'secretHoarder'
  | 'secretSpeedrun'
  | 'secretTrader'
  | 'secretCatLover'
  | 'secretDj'
  | 'secretCombo'
  | 'quests10'
  | 'discharge5'

export type EventId =
  | 'goldVein'
  | 'comet'
  | 'magneticStorm'
  | 'caravan'
  | 'blackMarket'
  | 'meteorHail'
  | 'solarFlare'
  | 'strayDrone'
  | 'oreFever'
  | 'dataFog'

export type ArtifactId =
  | 'cometShard'
  | 'iridiumVein'
  | 'oldBlueprint'
  | 'focusCrystal'
  | 'smuggledBooster'
  | 'darkSeed'
  | 'rustyExcavator'
  | 'obsidianLens'
  | 'hive'
  | 'voidSeal'
  | 'lotteryTicket'
  | 'minerHammer'

export type ShipUpgradeId =
  | 'startCargo'
  | 'autoDrill'
  | 'cargoBay'
  | 'thrusters'
  | 'crewMemory'
  | 'darkCompiler'
  | 'stasisStore'
  | 'wholesale'
  | 'autoSmelter'
  | 'longRange'
  | 'darkAntenna'
  | 'doubleHold'
  | 'autoDrill2'

export type ProtocolId = 'balance' | 'mining' | 'factory'

export type ThemeId = 'classic' | 'void' | 'nebula' | 'terminal'

export type Cost = Partial<Record<ResourceId, number>>
export type Resources = Record<ResourceId, number>

export interface GameStats {
  clicks: number
  runClicks: number
  totalProduced: Resources
  runChips: number
  runCores: number
  adsWatched: number
  smelterIdleSeconds: number
  peakResources: Resources
  eventsSeen: number
  meteorsCaught: number
  protocolSwitches: number
  strayDrones: number
  noClickSeconds: number
  clickBurstStart: number
  clickBurstCount: number
  runStartedAt: number
  prestigedWithoutExcavators: boolean
  prestigedUnder30Min: boolean
  nightOwl: boolean
  caughtCat: boolean
  discoUsed: boolean
  offersDeclined: number
  catsCaught: number
  discoCount: number
  comboBest: number
  discharges: number
  questsCompleted: number
}

export interface ActiveEvent {
  id: EventId
  remaining: number
}

export interface Effects {
  boostRemaining: number
  meteorRemaining: number
  event: ActiveEvent | null
}

export interface Cooldowns {
  boostUntil: number
  supplyUntil: number
  meteorUntil: number
  rerollUntil: number
  eventRushUntil: number
}

export interface Efficiency {
  smelter: number
  factory: number
  neurolab: number
}

export interface QuestState {
  index: number
  baseline: number
  goal: number
}

export interface GameState {
  version: 3
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
  protocol: ProtocolId
  artifact: ArtifactId | null
  artifactsSeen: ArtifactId[]
  shipUpgrades: ShipUpgradeId[]
  eventCountdown: number
  catCountdown: number
  combo: number
  lastClickAt: number
  charge: number
  quest: QuestState
  theme: ThemeId
  asteroidSkin: number | null
  tutorialDismissed: boolean
  tutorialSeen: TutorialStepId[]
  savedAt: number
}

export const zeroResources = (): Resources => ({ ore: 0, alloy: 0, chip: 0, core: 0 })

export function createInitialState(): GameState {
  return {
    version: 3,
    resources: zeroResources(),
    darkMatter: 0,
    buildings: { drone: 0, excavator: 0, smelter: 0, factory: 0, laser: 0, neurolab: 0 },
    upgrades: [],
    achievements: [],
    prestigeCount: 0,
    stats: {
      clicks: 0,
      runClicks: 0,
      totalProduced: zeroResources(),
      runChips: 0,
      runCores: 0,
      adsWatched: 0,
      smelterIdleSeconds: 0,
      peakResources: zeroResources(),
      eventsSeen: 0,
      meteorsCaught: 0,
      protocolSwitches: 0,
      strayDrones: 0,
      noClickSeconds: 0,
      clickBurstStart: 0,
      clickBurstCount: 0,
      runStartedAt: 0,
      prestigedWithoutExcavators: false,
      prestigedUnder30Min: false,
      nightOwl: false,
      caughtCat: false,
      discoUsed: false,
      offersDeclined: 0,
      catsCaught: 0,
      discoCount: 0,
      comboBest: 0,
      discharges: 0,
      questsCompleted: 0,
    },
    effects: { boostRemaining: 0, meteorRemaining: 0, event: null },
    cooldowns: { boostUntil: 0, supplyUntil: 0, meteorUntil: 0, rerollUntil: 0, eventRushUntil: 0 },
    efficiency: { smelter: 1, factory: 1, neurolab: 1 },
    protocol: 'balance',
    artifact: null,
    artifactsSeen: [],
    shipUpgrades: [],
    eventCountdown: 0,
    catCountdown: 0,
    combo: 0,
    lastClickAt: 0,
    charge: 0,
    quest: { index: 0, baseline: 0, goal: 0 },
    theme: 'classic',
    asteroidSkin: null,
    tutorialDismissed: false,
    tutorialSeen: [],
    savedAt: 0,
  }
}
