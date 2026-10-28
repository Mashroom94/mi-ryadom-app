import { characters } from '../data/defaults'
import type { Character } from '../models/types'
import { CharacterArtwork } from './CharacterArtwork'

const stickerAssetFor = (character: Character) => {
  if (character.id === 'pig') return '/assets/characters/pig_main_clean_v2.png'
  if (character.id === 'squirrel') return '/assets/characters/squirrel_heart.png'
  return character.kind === 'glb-model' ? characters[0].assetPath! : character.assetPath ?? characters[0].assetPath!
}

export function StickerArtwork({ character }: { character: Character }) {
  if (character.kind === 'uploaded-image' || character.kind === 'face-mask') return <CharacterArtwork character={character} />
  return <img src={stickerAssetFor(character)} alt="" aria-hidden="true" />
}
