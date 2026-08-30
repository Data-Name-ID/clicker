import { QUEST_CHAIN, questAt, type QuestDef } from './content/quests'
import { addResources } from './events'
import type { GameState } from './types'

export function activateQuest(state: GameState, index: number): GameState {
  const { def, scale } = questAt(index)
  return {
    ...state,
    quest: { index, baseline: def.absolute ? 0 : def.metric(state), goal: def.goal(state) * scale },
  }
}

export interface QuestProgress {
  def: QuestDef
  current: number
  goal: number
}

export function questProgress(state: GameState): QuestProgress {
  const { def } = questAt(state.quest.index)
  return {
    def,
    current: Math.min(state.quest.goal, Math.max(0, def.metric(state) - state.quest.baseline)),
    goal: state.quest.goal,
  }
}

export interface CompletedQuest {
  name: string
  rewardText: string
}

export interface QuestCheckResult {
  state: GameState
  completed: CompletedQuest[]
}

export function checkQuests(state: GameState): QuestCheckResult {
  let current = state.quest.goal > 0 ? state : activateQuest(state, state.quest.index)
  if (questAt(current.quest.index).def.absolute && current.quest.baseline !== 0) {
    current = activateQuest(current, current.quest.index)
  }
  const completed: CompletedQuest[] = []
  for (let guard = 0; guard < QUEST_CHAIN.length + 10; guard += 1) {
    const { def } = questAt(current.quest.index)
    if (def.metric(current) - current.quest.baseline < current.quest.goal) break
    const rewarded = addResources(current, def.reward(current))
    completed.push({ name: def.name, rewardText: def.rewardText })
    current = activateQuest(
      {
        ...rewarded,
        stats: { ...rewarded.stats, questsCompleted: rewarded.stats.questsCompleted + 1 },
      },
      current.quest.index + 1,
    )
  }
  return { state: current, completed }
}
