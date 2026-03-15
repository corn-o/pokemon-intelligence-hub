import { useState } from 'react'

/**
 * Home page for the Pokémon Intelligence Hub MVP. This page includes a
 * simple search interface that queries the `/api/cards` endpoint by name
 * and displays matching cards with their current TCGplayer market price.
 * It also outlines the core value proposition of the app.
 */
export default function Home() {
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
      <h1>Pokémon Intelligence Hub</h1>
      <p>
        Unified data platform for Pokémon collectors and resellers. Track card
        prices, stay up to date on upcoming sets and news, and harness AI to
        forecast value spikes.
      </p>
      <form onSubmit={searchCards} style={{ marginTop: '1rem' }}>
        <input
          type="text"
          placeholder="Search for a card (e.g. Charizard)"
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
        <div className="card-list">
          {results.map((card) => (
            <div key={card.id} className="card-item">
              {card.image ? (
                <img src={card.image} alt={card.name} />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '150px',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '4px',
                  }}
                />
              )}
              <h3>{card.name}</h3>
              <p style={{ margin: '0.25rem 0' }}>Set: {card.setName}</p>
              {card.tcgplayer && card.tcgplayer.marketPrice ? (
                <p>Market Price: ${card.tcgplayer.marketPrice.toFixed(2)}</p>
              ) : (
                <p>Market Price: N/A</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}