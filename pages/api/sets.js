/**
 * API route to return a list of Pokémon TCG sets. This wrapper around
 * the TCGdex REST API is used because Netlify functions allow server-side
 * calls to third-party APIs without exposing keys or CORS issues. In
 * this MVP only the set ID, name and card counts are returned.
 */

export default async function handler(req, res) {
  try {
    const response = await fetch('https://api.tcgdex.net/v2/en/sets')
    if (!response.ok) {
      res.status(response.status).json({ error: 'Failed to fetch sets' })
      return
    }
    const data = await response.json()
    // Ensure we return only sets with a name and card count
    const sets = data
      .filter((set) => set.name && set.cardCount)
      .map((set) => ({
        id: set.id,
        name: set.name,
        cardCount: set.cardCount,
      }))
    res.status(200).json({ sets })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
}