import type { ResourceId } from '../types'

export interface ResourceDef {
  id: ResourceId | 'darkMatter'
  name: string
  color: string
}

export const RESOURCES: ResourceDef[] = [
  { id: 'ore', name: 'Руда', color: '#e8a44a' },
  { id: 'alloy', name: 'Сплав', color: '#5ad1e6' },
  { id: 'chip', name: 'Чипы', color: '#7cf05a' },
  { id: 'darkMatter', name: 'Тёмная материя', color: '#c05af0' },
]

export const RESOURCE_IDS: ResourceId[] = ['ore', 'alloy', 'chip']

export const resourceName = (id: ResourceId | 'darkMatter'): string =>
  RESOURCES.find((r) => r.id === id)!.name
