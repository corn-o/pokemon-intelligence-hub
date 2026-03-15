import { fallbackCards } from '../../data/fallbackData'

/**
 * API route for Pokémon card information.
 * Uses the public Pokémon TCG API for image-rich card results and TCGplayer
 * style pricing fields (low/market/high) when available.
 */

export default async function handler(req, res) {
  const { name, id } = req.query

  function fallbackSearch(queryName = '') {
    const q = queryName.toLowerCase()
    return fallbackCards.filter((card) => card.name.toLowerCase().includes(q))
  }

  async function fetchCard(cardId) {
    const response = await fetch(`https://api.pokemontcg.io/v2/cards/${cardId}`)
    if (!response.ok) throw new Error('Card details request failed')
    const payload = await response.json()
    return payload.data
  }

  function mapCard(card) {
    const prices = card.tcgplayer?.prices || {}
    const preferred =
      prices.holofoil || prices.normal || prices.reverseHolofoil || prices['1stEditionHolofoil'] || null

    return {
      id: card.id,
      name: card.name,
      image: card.images?.large || card.images?.small || '',
      setName: card.set?.name || 'Unknown',
      tcgplayer: {
        lowPrice: preferred?.low ?? null,
        marketPrice: preferred?.market ?? null,
        highPrice: preferred?.high ?? null,
      },
    }
  }

  try {
    if (id) {
      try {
        const card = await fetchCard(id)
        res.status(200).json({ card: mapCard(card), source: 'live' })
      } catch (err) {
        const fallbackCard = fallbackCards.find((card) => card.id === id)
        if (!fallbackCard) {
          res.status(404).json({ error: 'Card not found' })
          return
        }
        res.status(200).json({ card: fallbackCard, source: 'fallback' })
      }
      return
    }

    if (name) {
      const q = `name:*${name.replace(/"/g, '')}*`
      const searchUrl = `https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(q)}&pageSize=15&orderBy=-set.releaseDate`
      try {
        const searchRes = await fetch(searchUrl)
        if (!searchRes.ok) {
          res.status(searchRes.status).json({ error: 'Search request failed' })
          return
        }

        const payload = await searchRes.json()
        const cards = (payload.data || []).map(mapCard)
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
