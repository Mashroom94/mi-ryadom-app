import { createDefaultState } from '../data/defaults'
import type { AppState, Language, SharedProfile } from '../models/types'
import { normalizeMoneyLedger } from './sharedTools'
import { normalizeDisplayName } from './displayName'

export const SHARED_SCHEMA_VERSION = 6
const SHARED_CHARACTER_BUDGET = 720_000

function selectSyncableCharacters(state: AppState) {
  const selectedId = state.customization.characterId
  const ordered = [...state.customCharacters].sort((left, right) => Number(right.id === selectedId) - Number(left.id === selectedId))
  const selected: typeof state.customCharacters = []
  let size = 0
  for (const character of ordered) {
    const characterSize = JSON.stringify(character).length
    if (character.id === selectedId || size + characterSize <= SHARED_CHARACTER_BUDGET) {
      selected.push(character)
      size += characterSize
    }
  }
  return selected
}

export function createSharedProfile(state: AppState): SharedProfile {
  return {
    schemaVersion: SHARED_SCHEMA_VERSION,
    userName: state.user.name,
    profile: state.profile,
    mood: state.mood,
    moodUpdatedAt: state.moodUpdatedAt,
    customization: state.customization,
    customCharacters: selectSyncableCharacters(state),
    wishlist: state.wishlist,
    ideas: state.ideas,
    plans: state.plans,
    sharedBoard: state.sharedBoard,
    moneyLedger: state.moneyLedger,
  }
}

export function normalizeSharedProfile(profile: SharedProfile, language: Language): SharedProfile {
  const fallback = createDefaultState(language)
  const rawScale = Number(profile.customization?.scale)
  const legacyScale = (profile.schemaVersion ?? 0) < 2 && rawScale === 1
  const scale = legacyScale
    ? fallback.customization.scale
    : Math.min(1, Math.max(0.5, Number.isFinite(rawScale) ? rawScale : fallback.customization.scale))
  return {
    schemaVersion: SHARED_SCHEMA_VERSION,
    userName: typeof profile.userName === 'string' ? normalizeDisplayName(profile.userName) : undefined,
    profile: profile.profile ? { ...fallback.profile, ...profile.profile } : undefined,
    mood: profile.mood ?? null,
    moodUpdatedAt: profile.moodUpdatedAt ?? null,
    customization: { ...fallback.customization, ...profile.customization, scale },
    customCharacters: Array.isArray(profile.customCharacters) ? profile.customCharacters : [],
    wishlist: Array.isArray(profile.wishlist) ? profile.wishlist : [],
    ideas: Array.isArray(profile.ideas) && profile.ideas.length ? profile.ideas : fallback.ideas,
    plans: Array.isArray(profile.plans) ? profile.plans : [],
    sharedBoard: profile.sharedBoard && Array.isArray(profile.sharedBoard.strokes)
      ? { ...fallback.sharedBoard, ...profile.sharedBoard, ticTacToe: Array.isArray(profile.sharedBoard.ticTacToe) ? profile.sharedBoard.ticTacToe.slice(0, 9) : fallback.sharedBoard.ticTacToe, savedDrawings: Array.isArray(profile.sharedBoard.savedDrawings) ? profile.sharedBoard.savedDrawings.slice(0, 12) : [] }
      : fallback.sharedBoard,
    moneyLedger: profile.moneyLedger ? normalizeMoneyLedger(profile.moneyLedger) : fallback.moneyLedger,
  }
}

export function mergeServerProfile(local: AppState, remote: SharedProfile): AppState {
  const restored = normalizeSharedProfile(remote, local.profile.language)
  const defaultName = createDefaultState(local.profile.language).user.name
  const localName = local.user.name.trim()
  const retainedName = localName && localName !== defaultName ? local.user.name : restored.userName || local.user.name
  return {
    ...local,
    user: { ...local.user, name: retainedName },
    profile: restored.profile ?? local.profile,
    mood: restored.mood ?? local.mood,
    moodUpdatedAt: restored.moodUpdatedAt ?? local.moodUpdatedAt,
    customization: restored.customization,
    customCharacters: restored.customCharacters,
    wishlist: restored.wishlist,
    ideas: restored.ideas,
    plans: restored.plans ?? [],
    sharedBoard: restored.sharedBoard ?? local.sharedBoard,
    moneyLedger: restored.moneyLedger ?? local.moneyLedger,
  }
}
