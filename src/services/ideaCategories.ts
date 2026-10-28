import type { IdeaCategory } from '../models/types'

export type VisibleIdeaCategory = 'home' | 'outside' | 'experience'
export const visibleIdeaCategories = ['all', 'home', 'outside', 'experience'] as const

export function displayIdeaCategory(category: IdeaCategory): VisibleIdeaCategory {
  return category === 'home' || category === 'outside' ? category : 'experience'
}

export function ideaMatchesFilter(category: IdeaCategory, filter: 'all' | VisibleIdeaCategory) {
  return filter === 'all' || displayIdeaCategory(category) === filter
}
