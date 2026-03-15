import { useState } from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

// Register chart components once at module scope.
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

/**
 * Price dashboard page. Users can look up a single card by name and view
 * a bar chart comparing its low, market and high prices on TCGplayer. In
 * a full product this page could include price history over time and
 * comparisons across variants and marketplaces.
 */
export default function DashboardPage() {
  const [query, setQuery] = useState('')
  const [card, setCard] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function searchCard(e) {
    e.preventDefault()
    if (!query) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/cards?name=${encodeURIComponent(query)}`)
      if (!res.ok) throw new Error('Request failed')
      const data = await res.json()
      // pick the first match for simplicity
      setCard(data.cards[0] || null)
    } catch (err) {
      setError('Failed to fetch pricing. Try again later.')
      setCard(null)
    } finally {
      setLoading(false)
    }
  }

  // Build chart data when a card is selected
  const chartData = card
    ? {
        labels: ['Low', 'Market', 'High'],
        datasets: [
          {
            label: `${card.name} (USD)`,
            data: [
              card.tcgplayer?.lowPrice ?? 0,
              card.tcgplayer?.marketPrice ?? 0,
              card.tcgplayer?.highPrice ?? 0,
            ],
            backgroundColor: [
              'rgba(59, 130, 246, 0.5)',
              'rgba(16, 185, 129, 0.5)',
              'rgba(239, 68, 68, 0.5)',
            ],
            borderColor: [
              'rgba(59, 130, 246, 1)',
              'rgba(16, 185, 129, 1)',
              'rgba(239, 68, 68, 1)',
            ],
            borderWidth: 1,
          },
        ],
      }
    : null

  return (
    <div>
      <h1>Price Dashboard</h1>
      <p>
        Compare low, market and high pricing for any Pokémon card. Enter a
        card name below to get started.
      </p>
      <form onSubmit={searchCard} style={{ marginTop: '1rem' }}>
        <input
          type="text"
          placeholder="Card name (e.g. Charizard)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ padding: '0.5rem', width: '60%' }}
        />
        <button
          type="submit"
          style={{ padding: '0.5rem 1rem', marginLeft: '0.5rem' }}
        >
          {loading ? 'Loading…' : 'Lookup'}
        </button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {card && chartData && (
        <div className="chart-container">
          <Bar
            data={chartData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top',
                },
                title: {
                  display: true,
                  text: `Pricing for ${card.name}`,
                },
              },
            }}
          />
        </div>
      )}
    </div>
  )
}