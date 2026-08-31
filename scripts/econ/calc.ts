import { BUILDINGS } from '../../src/game/content/buildings'
import { UPGRADES } from '../../src/game/content/upgrades'
import {
  buildingInfo,
  clickValue,
  costOf,
  critChance,
  critMultiplier,
  darkMatterMultiplier,
  multipliers,
  performClick,
  productionPerSecond,
} from '../../src/game/economy'
import { collectExpedition } from '../../src/game/expeditions'
import { caravanRate, blackMarketRate } from '../../src/game/events'
import { coreMultiplier, darkMatterGain } from '../../src/game/prestige'
import { supplySeconds, SUPPLY_COOLDOWN_MS } from '../../src/game/rewards'
import { createInitialState, type GameState } from '../../src/game/types'

const base = createInitialState()

function state(overrides: Partial<GameState> & { stats?: Partial<GameState['stats']> } = {}): GameState {
  return {
    ...base,
    ...overrides,
    stats: { ...base.stats, ...(overrides.stats ?? {}) },
    resources: { ...base.resources, ...(overrides.resources ?? {}) },
    buildings: { ...base.buildings, ...(overrides.buildings ?? {}) },
    effects: { ...base.effects, ...(overrides.effects ?? {}) },
  } as GameState
}

console.log('=== 1. СТЕК КЛИКА (макс. сборка) ===')
const clickMax = state({
  upgrades: ['click1', 'click2', 'click3', 'click4', 'crowd'],
  skills: ['miner1', 'miner2', 'miner3', 'miner4', 'miner5', 'miner8'],
  darkMatter: 120,
  buildings: { drone: 200, excavator: 100, smelter: 100, factory: 100, laser: 50, neurolab: 50 },
  effects: { meteorRemaining: 10, event: null, boostRemaining: 0 },
  artifact: 'cometShard',
  stats: { clicks: 9 },
})
console.log('база клика (все множители, метеор, 10-й клик):', clickValue(clickMax).toExponential(3))
console.log('крит-шанс:', critChance(clickMax), 'крит-множитель:', critMultiplier(clickMax))
const peak = performClick(clickMax, 10_000_000, 0.01, 1, 0.05)
console.log('пиковый клик (крит+эхо):', peak.gain.toExponential(3))
console.log('производство/с той же базы:', productionPerSecond(clickMax).toExponential(3))
console.log('клик/производство:', (peak.gain / productionPerSecond(clickMax)).toFixed(2), 'секунд производства за 1 клик')

console.log('\n=== 2. РЕЗОНАНС (клик = +N сек производства) ===')
const res = state({ upgrades: ['resonance'], buildings: { drone: 100, excavator: 50, laser: 10 } })
const m = multipliers(res)
console.log('clickProducerSeconds:', m.clickProducerSeconds)
console.log('при 5 кликах/с активный игрок получает +', 5 * m.clickProducerSeconds, 'сек производства каждую секунду (=×6 к добыче)')
const resFever = state({ upgrades: ['resonance'], effects: { event: { id: 'oreFever', remaining: 30 }, boostRemaining: 0, meteorRemaining: 0 }, buildings: { drone: 100 } })
console.log('с событием «Рудная лихорадка»:', multipliers(resFever).clickProducerSeconds, 'сек/клик → при 5 кл/с = ×16')

console.log('\n=== 3. ОБМЕНЫ ПРОТИВ ЦЕПОЧКИ ===')
console.log('плавильня: 2 руды → 1 сплав, т.е. 0.5 сплава за руду (и руда продолжает капать)')
console.log('караван: 0.5 руды →', caravanRate(state()) / 2, 'сплава за 1 руды мгновенно; со скиллом astro6:', caravanRate(state({ skills: ['astro6'] })) / 2)
console.log('фабрика: 5 сплава → 1 чип = 0.2 чипа за сплав')
console.log('чёрный рынок за сплав:', blackMarketRate(state()) / 2 * 2, '→', blackMarketRate(state()), 'чипа за 1 сплава; со скиллом:', blackMarketRate(state({ skills: ['astro6'] })))

console.log('\n=== 4. ЭКСПЕДИЦИИ: EV против дома ===')
for (const kind of ['short', 'long', 'deep'] as const) {
  const dur = { short: 900, long: 3600, deep: 14400 }[kind]
  const st = state({ buildings: { drone: 60 }, expeditions: [{ kind, drones: 50, endsAt: 0 }] })
  const normal = collectExpedition(st, 0, 1, [0.9, 0.9])!
  const rare = collectExpedition(st, 0, 1, [0.2, 0.9])!
  const homeOre = 50 * 0.5 * 2 * dur // 60 дронов => милстоун ×2
  const evOre = 0.6 * normal.gains.ore! + 0.25 * rare.gains.ore! + 0.15 * 0
  console.log(`${kind}: дома=${homeOre.toExponential(2)}, EV=${evOre.toExponential(2)} (×${(evOre / homeOre).toFixed(2)}), редкая даёт ещё чипы=${(rare.gains.chip ?? 0).toFixed(0)}`)
}
const skilledSt = state({ buildings: { drone: 60 }, skills: ['captain1', 'captain2', 'captain3', 'captain4', 'captain6'], expeditions: [{ kind: 'deep', drones: 50, endsAt: 0 }] })
const sN = collectExpedition(skilledSt, 0, 1, [0.9, 0.9])!
console.log('deep со всеми скиллами капитана: ore ×' + (sN.gains.ore! / (50 * 0.5 * 2 * 14400)).toFixed(2), 'от домашней добычи, шанс провала 10%, потеря ¼')

console.log('\n=== 5. ПОСТАВКА (supply) ===')
const supplySt = state({ buildings: { drone: 50, smelter: 20, factory: 10, excavator: 20 } })
console.log('выдаёт', supplySeconds(supplySt), 'сек производства раз в', SUPPLY_COOLDOWN_MS / 60000, 'мин →', ((supplySeconds(supplySt) * 1000) / SUPPLY_COOLDOWN_MS * 100).toFixed(0) + '% дополнительного прогресса при просмотре по кд')
const supplyLong = state({ shipUpgrades: ['longRange'] })
console.log('с «Дальней связью»:', supplySeconds(supplyLong), 'сек /', SUPPLY_COOLDOWN_MS / 60000, 'мин →', ((supplySeconds(supplyLong) * 1000) / SUPPLY_COOLDOWN_MS * 100).toFixed(0) + '%')

console.log('\n=== 6. ФИКСИРОВАННАЯ ТМ ЗА ПЕРЕЛЁТ ===')
const fixedDm = state({ talents: { darkVein: 3 }, skills: ['dark3', 'dark6'], stats: { runChips: 10_000 } })
console.log('награда при ровно 10k чипов и полном фиксе:', darkMatterGain(fixedDm), '(базовая 3 + 6 фикс)')
const fixedOnly = state({ talents: { darkVein: 3 }, skills: ['dark3', 'dark6'], stats: { runChips: 10_000, runCores: 0 } })
console.log('доля фикса:', 6, 'из', darkMatterGain(fixedOnly), '→ спам перелётов = почти линейный фарм ТМ')

console.log('\n=== 7. ТМ-МНОЖИТЕЛЬ ===')
for (const dm of [10, 100, 500, 1000, 10000]) {
  console.log(`dm=${dm}: ×${darkMatterMultiplier(state({ darkMatter: dm })).toFixed(1)}`)
}

console.log('\n=== 8. ОКУПАЕМОСТЬ ЗДАНИЙ (fresh, шт №1) ===')
for (const def of BUILDINGS) {
  const st = state({ buildings: { [def.id]: 0 } })
  const cost = costOf(st, def.id, 0, 1)
  const info = buildingInfo(state({ buildings: { [def.id]: 1 } }), def.id)
  const costOre = (cost.ore ?? 0) + (cost.alloy ?? 0) * 4 + (cost.chip ?? 0) * 20 + (cost.core ?? 0) * 400
  const outOre = def.kind === 'producer' ? info.perUnit : info.outputPerUnit * (def.id === 'smelter' ? 4 : def.id === 'factory' ? 20 : 400) - info.inputPerUnit * (def.id === 'smelter' ? 1 : def.id === 'factory' ? 4 : 20)
  console.log(`${def.id}: цена≈${costOre} руды-экв, выхлоп≈${outOre.toFixed(2)}/с руды-экв, окупаемость ${(costOre / outOre / 60).toFixed(1)} мин`)
}

console.log('\n=== 9. РАЗРЯД и КОМБО ===')
const disSt = state({ buildings: { drone: 100 }, charge: 100 })
console.log('РАЗРЯД: 60с производства за 100 кликов → 0.6 сек производства за клик заряда (слабее резонанса в', (1 / 0.6).toFixed(1), 'раза)')
console.log('комбо: макс +100% клика — умеренно')
