import Link from 'next/link'
import { useState } from 'react'

export default function Home() {
  const [query, setQuery] = useState('pikachu')
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
      setResults(data.cards || [])
    } catch (err) {
      setError('Failed to fetch cards. Try again later.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950 p-8 shadow-2xl shadow-cyan-900/20">
        <p className="mb-3 inline-flex rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-200">
          Pokémon card intelligence
        </p>
        <h1 className="text-3xl font-black text-white sm:text-5xl">Track prices, find cards, and scout demand.</h1>
        <p className="mt-4 max-w-3xl text-slate-300">
          A cleaner, image-first browsing experience inspired by modern TCG marketplaces. Search cards and inspect current
          market pricing in one place.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/cards" className="rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-900 hover:bg-cyan-300">
            Explore cards
          </Link>
          <Link href="/sets" className="rounded-lg border border-slate-700 px-4 py-2 font-semibold text-slate-200 hover:bg-slate-800">
            Browse sets
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-xl font-bold text-white">Quick card search</h2>
        <form onSubmit={searchCards} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            placeholder="Search a card (e.g. Charizard)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-slate-100 outline-none ring-cyan-300 placeholder:text-slate-500 focus:ring"
          />
          <button type="submit" className="rounded-lg bg-cyan-400 px-5 py-2.5 font-semibold text-slate-900 hover:bg-cyan-300">
            {loading ? 'Searching…' : 'Search'}
          </button>
        </form>
        {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}

        {results.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {results.map((card) => (
              <article key={card.id} className="group overflow-hidden rounded-xl border border-slate-800 bg-slate-950/90">
                <img
                  src={card.image}
                  alt={card.name}
                  className="aspect-[3/4] w-full object-cover transition duration-300 group-hover:scale-105"
                />
                <div className="space-y-1 p-3">
                  <h3 className="truncate text-sm font-semibold text-white">{card.name}</h3>
                  <p className="truncate text-xs text-slate-400">{card.setName}</p>
                  <p className="text-xs text-cyan-200">
                    {card.tcgplayer?.marketPrice != null ? `Market $${card.tcgplayer.marketPrice.toFixed(2)}` : 'Market N/A'}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
