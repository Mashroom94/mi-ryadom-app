import type { CharacterSound } from '../models/types'

type SoundNote = [from: number, to: number, delay: number, duration: number, type: OscillatorType]

export function resolveCharacterSoundAsset(characterId: string, mode: CharacterSound) {
  if (mode === 'grunt' || (mode === 'character' && characterId === 'pig')) return '/assets/sounds/pig-grunt.mp3'
  if (mode === 'croak' || (mode === 'character' && characterId === 'frog')) return '/assets/sounds/frog-croak.mp3'
  return null
}

export function characterSoundNotes(characterId: string, mode: CharacterSound): SoundNote[] {
  if (mode === 'grunt') return [[145, 92, 0, .16, 'sawtooth'], [130, 78, .18, .18, 'sawtooth'], [118, 72, .38, .2, 'triangle']]
  if (mode === 'croak') return [[118, 76, 0, .28, 'square'], [105, 68, .3, .36, 'square']]
  if (mode === 'chime') return [[660, 880, 0, .25, 'sine']]
  if (mode !== 'character') return []
  if (characterId === 'frog') return [[125, 82, 0, .42, 'square']]
  if (characterId === 'dinosaur') return [[92, 54, 0, .62, 'sawtooth']]
  if (characterId === 'squirrel') return [[780, 1120, 0, .15, 'sine'], [920, 1320, .18, .16, 'sine']]
  return [[165, 105, 0, .22, 'sawtooth'], [150, 92, .26, .24, 'sawtooth']]
}

export function playCharacterSound(characterId: string, mode: CharacterSound, customSoundDataUrl?: string) {
  if (mode === 'silent') return
  try {
    const recordedAsset = resolveCharacterSoundAsset(characterId, mode)
    if (mode === 'custom' || recordedAsset) {
      const source = mode === 'custom' ? customSoundDataUrl : recordedAsset
      if (!source) return
      const recordedAudio = new Audio(source)
      recordedAudio.volume = 0.62
      recordedAudio.muted = false
      void recordedAudio.play().catch(() => undefined)
      return
    }
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return
    const audio = new AudioContextClass()
    void audio.resume().catch(() => undefined)
    const gain = audio.createGain()
    gain.connect(audio.destination)
    gain.gain.setValueAtTime(0.0001, audio.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.09, audio.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.7)
    const notes = characterSoundNotes(characterId, mode)
    notes.forEach(([from, to, delay, duration, type]) => {
      const oscillator = audio.createOscillator()
      oscillator.type = type as OscillatorType
      oscillator.frequency.setValueAtTime(Number(from), audio.currentTime + Number(delay))
      oscillator.frequency.exponentialRampToValueAtTime(Number(to), audio.currentTime + Number(delay) + Number(duration))
      oscillator.connect(gain)
      oscillator.start(audio.currentTime + Number(delay))
      oscillator.stop(audio.currentTime + Number(delay) + Number(duration))
    })
    window.setTimeout(() => void audio.close(), 900)
  } catch { /* Audio remains optional when the browser blocks playback. */ }
}
