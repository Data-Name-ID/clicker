import type { ExpeditionKind } from '../types'

export interface ExpeditionKindDef {
  kind: ExpeditionKind
  name: string
  durationSec: number
  rewardScale: number
}

export const EXPEDITION_KINDS: ExpeditionKindDef[] = [
  { kind: 'short', name: 'Разведка', durationSec: 15 * 60, rewardScale: 1 },
  { kind: 'long', name: 'Вылазка', durationSec: 60 * 60, rewardScale: 1.2 },
  { kind: 'deep', name: 'Дальний рейд', durationSec: 4 * 60 * 60, rewardScale: 1.5 },
]

export const EXPEDITION_PARTY_SIZES = [10, 25, 50]

export const expeditionKindDef = (kind: ExpeditionKind): ExpeditionKindDef =>
  EXPEDITION_KINDS.find((k) => k.kind === kind)!
