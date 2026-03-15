import { useEffect, useState } from 'react'

export default function SetsPage() {
  const [sets, setSets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [source, setSource] = useState('live')

  useEffect(() => {
    async function loadSets() {
      try {
        const res = await fetch('/api/sets?quality=low')
        if (!res.ok) throw new Error('Request failed')
        const data = await res.json()
        setSets(data.sets || [])
        setSource(data.source || 'live')
      } catch (err) {
        setError('Failed to load sets. Try again later.')
        setSource('live')
      } finally {
        setLoading(false)
      }
    }
    loadSets()
  }, [])

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <h1 className="text-3xl font-black text-white">Pokémon TCG Sets</h1>
        <p className="mt-2 text-slate-300">Browse sets with logos and card totals.</p>
        {source === 'fallback' && (
          <p className="mt-3 rounded-lg border border-amber-500/40 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
            Live set API is unavailable. Showing fallback set data.
          </p>
        )}
      </section>

      {loading && <p className="text-slate-300">Loading sets…</p>}
      {error && <p className="text-rose-300">{error}</p>}

      {!loading && !error && (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sets.map((set) => (
            <article key={set.id} className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="flex h-14 items-center gap-3">
                {set.symbol ? <img src={set.symbol} alt={`${set.name} symbol`} className="h-10 w-auto object-contain" /> : null}
                {set.logo ? <img src={set.logo} alt={`${set.name} logo`} className="h-12 w-auto object-contain" /> : null}
              </div>
              <h2 className="mt-3 text-lg font-semibold text-white">{set.name}</h2>
              <p className="text-sm text-slate-400">Set ID: {set.id}</p>
              <p className="mt-2 inline-flex rounded-md bg-slate-800/80 px-2 py-1 text-sm text-slate-200">
                Total cards: {set.cardCount?.total ?? 'N/A'}
              </p>
            </article>
          ))}
        </section>
      )}
    </div>
  )
}
