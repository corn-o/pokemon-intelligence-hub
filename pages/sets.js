import { useEffect, useMemo, useState } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

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

  const [setQuery, setSetQuery] = useState('Surging Sparks')
  const [boosterBoxPrice, setBoosterBoxPrice] = useState('140')
  const [evLoading, setEvLoading] = useState(false)
  const [evError, setEvError] = useState('')
  const [evData, setEvData] = useState(null)

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

  async function calculateBoosterEV(e) {
    e.preventDefault()
    if (!setQuery) return

    setEvLoading(true)
    setEvError('')
    setEvData(null)

    try {
      const params = new URLSearchParams({
        set: setQuery,
        boosterBoxPrice,
      })
      const res = await fetch(`/api/booster-ev?${params.toString()}`)
      if (!res.ok) throw new Error('Request failed')
      const data = await res.json()
      setEvData(data)
    } catch (err) {
      setEvError('Failed to calculate EV. Try another set or try again later.')
    } finally {
      setEvLoading(false)
    }
  }

  const historyChartData = useMemo(() => {
    if (!evData?.history?.length) return null

    return {
      labels: evData.history.map((point) => point.date),
      datasets: [
        {
          label: `${evData.set.name} booster box market price`,
          data: evData.history.map((point) => point.price),
          borderColor: 'rgba(79, 70, 229, 1)',
          backgroundColor: 'rgba(79, 70, 229, 0.2)',
          fill: true,
          tension: 0.25,
        },
      ],
    }
  }, [evData])

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

      <section style={{ marginTop: '2rem' }}>
        <h2>📦 Booster EV Calculator</h2>
        <p>
          Estimate expected value from a booster box and review market pricing
          from release to today.
        </p>

        <form onSubmit={calculateBoosterEV} style={{ display: 'grid', gap: '0.75rem', maxWidth: '560px' }}>
          <label>
            Set
            <input
              type="text"
              value={setQuery}
              onChange={(event) => setSetQuery(event.target.value)}
              placeholder="e.g. Surging Sparks"
              style={{ display: 'block', width: '100%', marginTop: '0.25rem', padding: '0.5rem' }}
            />
          </label>
          <label>
            Booster box price (USD)
            <input
              type="number"
              min="0"
              step="0.01"
              value={boosterBoxPrice}
              onChange={(event) => setBoosterBoxPrice(event.target.value)}
              style={{ display: 'block', width: '100%', marginTop: '0.25rem', padding: '0.5rem' }}
            />
          </label>
          <button type="submit" style={{ width: 'fit-content', padding: '0.5rem 1rem' }}>
            {evLoading ? 'Calculating…' : 'Calculate EV'}
          </button>
        </form>

        {evError && <p style={{ color: 'red' }}>{evError}</p>}

        {evData && (
          <div className="card-item" style={{ textAlign: 'left', marginTop: '1rem' }}>
            <p>
              <strong>Set:</strong> {evData.set.name}
            </p>
            <p>
              <strong>Release date:</strong> {evData.set.releaseDate || 'Unknown'}
            </p>
            <p>
              <strong>Booster box price:</strong>{' '}
              {evData.pricing.boosterBoxPrice != null
                ? `$${evData.pricing.boosterBoxPrice.toFixed(2)}`
                : 'N/A'}
            </p>
            <p>
              <strong>Expected value of pulls:</strong>{' '}
              ${evData.pricing.expectedValueOfPulls.toFixed(2)}
            </p>
            <p>
              <strong>EV:</strong>{' '}
              {evData.pricing.ev != null
                ? `${evData.pricing.ev >= 0 ? '+' : '-'}$${Math.abs(evData.pricing.ev).toFixed(2)}`
                : 'N/A'}
            </p>
            <p style={{ marginBottom: 0 }}>
              <small>{evData.model.description}</small>
            </p>
          </div>
        )}

        {historyChartData && (
          <div className="chart-container" style={{ maxWidth: '760px' }}>
            <Line
              data={historyChartData}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: 'top' },
                  title: {
                    display: true,
                    text: 'Booster box market trend from release to now',
                  },
                },
                scales: {
                  y: {
                    ticks: {
                      callback: (value) => `$${value}`,
                    },
                  },
                },
              }}
            />
          </div>
        )}
      </section>
    </div>
  )
}
