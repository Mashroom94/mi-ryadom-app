import { createDefaultState } from '../data/defaults'
import type { AppState, Language } from '../models/types'

export interface StateStorage {
  load(): AppState
  save(state: AppState): void
  clear(): AppState
  getDurableUpdatedAt(): number
  markDurableUpdated(): void
}

const STORAGE_KEY = 'my-ryadom:v3'
const LEGACY_STORAGE_KEY = 'my-ryadom:v2'
const DURABLE_STATE_KEY = 'my-ryadom:durable-v1'
const DURABLE_UPDATED_AT_KEY = 'my-ryadom:durable-updated-at'

const detectLanguage = (): Language =>
  typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('en') ? 'en' : 'ru'

const mergeReleasedIdeas = (savedIdeas: AppState['ideas'] | undefined, defaults: AppState['ideas']) => {
  if (!savedIdeas?.length) return defaults
  const savedIds = new Set(savedIdeas.map((idea) => idea.id))
  return [...savedIdeas, ...defaults.filter((idea) => !savedIds.has(idea.id))]
}

export const localStateStorage: StateStorage = {
  load() {
    const fallback = createDefaultState(detectLanguage())
    try {
      const current = localStorage.getItem(STORAGE_KEY)
      const saved = current ?? localStorage.getItem(LEGACY_STORAGE_KEY)
      const parsed = saved ? JSON.parse(saved) as Partial<AppState> : {}
      const durable = JSON.parse(localStorage.getItem(DURABLE_STATE_KEY) || '{}') as Partial<AppState>
      if (!saved && !Object.keys(durable).length) return fallback
      const restored = { ...parsed, ...durable }
      const storedScale = Number(restored.customization?.scale)
      const scale = current
        ? Math.min(1, Math.max(0.5, Number.isFinite(storedScale) ? storedScale : fallback.customization.scale))
        : storedScale === 1
          ? fallback.customization.scale
          : Math.min(1, Math.max(0.5, Number.isFinite(storedScale) ? storedScale : fallback.customization.scale))
      return {
        ...fallback,
        ...restored,
        user: { ...fallback.user, ...restored.user },
        partner: { ...fallback.partner, ...restored.partner },
        customization: { ...fallback.customization, ...restored.customization, scale },
        customCharacters: restored.customCharacters ?? [],
        profile: { ...fallback.profile, ...restored.profile },
        ideas: mergeReleasedIdeas(restored.ideas, fallback.ideas),
        wishlist: restored.wishlist ?? [],
        plans: restored.plans ?? [],
        sharedBoard: restored.sharedBoard ?? fallback.sharedBoard,
        moneyLedger: restored.moneyLedger ?? fallback.moneyLedger,
        history: restored.history ?? [],
      }
    } catch {
      return fallback
    }
  },
  save(state) {
    try {
      const { user, partner, mood, moodUpdatedAt, customization, customCharacters, wishlist, ideas, plans, sharedBoard, moneyLedger, profile, history, partnerShared } = state
      localStorage.setItem(DURABLE_STATE_KEY, JSON.stringify({ user, partner, mood, moodUpdatedAt, customization, customCharacters, wishlist, ideas, plans, sharedBoard, moneyLedger, profile, history, partnerShared }))
    } catch {
      // Continue with the full snapshot attempt below.
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Keep the current session usable if an uploaded image or model exceeds
      // the browser's local persistence quota.
    }
  },
  clear() {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(LEGACY_STORAGE_KEY)
    localStorage.removeItem(DURABLE_STATE_KEY)
    localStorage.removeItem(DURABLE_UPDATED_AT_KEY)
    return createDefaultState(detectLanguage())
  },
  getDurableUpdatedAt() {
    const value = Number(localStorage.getItem(DURABLE_UPDATED_AT_KEY))
    return Number.isFinite(value) ? value : 0
  },
  markDurableUpdated() {
    localStorage.setItem(DURABLE_UPDATED_AT_KEY, String(Date.now()))
  },
}
