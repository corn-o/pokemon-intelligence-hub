import { fallbackSets } from '../../data/fallbackData'
import { resolveTcgdexImage } from '../../utils/tcgdexAssets'

function resolveSetSymbol(set) {
  return resolveTcgdexImage(set.logo) || resolveTcgdexImage(set.symbol)
}

/**
 * API route to return a list of Pokémon TCG sets.
 */
export default async function handler(req, res) {
  try {
    const response = await fetch('https://api.tcgdex.net/v2/en/sets')
    if (!response.ok) throw new Error('Failed to fetch sets')

    const data = await response.json()
    const sets = data
      .filter((set) => set.name && set.cardCount)
      .map((set) => ({
        id: set.id,
        name: set.name,
        cardCount: set.cardCount,
        symbol: resolveSetSymbol(set),
      }))

    res.status(200).json({ sets, source: 'live' })
  } catch (err) {
    console.error(err)
    res.status(200).json({ sets: fallbackSets, source: 'fallback' })
  }
}
