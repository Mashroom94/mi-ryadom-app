import type { AppState, Character, Idea, Language } from '../models/types'

export const characters: Character[] = [
  { id: 'pig', kind: 'preset', nameKey: 'characterPig', accent: '#f2a7b7', assetPath: '/assets/characters/pig-2.svg', transformerAssetPath: '/assets/characters/pig-transformer.svg', faceMaskFamily: 'wide' },
  { id: 'frog', kind: 'preset', nameKey: 'characterFrog', accent: '#8fcfba', assetPath: '/assets/characters/frog-3.svg', transformerAssetPath: '/assets/characters/frog-transformer.svg', faceMaskFamily: 'frog' },
  { id: 'dinosaur', kind: 'preset', nameKey: 'characterDinosaur', accent: '#7dbfc2', assetPath: '/assets/characters/dinosaur-4.svg', transformerAssetPath: '/assets/characters/dinosaur-transformer.svg', faceMaskFamily: 'wide' },
  { id: 'squirrel', kind: 'preset', nameKey: 'characterSquirrel', accent: '#d9864c', assetPath: '/assets/characters/squirrel-2.svg', transformerAssetPath: '/assets/characters/squirrel-transformer.svg', faceMaskFamily: 'wide' },
]

export const backgrounds = [
  { id: 'sky', color: '#edf5ff' },
  { id: 'lilac', color: '#f1f0fb' },
  { id: 'pearl', color: '#f3f6f8' },
  { id: 'mist', color: '#eaf4f4' },
] as const

export const defaultIdeas: Idea[] = [
  { id: 'offline-evening', titleKey: 'ideaOfflineTitle', descriptionKey: 'ideaOfflineDescription', category: 'experience', saved: false },
  { id: 'cook-together', titleKey: 'ideaCookTitle', descriptionKey: 'ideaCookDescription', category: 'home', saved: false },
  { id: 'walk', titleKey: 'ideaWalkTitle', descriptionKey: 'ideaWalkDescription', category: 'outside', saved: false },
  { id: 'movie', titleKey: 'ideaMovieTitle', descriptionKey: 'ideaMovieDescription', category: 'home', saved: false },
  { id: 'surprise', titleKey: 'ideaSurpriseTitle', descriptionKey: 'ideaSurpriseDescription', category: 'experience', saved: false },
  { id: 'slow-breakfast', titleKey: 'ideaBreakfastTitle', descriptionKey: 'ideaBreakfastDescription', category: 'home', saved: false },
  { id: 'shared-playlist', titleKey: 'ideaPlaylistTitle', descriptionKey: 'ideaPlaylistDescription', category: 'experience', saved: false },
  { id: 'photo-walk', titleKey: 'ideaPhotoWalkTitle', descriptionKey: 'ideaPhotoWalkDescription', category: 'outside', saved: false },
  { id: 'memory-jar', titleKey: 'ideaMemoryJarTitle', descriptionKey: 'ideaMemoryJarDescription', category: 'experience', saved: false },
  { id: 'sunset-tea', titleKey: 'ideaSunsetTeaTitle', descriptionKey: 'ideaSunsetTeaDescription', category: 'outside', saved: false },
]

export function createDefaultState(language: Language): AppState {
  return {
    user: { id: 'local-user', name: language === 'ru' ? 'Мария' : 'Maria' },
    partner: { id: 'demo-partner', name: 'Alex', online: false },
    mood: null,
    moodUpdatedAt: null,
    customization: {
      characterId: 'pig',
      backgroundId: 'sky',
      scale: 0.7,
      animationEnabled: true,
      reaction: 'bounce',
      notificationSound: 'character',
    },
    customCharacters: [],
    wishlist: [],
    ideas: defaultIdeas,
    plans: [],
    sharedBoard: { mode: 'draw', strokes: [], ticTacToe: Array(9).fill(null), savedDrawings: [], updatedAt: '' },
    moneyLedger: { entries: [], envelopes: [], updatedAt: '' },
    profile: {
      language,
      soundEnabled: false,
      vibrationEnabled: true,
      animationsEnabled: true,
    },
    history: [],
  }
}

