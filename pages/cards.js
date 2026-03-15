import { useState } from 'react'

/**
 * Detailed card search page. Allows users to query cards by name and
 * displays an extended set of information, including TCGplayer price
 * breakdowns. This duplicates some functionality from the home page but
 * illustrates how a dedicated page can evolve with more filters and data.
 */
export default function CardsPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function searchCards(e) {
    e.preventDefault()
    if (!query) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/cards?name=${encodeURIComponent(query)}`)
      if (!res.ok) throw new Error('Request failed')
      const data = await res.json()
      setResults(data.cards)
    } catch (err) {
      setError('Failed to fetch cards. Try again later.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1>Search Cards</h1>
      <p>Look up any Pokémon card by name and view its pricing data.</p>
      <form onSubmit={searchCards} style={{ marginTop: '1rem' }}>
        <input
          type="text"
          placeholder="Enter card name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ padding: '0.5rem', width: '60%' }}
        />
        <button
          type="submit"
          style={{ padding: '0.5rem 1rem', marginLeft: '0.5rem' }}
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {results.length > 0 && (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Set</th>
              <th>Low Price (USD)</th>
              <th>Market Price (USD)</th>
              <th>High Price (USD)</th>
            </tr>
          </thead>
          <tbody>
            {results.map((card) => (
              <tr key={card.id}>
                <td>{card.name}</td>
                <td>{card.setName}</td>
                <td>
                  {card.tcgplayer?.lowPrice != null
                    ? `$${card.tcgplayer.lowPrice.toFixed(2)}`
                    : 'N/A'}
                </td>
                <td>
                  {card.tcgplayer?.marketPrice != null
                    ? `$${card.tcgplayer.marketPrice.toFixed(2)}`
                    : 'N/A'}
                </td>
                <td>
                  {card.tcgplayer?.highPrice != null
                    ? `$${card.tcgplayer.highPrice.toFixed(2)}`
                    : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}