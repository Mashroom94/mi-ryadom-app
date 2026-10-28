import type { Idea } from '../models/types'

export interface DisplayIdea {
  idea: Idea
  partner: boolean
}

export function groupIdeasForView(ownIdeas: Idea[], partnerIdeas: Idea[]) {
  return {
    added: [
      ...ownIdeas.filter((idea) => idea.saved || idea.custom).map((idea) => ({ idea, partner: false })),
      ...partnerIdeas.filter((idea) => idea.saved || idea.custom).map((idea) => ({ idea, partner: true })),
    ] satisfies DisplayIdea[],
    suggested: ownIdeas.filter((idea) => !idea.custom && !idea.saved).map((idea) => ({ idea, partner: false })) satisfies DisplayIdea[],
  }
}
