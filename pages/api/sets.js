import { fallbackSets } from '../../data/fallbackData'
import { resolveTcgdexCardImageWithQuality, resolveTcgdexSetAssetUrl } from '../../utils/tcgdexAssets'

function resolveSetAsset(asset, quality = 'low') {
  if (!asset) return null

  const normalizedSetAsset = resolveTcgdexSetAssetUrl(asset)
  if (normalizedSetAsset) return normalizedSetAsset

  return resolveTcgdexCardImageWithQuality(asset, quality)
}

function resolveSetSymbol(set, quality = 'low') {
  return resolveSetAsset(set.symbol, quality) || resolveSetAsset(set.logo, quality)
}

function resolveSetLogo(set, quality = 'low') {
  return resolveSetAsset(set.logo, quality) || resolveSetAsset(set.symbol, quality)
}

function mapTcgdexSets(data, quality = 'low') {
  return data
    .filter((set) => set.name && set.cardCount)
    .map((set) => ({
      id: set.id,
      name: set.name,
      cardCount: set.cardCount,
      symbol: resolveSetSymbol(set, quality),
      logo: resolveSetLogo(set, quality),
    }))
}

function mapPokemonTcgSets(data) {
  return data
    .filter((set) => set.id && set.name && set.total)
    .map((set) => ({
      id: set.id,
      name: set.name,
      cardCount: { total: set.total },
      symbol: set.images?.symbol || set.images?.logo || null,
      logo: set.images?.logo || set.images?.symbol || null,
    }))
}

async function fetchTcgdexSets(quality = 'low') {
  const response = await fetch('https://api.tcgdex.net/v2/en/sets')
  if (!response.ok) throw new Error(`TCGdex failed with ${response.status}`)

  const data = await response.json()
  return mapTcgdexSets(data, quality)
}

async function fetchPokemonTcgSets() {
  const response = await fetch('https://api.pokemontcg.io/v2/sets?orderBy=-releaseDate&pageSize=250')
  if (!response.ok) throw new Error(`PokemonTCG failed with ${response.status}`)

  const payload = await response.json()
  return mapPokemonTcgSets(payload.data || [])
}

/**
 * API route to return a list of Pokémon TCG sets.
 */
export default async function handler(req, res) {
  const requestedQuality = req.query?.quality === 'high' ? 'high' : 'low'

  try {
    const tcgdexSets = await fetchTcgdexSets(requestedQuality)
    res.status(200).json({ sets: tcgdexSets, source: 'live-tcgdex' })
    return
  } catch (tcgdexError) {
    console.error('TCGdex sets API failed:', tcgdexError)
  }

  try {
    const pokemonTcgSets = await fetchPokemonTcgSets()
    res.status(200).json({ sets: pokemonTcgSets, source: 'live-pokemontcg' })
    return
  } catch (pokemonTcgError) {
    console.error('PokemonTCG sets API failed:', pokemonTcgError)
  }

  res.status(200).json({ sets: fallbackSets, source: 'fallback' })
}
