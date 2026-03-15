import { useEffect, useState } from 'react'

/**
 * Page that lists all Pokémon TCG sets. In a future version, this page
 * could split the sets into past and upcoming releases by combining
 * information from TCGdex with news scraped from PokéBeach. For now it
 * displays the official set list and card counts.
 */
export default function SetsPage() {
  const [sets, setSets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadSets() {
      try {
        const res = await fetch('/api/sets')
        if (!res.ok) throw new Error('Request failed')
        const data = await res.json()
        setSets(data.sets)
      } catch (err) {
        setError('Failed to load sets. Try again later.')
      } finally {
        setLoading(false)
      }
    }
    loadSets()
  }, [])

  return (
    <div>
      <h1>Pokémon TCG Sets</h1>
      {loading && <p>Loading sets…</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && (
        <table className="table">
          <thead>
            <tr>
              <th>Set Name</th>
              <th>Set ID</th>
              <th>Total Cards</th>
            </tr>
          </thead>
          <tbody>
            {sets.map((set) => (
              <tr key={set.id}>
                <td>{set.name}</td>
                <td>{set.id}</td>
                <td>{set.cardCount.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
