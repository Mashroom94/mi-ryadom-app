import { beforeEach, describe, expect, it } from 'vitest'
import { createDefaultState } from '../data/defaults'
import { localStateStorage } from './storage'

const values = new Map<string, string>()
let blockedKey: string | null = null

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      if (key === blockedKey) throw new DOMException('Quota exceeded', 'QuotaExceededError')
      values.set(key, value)
    },
    removeItem: (key: string) => values.delete(key),
  },
})

describe('localStateStorage', () => {
  beforeEach(() => { values.clear(); blockedKey = null })

  it('keeps ideas, wishlist changes and the selected scale after an app restart', () => {
    const state = createDefaultState('ru')
    state.customization.scale = 0.86
    state.ideas[0] = { ...state.ideas[0], saved: true }
    state.ideas.unshift({ id: 'custom-idea', title: 'Вечер настольных игр', description: 'Чай и любимая игра', category: 'home', saved: true, custom: true })
    state.wishlist.push({ id: 'wish-1', title: 'Поездка', description: 'На выходные', category: 'experience', completed: false, createdAt: '2026-10-08T00:00:00.000Z' })
    state.plans.push({ id: 'plan-1', title: 'Поход в кино', date: '2026-10-24', completed: false, createdAt: '2026-10-21T00:00:00.000Z' })

    localStateStorage.save(state)
    const restored = localStateStorage.load()

    expect(restored.customization.scale).toBe(0.86)
    expect(restored.ideas.find((idea) => idea.id === 'custom-idea')?.saved).toBe(true)
    expect(restored.ideas.find((idea) => idea.id === 'offline-evening')?.saved).toBe(true)
    expect(restored.wishlist[0]?.title).toBe('Поездка')
    expect(restored.plans[0]?.title).toBe('Поход в кино')
  })

  it('adds newly released suggestions without losing saved and custom ideas', () => {
    const state = createDefaultState('ru')
    state.ideas = [
      { ...state.ideas[0], saved: true },
      { id: 'custom-idea', title: 'Наша идея', description: '', category: 'quiet', saved: true, custom: true },
    ]

    localStateStorage.save(state)
    const restored = localStateStorage.load()

    expect(restored.ideas.find((idea) => idea.id === 'offline-evening')?.saved).toBe(true)
    expect(restored.ideas.find((idea) => idea.id === 'custom-idea')).toBeDefined()
    expect(restored.ideas.find((idea) => idea.id === 'slow-breakfast')).toBeDefined()
  })

  it('keeps idea choices and custom entries when the full snapshot exceeds browser storage', () => {
    const state = createDefaultState('ru')
    state.ideas[0] = { ...state.ideas[0], saved: true }
    state.ideas.unshift({ id: 'custom-idea', title: 'Поездка за город', description: 'В субботу утром', category: 'outside', saved: true, custom: true })
    blockedKey = 'my-ryadom:v3'

    localStateStorage.save(state)
    const restored = localStateStorage.load()

    expect(restored.ideas.find((idea) => idea.id === 'offline-evening')?.saved).toBe(true)
    expect(restored.ideas.find((idea) => idea.id === 'custom-idea')?.description).toBe('В субботу утром')
  })

  it('keeps the last known partner character when the full snapshot exceeds browser storage', () => {
    const state = createDefaultState('ru')
    state.partnerShared = {
      customization: { ...state.customization, characterId: 'dinosaur', scale: 0.9 },
      customCharacters: [],
      wishlist: [],
      ideas: [],
    }
    blockedKey = 'my-ryadom:v3'

    localStateStorage.save(state)
    const restored = localStateStorage.load()

    expect(restored.partnerShared?.customization.characterId).toBe('dinosaur')
    expect(restored.partnerShared?.customization.scale).toBe(0.9)
  })

  it('keeps custom characters when the full snapshot exceeds browser storage', () => {
    const state = createDefaultState('ru')
    state.customCharacters = [{ id: 'saved-face', kind: 'face-mask', nameKey: 'customCharacter', accent: '#fff', bodyCharacterId: 'pig', name: 'Face', faceDataUrl: 'data:image/jpeg;base64,AA', faceScale: 2.8, faceOffsetX: 14, faceOffsetY: -9 }]
    state.customization.characterId = 'saved-face'
    blockedKey = 'my-ryadom:v3'

    localStateStorage.save(state)
    const restored = localStateStorage.load()

    expect(restored.customCharacters[0]).toMatchObject({ id: 'saved-face', faceScale: 2.8, faceOffsetX: 14, faceOffsetY: -9 })
    expect(restored.customization.characterId).toBe('saved-face')
  })
})
