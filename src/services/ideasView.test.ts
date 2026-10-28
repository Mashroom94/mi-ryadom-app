import { describe, expect, it } from 'vitest'
import type { Idea } from '../models/types'
import { groupIdeasForView } from './ideasView'

const suggested: Idea = { id: 'suggested', title: 'Готовая идея', description: '', category: 'home', saved: false }
const savedSuggestion: Idea = { id: 'saved-suggestion', title: 'Сохранённая идея', description: '', category: 'surprise', saved: true }
const own: Idea = { id: 'own', title: 'Моя идея', description: '', category: 'quiet', saved: true, custom: true }
const partner: Idea = { id: 'partner', title: 'Идея партнёра', description: '', category: 'outside', saved: true, custom: true }

describe('ideas view groups', () => {
  it('opens with custom ideas from the user and partner separated from suggestions', () => {
    const grouped = groupIdeasForView([suggested, own], [partner])

    expect(grouped.added.map(({ idea, partner }) => [idea.id, partner])).toEqual([
      ['own', false],
      ['partner', true],
    ])
    expect(grouped.suggested.map(({ idea }) => idea.id)).toEqual(['suggested'])
  })

  it('moves a saved suggestion into added ideas and keeps counts accurate', () => {
    const grouped = groupIdeasForView([suggested, savedSuggestion, own], [partner])

    expect(grouped.added.map(({ idea }) => idea.id)).toEqual(['saved-suggestion', 'own', 'partner'])
    expect(grouped.suggested.map(({ idea }) => idea.id)).toEqual(['suggested'])
  })
})
