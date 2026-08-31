import type { SkillId } from '../game/types'

export interface StarPos {
  x: number
  y: number
}

export const SKILL_LAYOUT: Record<SkillId, StarPos> = {
  miner1: { x: 50, y: 86 },
  miner2: { x: 28, y: 66 },
  miner3: { x: 72, y: 68 },
  miner4: { x: 22, y: 44 },
  miner5: { x: 78, y: 46 },
  miner6: { x: 50, y: 34 },
  miner7: { x: 44, y: 19 },
  miner8: { x: 56, y: 6 },

  swarm1: { x: 30, y: 86 },
  swarm2: { x: 72, y: 84 },
  swarm3: { x: 22, y: 62 },
  swarm4: { x: 80, y: 60 },
  swarm5: { x: 44, y: 68 },
  swarm6: { x: 52, y: 42 },
  swarm7: { x: 46, y: 24 },
  swarm8: { x: 58, y: 8 },

  eng1: { x: 48, y: 88 },
  eng2: { x: 30, y: 68 },
  eng3: { x: 68, y: 66 },
  eng4: { x: 24, y: 46 },
  eng5: { x: 76, y: 44 },
  eng6: { x: 36, y: 28 },
  eng7: { x: 58, y: 20 },
  eng8: { x: 64, y: 5 },

  astro1: { x: 52, y: 88 },
  astro2: { x: 32, y: 70 },
  astro3: { x: 72, y: 66 },
  astro4: { x: 24, y: 50 },
  astro5: { x: 80, y: 44 },
  astro6: { x: 32, y: 30 },
  astro7: { x: 56, y: 20 },
  astro8: { x: 50, y: 5 },

  captain1: { x: 46, y: 88 },
  captain2: { x: 28, y: 68 },
  captain3: { x: 68, y: 70 },
  captain4: { x: 22, y: 46 },
  captain5: { x: 76, y: 48 },
  captain6: { x: 48, y: 32 },
  captain7: { x: 54, y: 18 },
  captain8: { x: 48, y: 5 },

  dark1: { x: 50, y: 88 },
  dark2: { x: 30, y: 70 },
  dark3: { x: 70, y: 68 },
  dark4: { x: 24, y: 48 },
  dark5: { x: 78, y: 46 },
  dark6: { x: 50, y: 34 },
  dark7: { x: 58, y: 18 },
  dark8: { x: 50, y: 5 },
}
