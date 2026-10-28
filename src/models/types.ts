export type Language = 'ru' | 'en'
export type CharacterKind = 'preset' | 'uploaded-image' | 'glb-model' | 'face-mask'
export type FaceEffect = 'none'
export type FaceMaskFamily = 'wide' | 'frog'
export type PhotoShape = 'heart' | 'star' | 'flower' | 'cloud'
export type MoodId = 'calm' | 'joy' | 'romance' | 'tiredness' | 'sadness' | 'anger'
export type SignId = 'kiss' | 'hug' | 'miss' | 'support'
export type ReactionId = 'bounce' | 'sway' | 'pulse'
export type CharacterSound = 'character' | 'grunt' | 'croak' | 'chime' | 'custom' | 'silent'
export type IdeaCategory = 'home' | 'outside' | 'experience' | 'quiet' | 'surprise'
export type WishCategory = 'gift' | 'experience' | 'care'

export interface User { id: string; name: string }
export interface Partner { id: string; name: string; online: boolean }

export interface Character {
  id: string
  kind: CharacterKind
  nameKey: string
  accent: string
  assetPath?: string
  transformerAssetPath?: string
  name?: string
  bodyCharacterId?: string
  faceDataUrl?: string
  faceScale?: number
  faceOffsetX?: number
  faceOffsetY?: number
  faceStretchX?: number
  faceEffect?: FaceEffect
  faceMaskFamily?: FaceMaskFamily
  photoShape?: PhotoShape
  photoScale?: number
  photoOffsetX?: number
  photoOffsetY?: number
}

export interface CustomizationSettings {
  characterId: string
  backgroundId: string
  scale: number
  animationEnabled: boolean
  reaction: ReactionId
  notificationSound: CharacterSound
  customSoundDataUrl?: string
  customSoundName?: string
}

export interface WishlistItem {
  id: string
  title: string
  description: string
  category: WishCategory
  completed: boolean
  createdAt: string
}

export interface Idea {
  id: string
  titleKey?: string
  descriptionKey?: string
  title?: string
  description?: string
  category: IdeaCategory
  saved: boolean
  custom?: boolean
}

export interface PlanItem {
  id: string
  title: string
  date: string
  completed: boolean
  createdAt: string
}

export interface DrawingStroke {
  id: string
  color: string
  width: number
  points: Array<{ x: number; y: number }>
}

export interface SharedBoard {
  mode: 'draw' | 'tic-tac-toe'
  strokes: DrawingStroke[]
  ticTacToe: Array<'x' | 'o' | null>
  savedDrawings: SharedDrawing[]
  updatedAt: string
}

export interface SharedDrawing {
  id: string
  strokes: DrawingStroke[]
  createdAt: string
}

export interface MoneyEntry {
  id: string
  title: string
  amount: number
  kind: 'expense' | 'income'
  paidBy: 'me' | 'partner' | 'shared'
  source?: string
  note?: string
  createdAt: string
}

export interface MoneyEnvelope {
  id: string
  title: string
  targetAmount: number
  targetDate?: string
  note?: string
  entries: MoneyEntry[]
  createdAt: string
}

export interface SharedMoneyLedger {
  entries: MoneyEntry[]
  envelopes: MoneyEnvelope[]
  updatedAt: string
}

export interface ProfileSettings {
  language: Language
  soundEnabled: boolean
  vibrationEnabled: boolean
  animationsEnabled: boolean
}

export interface PartnerEvent {
  id: string
  type: 'sign' | 'sticker' | 'touch' | 'mood' | 'wishlist' | 'idea' | 'customization' | 'notes'
  payload: string
  createdAt: string
  delivery: 'local' | 'remote'
  direction: 'sent' | 'received'
  status?: 'sending' | 'queued' | 'sent' | 'failed'
}

export interface SharedProfile {
  schemaVersion?: number
  userName?: string
  profile?: ProfileSettings
  mood?: MoodId | null
  moodUpdatedAt?: string | null
  customization: CustomizationSettings
  customCharacters: Character[]
  wishlist: WishlistItem[]
  ideas: Idea[]
  plans?: PlanItem[]
  sharedBoard?: SharedBoard
  moneyLedger?: SharedMoneyLedger
}

export interface AppState {
  user: User
  partner: Partner
  mood: MoodId | null
  moodUpdatedAt: string | null
  customization: CustomizationSettings
  customCharacters: Character[]
  wishlist: WishlistItem[]
  ideas: Idea[]
  plans: PlanItem[]
  sharedBoard: SharedBoard
  moneyLedger: SharedMoneyLedger
  profile: ProfileSettings
  history: PartnerEvent[]
  partnerShared?: SharedProfile
}

