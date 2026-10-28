import { describe, expect, it } from 'vitest'
import { characters, createDefaultState } from './defaults'

describe('createDefaultState', () => {
  it('creates an isolated Russian state with all demo ideas', () => {
    const state = createDefaultState('ru')
    expect(state.profile.language).toBe('ru')
    expect(state.customization.characterId).toBe('pig')
    expect(state.customization.scale).toBe(0.7)
    expect(state.ideas).toHaveLength(10)
    expect(state.ideas.map((idea) => idea.id)).toContain('slow-breakfast')
    expect(state.wishlist).toEqual([])
  })

  it('creates English profile defaults', () => {
    expect(createDefaultState('en').user.name).toBe('Maria')
  })

  it('uses the supplied full-size squirrel artwork at 100%', () => {
    expect(characters.find((character) => character.id === 'squirrel')?.assetPath).toBe('/assets/characters/squirrel-2.svg')
  })

  it('uses the supplied full-size pig artwork at 100%', () => {
    const pig = characters.find((character) => character.id === 'pig')
    expect(pig?.assetPath).toBe('/assets/characters/pig-2.svg')
    expect(pig?.transformerAssetPath).toBe('/assets/characters/pig-transformer.svg')
  })

  it('uses the supplied full-size frog artwork and transformer body at 100%', () => {
    const frog = characters.find((character) => character.id === 'frog')
    expect(frog?.assetPath).toBe('/assets/characters/frog-3.svg')
    expect(frog?.transformerAssetPath).toBe('/assets/characters/frog-transformer.svg')
  })

  it('uses the supplied full-size dinosaur artwork and transformer body at 100%', () => {
    const dinosaur = characters.find((character) => character.id === 'dinosaur')
    expect(dinosaur?.assetPath).toBe('/assets/characters/dinosaur-4.svg')
    expect(dinosaur?.transformerAssetPath).toBe('/assets/characters/dinosaur-transformer.svg')
  })
})
