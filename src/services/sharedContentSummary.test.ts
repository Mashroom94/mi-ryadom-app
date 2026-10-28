import { describe, expect, it } from 'vitest'
import type { Idea, PlanItem, WishlistItem } from '../models/types'
import { sharedContentSummary } from './sharedContentSummary'

const ownIdeas: Idea[] = [
  { id: 'suggested', title: 'Предложение', description: '', category: 'home', saved: false },
  { id: 'saved', title: 'Сохранённая', description: '', category: 'home', saved: true },
]
const partnerIdeas: Idea[] = [{ id: 'partner', title: 'Партнёра', description: '', category: 'outside', saved: true, custom: true }]
const ownWishes: WishlistItem[] = [{ id: 'w1', title: 'Моё', description: '', category: 'gift', completed: false, createdAt: '2026-10-21' }]
const partnerWishes: WishlistItem[] = [{ id: 'w2', title: 'Партнёра', description: '', category: 'care', completed: false, createdAt: '2026-10-21' }]
const plans: PlanItem[] = [{ id: 'p1', title: 'Прогулка', date: '2026-10-24', completed: false, createdAt: '2026-10-21' }]

describe('sharedContentSummary', () => {
  it('sums saved ideas, calendar plans, and wishes from both partners', () => {
    expect(sharedContentSummary({ ownIdeas, partnerIdeas, ownWishes, partnerWishes, ownPlans: plans, partnerPlans: plans })).toEqual({
      ideas: 4,
      wishlist: 2,
    })
  })
})
