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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function DashboardPage() {
  const [query, setQuery] = useState('charizard')
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
      setCard(data.cards?.[0] || null)
    } catch (err) {
      setError('Failed to fetch pricing. Try again later.')
      setCard(null)
    } finally {
      setLoading(false)
    }
  }

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
            backgroundColor: ['rgba(59, 130, 246, 0.5)', 'rgba(16, 185, 129, 0.5)', 'rgba(239, 68, 68, 0.5)'],
            borderColor: ['rgba(59, 130, 246, 1)', 'rgba(16, 185, 129, 1)', 'rgba(239, 68, 68, 1)'],
            borderWidth: 1,
          },
        ],
      }
    : null

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <h1 className="text-3xl font-black text-white">Price Dashboard</h1>
        <p className="mt-2 text-slate-300">Compare low, market, and high pricing for any Pokémon card.</p>

        <form onSubmit={searchCard} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            placeholder="Card name (e.g. Charizard)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2.5 text-slate-100 outline-none ring-cyan-300 placeholder:text-slate-400 focus:ring"
          />
          <button type="submit" className="rounded-lg bg-cyan-400 px-5 py-2.5 font-semibold text-slate-900 hover:bg-cyan-300">
            {loading ? 'Loading…' : 'Lookup'}
          </button>
        </form>

        {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
      </section>

      {card && chartData && (
        <section className="grid gap-4 lg:grid-cols-[240px_1fr]">
          <article className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80">
            <img src={card.image} alt={card.name} className="aspect-[3/4] w-full object-cover" />
            <div className="p-3">
              <h2 className="font-semibold text-white">{card.name}</h2>
              <p className="text-sm text-slate-400">{card.setName}</p>
            </div>
          </article>
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
            <Bar
              data={chartData}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: 'top' },
                  title: { display: true, text: `Pricing for ${card.name}` },
                },
              }}
            />
          </div>
        </section>
      )}
    </div>
  )
}
