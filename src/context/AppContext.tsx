import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
/* eslint-disable react-refresh/only-export-components */
import { backgrounds, characters, createDefaultState } from '../data/defaults'
import { dictionaries, type TranslationKey } from '../i18n/dictionaries'
import type { AppState, Character, CustomizationSettings, Idea, IdeaCategory, Language, MoodId, PartnerEvent, PlanItem, ProfileSettings, SharedBoard, SharedMoneyLedger, SharedProfile, WishlistItem } from '../models/types'
import { localStateStorage } from '../services/storage'
import { localPartnerEventService } from '../services/partnerEvents'
import { remotePartnerService } from '../services/remotePartner'
import { playCharacterSound } from '../services/characterSounds'
import { createSharedProfile, mergeServerProfile, normalizeSharedProfile } from '../services/sharedProfile'
import { shouldPoll } from '../services/polling'
import { syncNotificationPreferences } from '../services/notificationPreferences'
import { recordActivity } from '../services/activityHistory'
import { resolveIncomingSound } from '../services/incomingSound'
import { resolvePartnerName } from '../services/partnerName'
import { normalizeDisplayName } from '../services/displayName'
import { removeCustomCharacter, upsertCustomCharacter } from '../services/faceCharacter'

interface AppContextValue {
  state: AppState
  t: (key: TranslationKey) => string
  setMood: (mood: MoodId) => void
  setCustomization: (updates: Partial<CustomizationSettings>) => void
  setProfile: (updates: Partial<ProfileSettings>) => void
  setNames: (userName: string, partnerName: string) => void
  addWish: (wish: Omit<WishlistItem, 'id' | 'createdAt' | 'completed'>) => void
  updateWish: (wish: WishlistItem) => void
  deleteWish: (id: string) => void
  toggleWish: (id: string) => void
  toggleIdea: (id: string) => void
  addIdea: (idea: Pick<Idea, 'title' | 'description' | 'category'>) => void
  deleteIdea: (id: string) => void
  addPlan: (plan: Pick<PlanItem, 'title' | 'date'>) => void
  deletePlan: (id: string) => void
  togglePlan: (id: string) => void
  updateSharedBoard: (board: SharedBoard, message?: string, notify?: boolean) => void
  updateMoneyLedger: (ledger: SharedMoneyLedger, message?: string) => void
  addCustomCharacter: (character: Character) => void
  deleteCustomCharacter: (id: string) => void
  addEvent: (event: PartnerEvent) => void
  refreshPartner: () => Promise<void>
  resetCustomization: () => void
  clearData: () => void
  ideaCategories: Array<'all' | IdeaCategory>
}

const AppContext = createContext<AppContextValue | null>(null)
const id = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => localStateStorage.load())
  const [remoteReady, setRemoteReady] = useState(false)
  const durableState = useMemo<SharedProfile>(() => createSharedProfile(state), [state])
  const durableStateRef = useRef(durableState)
  durableStateRef.current = durableState
  const durableSignature = useMemo(() => JSON.stringify(durableState), [durableState])
  const receivedIds = useRef(new Set(state.history.map((event) => event.id)))
  const remoteHydrated = useRef(false)
  const initialSharedSignature = useRef(durableSignature)
  const lastDurableSignature = useRef(durableSignature)
  const localChangedBeforeHydration = useRef(false)
  const playIncomingSound = (current: AppState) => {
    const sound = resolveIncomingSound(current)
    if (sound) playCharacterSound(sound.characterId, sound.mode, sound.customSoundDataUrl)
  }

  useEffect(() => {
    if (!remoteReady && durableSignature !== initialSharedSignature.current) localChangedBeforeHydration.current = true
  }, [durableSignature, remoteReady])

  useEffect(() => {
    localStateStorage.save(state)
    if (durableSignature !== lastDurableSignature.current) {
      lastDurableSignature.current = durableSignature
      localStateStorage.markDurableUpdated()
    }
    document.documentElement.lang = state.profile.language
    const selectedBackground = backgrounds.find((item) => item.id === state.customization.backgroundId) ?? backgrounds[0]
    document.documentElement.style.setProperty('--app-bg', selectedBackground.color)
  }, [durableSignature, state])

  useEffect(() => {
    syncNotificationPreferences(state.profile.vibrationEnabled)
  }, [state.profile.vibrationEnabled])

  useEffect(() => localPartnerEventService.subscribe(
    (event) => setState((current) => {
      playIncomingSound(current)
      if (current.profile.vibrationEnabled) navigator.vibrate?.([70, 35, 70])
      return { ...current, history: recordActivity(current.history, event) }
    }),
    (online) => setState((current) => current.partner.online === online ? current : { ...current, partner: { ...current.partner, online } }),
  ), [])

  const applyPartnerStatus = useCallback((status: { paired: boolean; partnerName: string | null; partnerOnline: boolean }) => {
    setState((current) => ({
      ...current,
      partner: {
        ...current.partner,
        name: resolvePartnerName(current.partner.name, status.partnerName, status.paired, createDefaultState(current.profile.language).partner.name),
        online: status.paired && status.partnerOnline,
      },
    }))
  }, [])

  const refreshPartner = useCallback(async () => {
    try { applyPartnerStatus(await remotePartnerService.heartbeat()) } catch { /* Keep local fallback available. */ }
  }, [applyPartnerStatus])

  useEffect(() => {
    let active = true
    let syncing = false
    const sync = async (force = false) => {
      if (syncing || (!force && !shouldPoll(document.visibilityState))) return
      syncing = true
      try {
        const status = await remotePartnerService.register(state.user.name)
        if (!active || !status.available) return
        applyPartnerStatus(status)
        if (status.paired) await remotePartnerService.sync(durableStateRef.current)
        const resentIds = status.paired ? await localPartnerEventService.flush() : []
        if (resentIds.length) setState((current) => ({
          ...current,
          history: current.history.map((event) => resentIds.includes(event.id) ? { ...event, delivery: 'remote', status: 'sent' } : event),
        }))
        if (!remoteHydrated.current) {
          const own = await remotePartnerService.pullOwnState()
          if (!active || !own.available) return
          remoteHydrated.current = true
          const remoteIsNewer = (own.updatedAt ?? 0) > localStateStorage.getDurableUpdatedAt()
          if (own.state && !localChangedBeforeHydration.current && remoteIsNewer) {
            setState((current) => mergeServerProfile(current, own.state!))
          }
          setRemoteReady(true)
        }
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') void remotePartnerService.enableNotifications()
        const events = await remotePartnerService.poll()
        const fresh = events.filter((event) => !receivedIds.current.has(event.id))
        fresh.forEach((event) => receivedIds.current.add(event.id))
        const partnerShared = await remotePartnerService.pullPartnerState()
        if (fresh.length || partnerShared) setState((current) => {
          const normalizedPartner = partnerShared ? normalizeSharedProfile(partnerShared, current.profile.language) : null
          const next = normalizedPartner ? {
            ...current,
            partner: normalizedPartner.userName ? { ...current.partner, name: normalizedPartner.userName } : current.partner,
            partnerShared: normalizedPartner,
          } : current
          if (fresh.length) playIncomingSound(next)
          if (fresh.length && current.profile.vibrationEnabled) navigator.vibrate?.([70, 35, 70])
          return fresh.length ? { ...next, history: fresh.reduce(recordActivity, next.history) } : next
        })
      } finally {
        syncing = false
      }
    }
    const onVisibilityChange = () => { if (shouldPoll(document.visibilityState)) void sync(true) }
    const onServiceWorkerMessage = (event: MessageEvent<{ kind?: string }>) => { if (event.data?.kind === 'partner-event') void sync(true) }
    document.addEventListener('visibilitychange', onVisibilityChange)
    navigator.serviceWorker?.addEventListener('message', onServiceWorkerMessage)
    void sync(true)
    const poll = window.setInterval(() => void sync(), 15_000)
    return () => { active = false; document.removeEventListener('visibilitychange', onVisibilityChange); navigator.serviceWorker?.removeEventListener('message', onServiceWorkerMessage); window.clearInterval(poll) }
  }, [applyPartnerStatus, state.profile.language, state.user.name])

  useEffect(() => {
    if (!remoteReady) return
    const timer = window.setTimeout(() => {
      void remotePartnerService.sync(durableState)
    }, 180)
    return () => window.clearTimeout(timer)
  }, [durableState, remoteReady])

  const rememberSharedActivity = useCallback(async (type: PartnerEvent['type'], payload: string, sharedState?: SharedProfile, eventId?: string) => {
    const event = await localPartnerEventService.send(type, payload, eventId, sharedState)
    setState((current) => ({ ...current, history: recordActivity(current.history, event) }))
  }, [])

  const commitSharedChange = useCallback((type: PartnerEvent['type'], payload: string, update: (current: AppState) => AppState) => {
    const eventId = id()
    let scheduled = false
    setState((current) => {
      const next = update(current)
      if (!scheduled) {
        scheduled = true
        queueMicrotask(() => void rememberSharedActivity(type, payload, createSharedProfile(next), eventId))
      }
      return next
    })
  }, [rememberSharedActivity])

  const value = useMemo<AppContextValue>(() => ({
    state,
    t: (key) => dictionaries[state.profile.language][key],
    setMood: (mood) => {
      commitSharedChange('mood', mood, (current) => ({ ...current, mood, moodUpdatedAt: new Date().toISOString() }))
    },
    setCustomization: (updates) => {
      const update = (current: AppState) => ({ ...current, customization: { ...current.customization, ...updates } })
      setState(update)
    },
    setProfile: (updates) => setState((current) => ({ ...current, profile: { ...current.profile, ...updates } })),
    setNames: (userName, partnerName) => setState((current) => ({ ...current, user: { ...current.user, name: normalizeDisplayName(userName) }, partner: { ...current.partner, name: normalizeDisplayName(partnerName) } })),
    addWish: (wish) => {
      commitSharedChange('wishlist', wish.title, (current) => ({ ...current, wishlist: [{ ...wish, id: id(), createdAt: new Date().toISOString(), completed: false }, ...current.wishlist] }))
    },
    updateWish: (wish) => {
      commitSharedChange('wishlist', wish.title, (current) => ({ ...current, wishlist: current.wishlist.map((item) => item.id === wish.id ? wish : item) }))
    },
    deleteWish: (wishId) => {
      const wish = state.wishlist.find((item) => item.id === wishId)
      if (wish) commitSharedChange('wishlist', wish.title, (current) => ({ ...current, wishlist: current.wishlist.filter((item) => item.id !== wishId) }))
    },
    toggleWish: (wishId) => {
      const wish = state.wishlist.find((item) => item.id === wishId)
      if (wish) commitSharedChange('wishlist', wish.title, (current) => ({ ...current, wishlist: current.wishlist.map((item) => item.id === wishId ? { ...item, completed: !item.completed } : item) }))
    },
    toggleIdea: (ideaId) => {
      const idea = state.ideas.find((item) => item.id === ideaId)
      if (idea) commitSharedChange('idea', idea.title || idea.titleKey || 'idea', (current) => ({ ...current, ideas: current.ideas.map((item) => item.id === ideaId ? { ...item, saved: !item.saved } : item) }))
    },
    addIdea: (idea) => {
      commitSharedChange('idea', idea.title || 'idea', (current) => ({ ...current, ideas: [{ ...idea, id: id(), saved: true, custom: true }, ...current.ideas] }))
    },
    deleteIdea: (ideaId) => {
      const idea = state.ideas.find((item) => item.id === ideaId && item.custom)
      if (idea) commitSharedChange('idea', idea.title || idea.titleKey || 'idea', (current) => ({ ...current, ideas: current.ideas.filter((item) => item.id !== ideaId || !item.custom) }))
    },
    addPlan: (plan) => {
      commitSharedChange('idea', plan.title, (current) => ({ ...current, plans: [{ ...plan, id: id(), completed: false, createdAt: new Date().toISOString() }, ...current.plans] }))
    },
    deletePlan: (planId) => {
      const plan = state.plans.find((item) => item.id === planId)
      if (plan) commitSharedChange('idea', plan.title, (current) => ({ ...current, plans: current.plans.filter((item) => item.id !== planId) }))
    },
    togglePlan: (planId) => {
      const plan = state.plans.find((item) => item.id === planId)
      if (plan) commitSharedChange('idea', plan.title, (current) => ({ ...current, plans: current.plans.map((item) => item.id === planId ? { ...item, completed: !item.completed } : item) }))
    },
    updateSharedBoard: (board, message = 'Общий лист обновлён', notify = true) => {
      if (notify) commitSharedChange('notes', message, (current) => ({ ...current, sharedBoard: board }))
      else setState((current) => ({ ...current, sharedBoard: board }))
    },
    updateMoneyLedger: (ledger, message = 'money-updated') => {
      commitSharedChange('notes', message, (current) => ({ ...current, moneyLedger: ledger }))
    },
    addCustomCharacter: (character) => {
      setState((current) => ({ ...current, customCharacters: upsertCustomCharacter(current.customCharacters, character), customization: { ...current.customization, characterId: character.id } }))
    },
    deleteCustomCharacter: (characterId) => {
      setState((current) => {
        const next = removeCustomCharacter(current.customCharacters, current.customization.characterId, characterId, characters[0].id)
        return { ...current, customCharacters: next.characters, customization: { ...current.customization, characterId: next.characterId } }
      })
    },
    addEvent: (event) => setState((current) => ({ ...current, history: recordActivity(current.history, event) })),
    refreshPartner,
    resetCustomization: () => {
      setState((current) => ({ ...current, customization: createDefaultState(current.profile.language).customization }))
    },
    clearData: () => setState(localStateStorage.clear()),
    ideaCategories: ['all', 'home', 'outside', 'experience'],
  }), [commitSharedChange, refreshPartner, state])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}

export function isLanguage(value: string): value is Language {
  return value === 'ru' || value === 'en'
}
