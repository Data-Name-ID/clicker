import type { BuildingId, ResourceId } from '../game/types'
import asteroid0 from './sprites/asteroid-0.png'
import asteroid1 from './sprites/asteroid-1.png'
import asteroid2 from './sprites/asteroid-2.png'
import buildingDrone from './sprites/building-drone.png'
import buildingExcavator from './sprites/building-excavator.png'
import buildingFactory from './sprites/building-factory.png'
import buildingLaser from './sprites/building-laser.png'
import buildingSmelter from './sprites/building-smelter.png'
import meteor from './sprites/meteor.png'
import resAlloy from './sprites/res-alloy.png'
import resChip from './sprites/res-chip.png'
import resDarkMatter from './sprites/res-darkmatter.png'
import resOre from './sprites/res-ore.png'
import shard from './sprites/shard.png'
import tabAchievements from './sprites/tab-achievements.png'
import tabAchievementsOn from './sprites/tab-achievements-on.png'
import tabBuildings from './sprites/tab-buildings.png'
import tabBuildingsOn from './sprites/tab-buildings-on.png'
import tabPrestige from './sprites/tab-prestige.png'
import tabPrestigeOn from './sprites/tab-prestige-on.png'
import tabSettings from './sprites/tab-settings.png'
import tabSettingsOn from './sprites/tab-settings-on.png'
import tabUpgrades from './sprites/tab-upgrades.png'
import tabUpgradesOn from './sprites/tab-upgrades-on.png'

export const ASTEROIDS: string[] = [asteroid0, asteroid1, asteroid2]

export const SPRITES = {
  shard,
  meteor,
  'building-drone': buildingDrone,
  'building-excavator': buildingExcavator,
  'building-smelter': buildingSmelter,
  'building-factory': buildingFactory,
  'building-laser': buildingLaser,
  'res-ore': resOre,
  'res-alloy': resAlloy,
  'res-chip': resChip,
  'res-darkmatter': resDarkMatter,
} as const

export const asteroidSprite = (prestigeCount: number): string =>
  ASTEROIDS[prestigeCount % ASTEROIDS.length]

export const buildingSprite = (id: BuildingId): string => SPRITES[`building-${id}`]

export const resourceSprite = (id: ResourceId | 'darkMatter'): string =>
  id === 'darkMatter' ? SPRITES['res-darkmatter'] : SPRITES[`res-${id}`]

export type TabIconId = 'buildings' | 'upgrades' | 'achievements' | 'prestige' | 'settings'

export const TAB_ICONS: Record<TabIconId, { off: string; on: string }> = {
  buildings: { off: tabBuildings, on: tabBuildingsOn },
  upgrades: { off: tabUpgrades, on: tabUpgradesOn },
  achievements: { off: tabAchievements, on: tabAchievementsOn },
  prestige: { off: tabPrestige, on: tabPrestigeOn },
  settings: { off: tabSettings, on: tabSettingsOn },
}
