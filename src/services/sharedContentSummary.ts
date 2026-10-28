import type { Idea, PlanItem, WishlistItem } from '../models/types'

interface SharedContentInput {
  ownIdeas: Idea[]
  partnerIdeas: Idea[]
  ownWishes: WishlistItem[]
  partnerWishes: WishlistItem[]
  ownPlans: PlanItem[]
  partnerPlans: PlanItem[]
}

export function sharedContentSummary(input: SharedContentInput) {
  const savedIdeas = [...input.ownIdeas, ...input.partnerIdeas].filter((idea) => idea.saved || idea.custom).length
  return {
    ideas: savedIdeas + input.ownPlans.length + input.partnerPlans.length,
    wishlist: input.ownWishes.length + input.partnerWishes.length,
  }
}
