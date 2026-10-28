import { describe, expect, it } from 'vitest'
import { displayIdeaCategory, ideaMatchesFilter, visibleIdeaCategories } from './ideaCategories'

describe('idea categories', () => {
  it('shows only the four requested filters in their intended order', () => {
    expect(visibleIdeaCategories).toEqual(['all', 'home', 'outside', 'experience'])
  })

  it('groups legacy quiet and surprise ideas under experience', () => {
    expect(displayIdeaCategory('quiet')).toBe('experience')
    expect(displayIdeaCategory('surprise')).toBe('experience')
    expect(ideaMatchesFilter('quiet', 'experience')).toBe(true)
    expect(ideaMatchesFilter('home', 'experience')).toBe(false)
  })
})
