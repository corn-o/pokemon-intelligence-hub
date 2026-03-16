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

function toArray(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.sets)) return payload.sets
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.results)) return payload.results
  return []
}

function mapPokedataSet(set = {}) {
  const cardCount =
    Number(set.card_count ?? set.total_cards ?? set.total ?? set.cardCount?.total ?? set.cardCount ?? set.count) || 0

  return {
    id: String(set.set_id ?? set.id ?? set.code ?? set.slug ?? set.name ?? '').trim(),
    name: String(set.set_name ?? set.name ?? set.title ?? set.id ?? '').trim(),
    cardCount: { total: cardCount || null },
    symbol: set.symbol ?? set.symbol_url ?? set.images?.symbol ?? set.logo ?? null,
    logo: set.logo ?? set.logo_url ?? set.images?.logo ?? set.symbol ?? null,
  }
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

async function fetchPokedataSets({ setName = '', quality = 'low' } = {}) {
  const query = new URLSearchParams()
  if (setName) query.set('set_name', setName)

  const response = await fetch(`https://www.pokedata.io/api/sets?${query.toString()}`)
  if (!response.ok) throw new Error(`Pokedata failed with ${response.status}`)

  const payload = await response.json()
  const sets = toArray(payload)
    .map(mapPokedataSet)
    .filter((set) => set.id && set.name)
    .map((set) => ({
      ...set,
      symbol: resolveSetAsset(set.symbol, quality),
      logo: resolveSetAsset(set.logo, quality),
    }))

  return sets
}

async function fetchTcgdexSets(quality = 'low') {
  const response = await fetch('https://api.tcgdex.net/v2/en/sets')
  if (!response.ok) throw new Error(`TCGdex failed with ${response.status}`)

  const data = await response.json()
  return mapTcgdexSets(data, quality)
}

/**
 * API route to return a list of Pokémon TCG sets.
 */
export default async function handler(req, res) {
  const requestedQuality = req.query?.quality === 'high' ? 'high' : 'low'
  const requestedSetName = typeof req.query?.set_name === 'string' ? req.query.set_name.trim() : ''

  try {
    const pokedataSets = await fetchPokedataSets({ setName: requestedSetName, quality: requestedQuality })
    if (pokedataSets.length) {
      res.status(200).json({ sets: pokedataSets, source: 'live-pokedata' })
      return
    }
  } catch (pokedataError) {
    console.error('Pokedata sets API failed:', pokedataError)
  }

  try {
    const tcgdexSets = await fetchTcgdexSets(requestedQuality)
    res.status(200).json({ sets: tcgdexSets, source: 'live-tcgdex' })
    return
  } catch (tcgdexError) {
    console.error('TCGdex sets API failed:', tcgdexError)
  }

  res.status(200).json({ sets: fallbackSets, source: 'fallback' })
}
