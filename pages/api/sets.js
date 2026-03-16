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

function parseCount(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^\d.]/g, '')
    if (!cleaned) return null
    const parsed = Number(cleaned)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function mapPokedataSet(set = {}) {
  const possibleCountFields = [
    set.card_count,
    set.total_cards,
    set.total,
    set.count,
    set.card_total,
    set.cardCount?.total,
    set.cardCount,
    set.stats?.cards,
    set.stats?.total_cards,
  ]

  const cardCount = possibleCountFields.map(parseCount).find((count) => count != null) ?? null

  return {
    id: String(set.set_id ?? set.id ?? set.code ?? set.slug ?? set.name ?? '').trim(),
    name: String(set.set_name ?? set.name ?? set.title ?? set.id ?? '').trim(),
    cardCount: { total: cardCount },
    symbol: set.symbol ?? set.symbol_url ?? set.images?.symbol ?? set.assets?.symbol ?? set.logo ?? null,
    logo: set.logo ?? set.logo_url ?? set.images?.logo ?? set.assets?.logo ?? set.symbol ?? null,
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

function normalizeSetName(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function mergePokedataWithTcgdex({ pokedataSets, tcgdexSets, quality = 'low' }) {
  if (!pokedataSets.length) return tcgdexSets
  if (!tcgdexSets.length) {
    return pokedataSets.map((set) => ({
      ...set,
      symbol: resolveSetAsset(set.symbol, quality),
      logo: resolveSetAsset(set.logo, quality),
    }))
  }

  const tcgdexById = new Map(tcgdexSets.map((set) => [String(set.id).toLowerCase(), set]))
  const tcgdexByName = new Map(tcgdexSets.map((set) => [normalizeSetName(set.name), set]))

  return pokedataSets.map((set) => {
    const matchedTcgdexSet = tcgdexById.get(String(set.id).toLowerCase()) || tcgdexByName.get(normalizeSetName(set.name))

    const resolvedSymbol = resolveSetAsset(set.symbol, quality) || matchedTcgdexSet?.symbol || null
    const resolvedLogo = resolveSetAsset(set.logo, quality) || matchedTcgdexSet?.logo || resolvedSymbol

    return {
      ...set,
      cardCount: {
        total: set.cardCount?.total ?? matchedTcgdexSet?.cardCount?.total ?? null,
      },
      symbol: resolvedSymbol,
      logo: resolvedLogo,
    }
  })
}

async function fetchPokedataSets({ setName = '' } = {}) {
  const query = new URLSearchParams()
  if (setName) query.set('set_name', setName)

  const response = await fetch(`https://www.pokedata.io/api/sets?${query.toString()}`)
  if (!response.ok) throw new Error(`Pokedata failed with ${response.status}`)

  const payload = await response.json()
  const sets = toArray(payload).map(mapPokedataSet).filter((set) => set.id && set.name)

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

  let pokedataSets = []

  try {
    pokedataSets = await fetchPokedataSets({ setName: requestedSetName })
  } catch (pokedataError) {
    console.error('Pokedata sets API failed:', pokedataError)
  }

  try {
    const tcgdexSets = await fetchTcgdexSets(requestedQuality)

    if (pokedataSets.length) {
      const mergedSets = mergePokedataWithTcgdex({
        pokedataSets,
        tcgdexSets,
        quality: requestedQuality,
      })
      res.status(200).json({ sets: mergedSets, source: 'live-pokedata+tcgdex' })
      return
    }

    res.status(200).json({ sets: tcgdexSets, source: 'live-tcgdex' })
    return
  } catch (tcgdexError) {
    console.error('TCGdex sets API failed:', tcgdexError)
  }

  if (pokedataSets.length) {
    const setsWithResolvedAssets = pokedataSets.map((set) => ({
      ...set,
      symbol: resolveSetAsset(set.symbol, requestedQuality),
      logo: resolveSetAsset(set.logo, requestedQuality),
    }))

    res.status(200).json({ sets: setsWithResolvedAssets, source: 'live-pokedata' })
    return
  }

  res.status(200).json({ sets: fallbackSets, source: 'fallback' })
}
