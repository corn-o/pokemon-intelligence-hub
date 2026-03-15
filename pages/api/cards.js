import { fallbackCards } from '../../data/fallbackData'
import { resolveTcgdexImage } from '../../utils/tcgdexAssets'

/**
 * API route for Pokémon card information.
 * Uses TCGdex card + markets data to avoid the historical instability we saw
 * with previous providers.
 */

function extractPriceSnapshot(card = {}) {
  const marketSources = [
    card.tcgplayer,
    card.cardmarket,
    card.pricing,
    card.market,
    card.prices,
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

function mapCard(card) {
  const setName = card.set?.name || card.set?.id || 'Unknown'
  const rawImage = card.image || card.imageUrl || card.images?.large || card.images?.small || ''

  return {
    id: card.id,
    name: card.name,
    image: resolveTcgdexImage(rawImage) || rawImage,
    setName,
    tcgplayer: extractPriceSnapshot(card),
  }
}

async function fetchTcgdexJson(url) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`TCGdex request failed: ${response.status}`)
  }
  return response.json()
}

export default async function handler(req, res) {
  const { name, id } = req.query

  function fallbackSearch(queryName = '') {
    const q = queryName.toLowerCase()
    return fallbackCards
      .filter((card) => card.name.toLowerCase().includes(q))
      .map((card) => ({ ...card, image: resolveTcgdexImage(card.image) || card.image }))
  }

  try {
    if (id) {
      try {
        const card = await fetchTcgdexJson(`https://api.tcgdex.net/v2/en/cards/${encodeURIComponent(id)}`)
        res.status(200).json({ card: mapCard(card), source: 'live' })
      } catch (err) {
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
        const cards = (Array.isArray(payload) ? payload : []).map(mapCard)
        res.status(200).json({ cards, source: 'live' })
      } catch (err) {
        const cards = fallbackSearch(name)
        res.status(200).json({ cards, source: 'fallback' })
      }
      return
    }

    res.status(400).json({ error: 'Query parameter "name" or "id" is required' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
}
