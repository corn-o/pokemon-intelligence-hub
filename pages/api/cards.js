/**
 * API route for fetching card information. Supports searching by name or
 * retrieving a specific card by ID. Uses the TCGdex API to fetch card
 * listings and pricing data from Cardmarket and TCGplayer. Cardmarket
 * prices are ignored in this MVP; only TCGplayer prices are returned.
 */

export default async function handler(req, res) {
  const { name, id } = req.query

  // Helper to fetch detailed card info by ID
  async function fetchCardDetails(cardId) {
    const url = `https://api.tcgdex.net/v2/en/cards/${cardId}`
    const response = await fetch(url)
    if (!response.ok) throw new Error('Card details request failed')
    const data = await response.json()
    return data
  }

  try {
    if (id) {
      // Return a single card detail
      const card = await fetchCardDetails(id)
      res.status(200).json({ card })
      return
    }
    if (name) {
      // Search for cards by name using TCGdex filtering
      const searchUrl = `https://api.tcgdex.net/v2/en/cards?name=${encodeURIComponent(
        name
      )}`
      const searchRes = await fetch(searchUrl)
      if (!searchRes.ok) {
        res.status(searchRes.status).json({ error: 'Search request failed' })
        return
      }
      const searchData = await searchRes.json()
      // Limit number of results to avoid heavy API usage
      const firstTen = searchData.slice(0, 10)
      const cards = await Promise.all(
        firstTen.map(async (brief) => {
          try {
            const full = await fetchCardDetails(brief.id)
            // Extract TCGplayer pricing for normal variant if available
            const tcgplayer = full.pricing?.tcgplayer || null
            let lowPrice = null
            let marketPrice = null
            let highPrice = null
            if (tcgplayer) {
              // Some cards may have multiple variants (normal, reverse holofoil, etc.)
              const normal = tcgplayer.normal || tcgplayer['holofoil'] || tcgplayer['reverse-holofoil'] || null
              if (normal) {
                lowPrice = normal.lowPrice ?? null
                marketPrice = normal.marketPrice ?? null
                highPrice = normal.highPrice ?? null
              }
            }
            return {
              id: full.id,
              name: full.name,
              image: full.image,
              setName: full.set?.name || 'Unknown',
              tcgplayer: {
                lowPrice,
                marketPrice,
                highPrice,
              },
            }
          } catch (err) {
            return null
          }
        })
      )
      // Filter out null results
      const filtered = cards.filter(Boolean)
      res.status(200).json({ cards: filtered })
      return
    }
    res.status(400).json({ error: 'Query parameter "name" or "id" is required' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
}