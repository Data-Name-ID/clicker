import type { SkillId } from '../game/types'

export interface StarPos {
  x: number
  y: number
}

export const SKILL_LAYOUT: Record<SkillId, StarPos> = {
  miner1: { x: 18, y: 90 },
  miner2: { x: 34, y: 72 },
  miner3: { x: 52, y: 84 },
  miner4: { x: 44, y: 54 },
  miner5: { x: 74, y: 66 },
  miner6: { x: 62, y: 44 },
  miner7: { x: 44, y: 26 },
  miner8: { x: 76, y: 20 },

  swarm1: { x: 20, y: 80 },
  swarm2: { x: 78, y: 76 },
  swarm3: { x: 34, y: 56 },
  swarm4: { x: 66, y: 52 },
  swarm5: { x: 12, y: 48 },
  swarm6: { x: 48, y: 38 },
  swarm7: { x: 40, y: 20 },
  swarm8: { x: 62, y: 10 },

  eng1: { x: 20, y: 86 },
  eng2: { x: 46, y: 70 },
  eng3: { x: 18, y: 56 },
  eng4: { x: 72, y: 56 },
  eng5: { x: 44, y: 42 },
  eng6: { x: 72, y: 26 },
  eng7: { x: 46, y: 12 },
  eng8: { x: 80, y: 8 },

  astro1: { x: 78, y: 80 },
  astro2: { x: 56, y: 86 },
  astro3: { x: 82, y: 58 },
  astro4: { x: 34, y: 80 },
  astro5: { x: 62, y: 48 },
  astro6: { x: 22, y: 62 },
  astro7: { x: 36, y: 44 },
  astro8: { x: 20, y: 20 },

  captain1: { x: 62, y: 88 },
  captain2: { x: 34, y: 80 },
  captain3: { x: 84, y: 72 },
  captain4: { x: 22, y: 58 },
  captain5: { x: 78, y: 50 },
  captain6: { x: 48, y: 52 },
  captain7: { x: 44, y: 28 },
  captain8: { x: 62, y: 12 },

  dark1: { x: 50, y: 84 },
  dark2: { x: 20, y: 66 },
  dark3: { x: 80, y: 66 },
  dark4: { x: 14, y: 42 },
  dark5: { x: 86, y: 42 },
  dark6: { x: 50, y: 52 },
  dark7: { x: 50, y: 26 },
  dark8: { x: 50, y: 8 },
}
