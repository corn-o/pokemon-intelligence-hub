import { fallbackCards } from '../../data/fallbackData'
import { resolveTcgdexImage } from '../../utils/tcgdexAssets'

/**
 * API route for Pokémon card information.
 * Uses pokedata.io for set-level card + pricing feeds and falls back
 * to TCGdex / Pokémon TCG APIs for name or id based card lookups.
 */

function extractPriceSnapshot(card = {}) {
  const marketSources = [
    card.tcgplayer,
    card.cardmarket,
    card.pricing,
    card.market,
    card.prices,
    card.price,
    card.price_data,
    card.market_prices,
  ].filter(Boolean)

  let low = null
  let market = null
  let high = null

  const numericValues = []

  const visit = (value) => {
    if (!value || typeof value !== 'object') return

    for (const [key, raw] of Object.entries(value)) {
      if (typeof raw === 'number' && Number.isFinite(raw)) {
        numericValues.push(raw)

        if (low == null && /(low|min)/i.test(key)) low = raw
        if (market == null && /(market|mid|trend|average|avg|sell)/i.test(key)) market = raw
        if (high == null && /(high|max)/i.test(key)) high = raw
      } else if (raw && typeof raw === 'object') {
        visit(raw)
      }
    }
  }

  marketSources.forEach(visit)

  if (market == null && numericValues.length) {
    const sorted = [...numericValues].sort((a, b) => a - b)
    const middleIndex = Math.floor(sorted.length / 2)
    market = sorted[middleIndex]
    low ??= sorted[0]
    high ??= sorted[sorted.length - 1]
  }

  return {
    lowPrice: low,
    marketPrice: market,
    highPrice: high,
  }
}

function normalizePokemonTcgPrices(card = {}) {
  const prices = card.tcgplayer?.prices || {}
  const candidates = Object.values(prices).filter((entry) => entry && typeof entry === 'object')

  if (!candidates.length) {
    return {
      lowPrice: null,
      marketPrice: card.cardmarket?.prices?.averageSellPrice ?? null,
      highPrice: null,
    }
  }

  const lows = candidates.map((entry) => entry.low).filter((value) => typeof value === 'number' && Number.isFinite(value))
  const markets = candidates.map((entry) => entry.market).filter((value) => typeof value === 'number' && Number.isFinite(value))
  const highs = candidates.map((entry) => entry.high).filter((value) => typeof value === 'number' && Number.isFinite(value))

  return {
    lowPrice: lows.length ? Math.min(...lows) : null,
    marketPrice: markets.length ? markets[0] : null,
    highPrice: highs.length ? Math.max(...highs) : null,
  }
}

function hasAnyPrice(price = {}) {
  return [price.lowPrice, price.marketPrice, price.highPrice].some((value) => typeof value === 'number')
}

function mapCard(card, marketById = new Map()) {
  const setName = card.set?.name || card.set?.id || 'Unknown'
  const rawImage = card.image || card.imageUrl || card.images?.large || card.images?.small || ''
  const tcgdexPrice = extractPriceSnapshot(card)
  const externalPrice = marketById.get(card.id)

  return {
    id: card.id,
    name: card.name,
    image: resolveTcgdexImage(rawImage) || rawImage,
    setName,
    tcgplayer: hasAnyPrice(tcgdexPrice) ? tcgdexPrice : externalPrice || tcgdexPrice,
    details: card.rarity ? { rarity: card.rarity, number: card.localId || card.number || null } : undefined,
  }
}

function toArray(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.cards)) return payload.cards
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.results)) return payload.results
  return []
}

function mapPokedataCard(card = {}) {
  const rawImage =
    card.image ||
    card.image_url ||
    card.img ||
    card.images?.large ||
    card.images?.small ||
    card.pictures?.large ||
    card.pictures?.small ||
    ''

  const setName = card.set_name || card.set?.name || card.set || 'Unknown'
  const price = extractPriceSnapshot(card)

  return {
    id: String(card.card_id ?? card.id ?? card.uuid ?? `${setName}-${card.name ?? 'card'}`).trim(),
    name: String(card.card_name ?? card.name ?? card.title ?? 'Unknown Card').trim(),
    image: resolveTcgdexImage(rawImage) || rawImage,
    setName,
    tcgplayer: price,
    details: {
      number: card.card_number ?? card.number ?? null,
      rarity: card.rarity ?? card.rarity_name ?? null,
      hp: card.hp ?? null,
      types: card.types ?? null,
      artist: card.artist ?? null,
    },
  }
}

async function fetchTcgdexJson(url) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`TCGdex request failed: ${response.status}`)
  }
  return response.json()
}

async function fetchPokedataCardsBySet(setName) {
  const query = new URLSearchParams({
    set_name: setName,
    tcg: '',
    stats: 'kwan',
  })

  const response = await fetch(`https://www.pokedata.io/api/cards?${query.toString()}`)
  if (!response.ok) throw new Error(`Pokedata request failed: ${response.status}`)

  const payload = await response.json()
  const cards = toArray(payload).map(mapPokedataCard).filter((card) => card.id && card.name)

  return cards
}

async function fetchPokemonTcgMarketByIds(ids = []) {
  const normalizedIds = [...new Set(ids.filter(Boolean))]
  if (!normalizedIds.length) return new Map()

  const chunks = []
  const chunkSize = 8

  for (let i = 0; i < normalizedIds.length; i += chunkSize) {
    chunks.push(normalizedIds.slice(i, i + chunkSize))
  }

  const aggregate = new Map()

  try {
    for (const chunk of chunks) {
      const query = chunk.map((cardId) => `id:${cardId}`).join(' OR ')
      const url = `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(query)}&select=id,tcgplayer,cardmarket`
      const timeout = AbortSignal.timeout(2500)
      const response = await fetch(url, { signal: timeout })
      if (!response.ok) throw new Error(`Pokémon TCG API failed: ${response.status}`)

      const payload = await response.json()
      const cards = Array.isArray(payload?.data) ? payload.data : []
      cards.forEach((card) => {
        aggregate.set(card.id, normalizePokemonTcgPrices(card))
      })
    }

    return aggregate
  } catch (error) {
    console.warn('Unable to fetch Pokémon TCG market data:', error)
    return new Map()
  }
}

function mapPokemonTcgCard(card = {}) {
  const price = normalizePokemonTcgPrices(card)
  return {
    id: card.id,
    name: card.name,
    image: card.images?.large || card.images?.small || '',
    setName: card.set?.name || card.set?.id || 'Unknown',
    tcgplayer: price,
  }
}

async function fetchPokemonTcgCardsByName(name) {
  const query = `name:${JSON.stringify(name)}`
  const url = `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(query)}&pageSize=15&select=id,name,images,set,tcgplayer,cardmarket`
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Pokémon TCG API failed: ${response.status}`)

  const payload = await response.json()
  const cards = Array.isArray(payload?.data) ? payload.data : []
  return cards.map(mapPokemonTcgCard)
}

async function fetchPokemonTcgCardById(id) {
  const response = await fetch(`https://api.pokemontcg.io/v2/cards/${encodeURIComponent(id)}`)
  if (!response.ok) throw new Error(`Pokémon TCG API failed: ${response.status}`)

  const payload = await response.json()
  if (!payload?.data) return null
  return mapPokemonTcgCard(payload.data)
}

export default async function handler(req, res) {
  const { name, id, set_name: setName } = req.query

  function fallbackSearch(queryName = '') {
    const q = queryName.toLowerCase()
    return fallbackCards
      .filter((card) => card.name.toLowerCase().includes(q))
      .map((card) => ({ ...card, image: resolveTcgdexImage(card.image) || card.image }))
  }

  try {
    if (typeof setName === 'string' && setName.trim()) {
      try {
        const cards = await fetchPokedataCardsBySet(setName.trim())
        res.status(200).json({ cards, source: 'live-pokedata' })
        return
      } catch (err) {
        console.warn('Pokedata set cards failed, using fallback sources:', err)
        const cards = fallbackCards
          .filter((card) => card.setName.toLowerCase() === setName.trim().toLowerCase())
          .map((card) => ({ ...card, image: resolveTcgdexImage(card.image) || card.image }))
        res.status(200).json({ cards, source: 'fallback' })
        return
      }
    }

    if (id) {
      try {
        const card = await fetchTcgdexJson(`https://api.tcgdex.net/v2/en/cards/${encodeURIComponent(id)}`)
        const marketById = await fetchPokemonTcgMarketByIds([card.id])

        res.status(200).json({ card: mapCard(card, marketById), source: 'live' })
      } catch (err) {
        try {
          const pokemonTcgCard = await fetchPokemonTcgCardById(id)
          if (pokemonTcgCard) {
            res.status(200).json({ card: pokemonTcgCard, source: 'live-pokemontcg' })
            return
          }
        } catch (pokemonTcgError) {
          console.warn('Live card fetch fallback to Pokémon TCG failed:', pokemonTcgError)
        }

        const fallbackCard = fallbackCards.find((card) => card.id === id)
        if (!fallbackCard) {
          res.status(404).json({ error: 'Card not found' })
          return
        }
        res.status(200).json({
          card: { ...fallbackCard, image: resolveTcgdexImage(fallbackCard.image) || fallbackCard.image },
          source: 'fallback',
        })
      }
      return
    }

    if (name) {
      const searchUrl = `https://api.tcgdex.net/v2/en/cards?name=${encodeURIComponent(name)}&pagination:itemsPerPage=15`
      try {
        const payload = await fetchTcgdexJson(searchUrl)
        const cardsFromTcgdex = Array.isArray(payload) ? payload : []
        const missingIds = cardsFromTcgdex.filter((card) => !hasAnyPrice(extractPriceSnapshot(card))).map((card) => card.id)
        const marketById = await fetchPokemonTcgMarketByIds(missingIds)
        const cards = cardsFromTcgdex.map((card) => mapCard(card, marketById))

        res.status(200).json({ cards, source: 'live' })
      } catch (err) {
        try {
          const pokemonTcgCards = await fetchPokemonTcgCardsByName(name)
          if (pokemonTcgCards.length) {
            res.status(200).json({ cards: pokemonTcgCards, source: 'live-pokemontcg' })
            return
          }
        } catch (pokemonTcgError) {
          console.warn('Live card search fallback to Pokémon TCG failed:', pokemonTcgError)
        }

        const cards = fallbackSearch(name)
        res.status(200).json({ cards, source: 'fallback' })
      }
      return
    }

    res.status(400).json({ error: 'Query parameter "name", "id", or "set_name" is required' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
}
