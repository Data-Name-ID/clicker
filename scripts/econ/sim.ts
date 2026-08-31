import { pickArtifact } from '../../src/game/content/artifacts'
import { BUILDING_IDS } from '../../src/game/content/buildings'
import { availableUpgrades } from '../../src/game/content/upgrades'
import { buyBuilding, buyUpgrade, canAfford, costOf, isBuildingVisible, performClick } from '../../src/game/economy'
import { acceptBlackMarket, acceptCaravan, tickEvents } from '../../src/game/events'
import { collectExpedition, isExpeditionReady, startExpedition } from '../../src/game/expeditions'
import { applyPrestige, canPrestige, darkMatterGain, spinupFactor } from '../../src/game/prestige'
import { applyBoost, applySupply, cooldownRemaining, recordAdWatched } from '../../src/game/rewards'
import { simulate } from '../../src/game/tick'
import { createInitialState, type GameState } from '../../src/game/types'

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface BotFlags {
  cps: number
  ads: boolean
  trader: boolean
  expeditions: boolean
  prestige: boolean | 'patient'
}

function preset(kind: 'early' | 'late'): GameState {
  const s = createInitialState()
  if (kind === 'early') return s
  return {
    ...s,
    darkMatter: 100,
    prestigeCount: 6,
    shipUpgrades: ['startCargo', 'stasisStore', 'autoSmelter', 'crewMemory', 'thrusters', 'longRange', 'wholesale'],
    talents: { darkVein: 3, startBoost: 5, oreMemory: 2 },
    skills: ['dark1', 'dark2', 'dark3', 'dark4', 'dark5', 'dark6', 'captain1', 'captain2', 'captain3', 'captain4', 'captain6', 'miner1', 'miner2', 'miner3'],
    xp: 1_000_000,
    buildings: { ...s.buildings, drone: 25, smelter: 1, excavator: 1 },
    resources: { ...s.resources, ore: 1000, alloy: 200 },
    stats: { ...s.stats, runStartedAt: 0 },
  }
}

function greedyBuy(state: GameState, rng: () => number): GameState {
  for (let i = 0; i < 5; i += 1) {
    let best: { id: (typeof BUILDING_IDS)[number]; w: number } | null = null
    for (const id of BUILDING_IDS) {
      if (!isBuildingVisible(state, id)) continue
      const c = costOf(state, id, state.buildings[id], 1)
      if (!canAfford(state.resources, c)) continue
      const w = (c.ore ?? 0) + (c.alloy ?? 0) * 4 + (c.chip ?? 0) * 20 + (c.core ?? 0) * 400
      if (!best || w < best.w) best = { id, w }
    }
    if (!best) break
    state = buyBuilding(state, best.id, 1) ?? state
  }
  const up = availableUpgrades(state).find((u) => canAfford(state.resources, u.cost))
  if (up) state = buyUpgrade(state, up.id) ?? state
  return state
}

interface Result {
  name: string
  firstPrestigeMin: number | null
  prestiges: number
  dmEarned: number
  chips: number
  oreTotal: number
}

function run(name: string, kind: 'early' | 'late', flags: BotFlags, hours: number, seed = 42): Result {
  const rng = mulberry32(seed)
  let state = preset(kind)
  let now = 1_000_000_000_000
  let firstPrestige: number | null = null
  let prestiges = 0
  let dmEarned = 0
  const seconds = hours * 3600

  for (let t = 0; t < seconds; t += 1) {
    now += 1000
    state = simulate(state, 1)
    for (let c = 0; c < flags.cps; c += 1) {
      state = performClick(state, now, rng(), 1, rng()).state
    }
    if (t % 5 === 0) state = greedyBuy(state, rng)
    state = tickEvents(state, 1, [rng(), rng()]).state
    if (flags.trader) {
      if (state.effects.event?.id === 'caravan') state = acceptCaravan(state)
      else if (state.effects.event?.id === 'blackMarket') state = acceptBlackMarket(state)
    }
    if (flags.ads) {
      if (cooldownRemaining(state, 'supply', now) === 0 && t > 300) state = applySupply(recordAdWatched(state), now)
      if (cooldownRemaining(state, 'boost', now) === 0) state = applyBoost(recordAdWatched(state), now)
    }
    if (flags.expeditions) {
      const idx = state.expeditions.findIndex((e) => isExpeditionReady(e, now))
      if (idx >= 0) state = collectExpedition(state, idx, now, [rng(), rng()])?.state ?? state
      while (startExpedition(state, 'short', 50, now)) {
        state = startExpedition(state, 'short', 50, now)!
      }
    }
    if (flags.prestige && canPrestige(state)) {
      if (flags.prestige === 'patient' && spinupFactor(state, now) < 1) continue
      const gain = darkMatterGain(state, now)
      dmEarned += gain
      prestiges += 1
      if (firstPrestige === null) firstPrestige = t / 60
      state = pickArtifact(applyPrestige(state, gain, now), rng())
    }
  }
  return {
    name,
    firstPrestigeMin: firstPrestige === null ? null : Math.round(firstPrestige),
    prestiges,
    dmEarned,
    chips: Math.round(state.stats.totalProduced.chip),
    oreTotal: Math.round(state.stats.totalProduced.ore),
  }
}

const HOURS = 3
const rows: Result[] = [
  run('early: идл (0 кл/с)', 'early', { cps: 0, ads: false, trader: false, expeditions: false, prestige: true }, HOURS),
  run('early: кликер 5 кл/с', 'early', { cps: 5, ads: false, trader: false, expeditions: false, prestige: true }, HOURS),
  run('early: кликер+реклама', 'early', { cps: 5, ads: true, trader: false, expeditions: false, prestige: true }, HOURS),
  run('early: кликер+экспедиции', 'early', { cps: 5, ads: false, trader: false, expeditions: true, prestige: true }, HOURS),
  run('early: всё сразу', 'early', { cps: 5, ads: true, trader: true, expeditions: true, prestige: true }, HOURS),
  run('late: идл', 'late', { cps: 0, ads: false, trader: false, expeditions: false, prestige: true }, HOURS),
  run('late: спам перелётов', 'late', { cps: 5, ads: true, trader: true, expeditions: false, prestige: true }, HOURS),
  run('late: терпеливый (5 мин+)', 'late', { cps: 5, ads: true, trader: true, expeditions: false, prestige: 'patient' }, HOURS),
  run('late: терпеливый идл', 'late', { cps: 0, ads: false, trader: false, expeditions: false, prestige: 'patient' }, HOURS),
  run('late: экспедиции', 'late', { cps: 0, ads: false, trader: false, expeditions: true, prestige: true }, HOURS),
]
console.log('Бот                        | 1-й перелёт | перелётов | ТМ/3ч | чипов всего | руды всего')
for (const r of rows) {
  console.log(
    `${r.name.padEnd(26)} | ${String(r.firstPrestigeMin ?? '—').padStart(8)} мин | ${String(r.prestiges).padStart(6)} | ${String(r.dmEarned).padStart(5)} | ${r.chips.toExponential(2).padStart(11)} | ${r.oreTotal.toExponential(2)}`,
  )
}
