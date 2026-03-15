import { useEffect, useState } from 'react'

export default function CardsPage() {
  const [query, setQuery] = useState('charizard')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [source, setSource] = useState('live')

  async function runSearch(name) {
    if (!name) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/cards?name=${encodeURIComponent(name)}`)
      if (!res.ok) throw new Error('Request failed')
      const data = await res.json()
      setResults(data.cards || [])
      setSource(data.source || 'live')
    } catch (err) {
      setError('Failed to fetch cards. Try again later.')
      setSource('live')
    } finally {
      setLoading(false)
    }
  }

  function searchCards(e) {
    e.preventDefault()
    runSearch(query)
  }

  useEffect(() => {
    runSearch(query)
  }, [])

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <h1 className="text-3xl font-black text-white">Pokémon Card Explorer</h1>
        <p className="mt-2 text-slate-300">Image-forward card browsing with real-time marketplace pricing.</p>

        <form onSubmit={searchCards} className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            placeholder="Try: Mew, Gengar, Rayquaza..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2.5 text-slate-100 outline-none ring-cyan-300 placeholder:text-slate-500 focus:ring"
          />
          <button type="submit" className="rounded-lg bg-cyan-400 px-5 py-2.5 font-semibold text-slate-900 hover:bg-cyan-300">
            {loading ? 'Searching…' : 'Search Cards'}
          </button>
        </form>
        {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
        {source === 'fallback' && (
          <p className="mt-3 rounded-lg border border-amber-500/40 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
            Live API is unavailable. Showing fallback card data.
          </p>
        )}
      </section>

      {results.length > 0 ? (
        <section className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {results.map((card) => (
            <article
              key={card.id}
              className="group overflow-hidden rounded-xl border border-slate-800 bg-slate-900 transition hover:-translate-y-1 hover:border-cyan-400/40"
            >
              <img src={card.image} alt={card.name} className="aspect-[3/4] w-full object-cover transition duration-300 group-hover:scale-105" />
              <div className="space-y-1.5 p-3">
                <h2 className="truncate font-semibold text-white">{card.name}</h2>
                <p className="truncate text-sm text-slate-400">{card.setName}</p>
                <div className="rounded-lg bg-slate-800/80 p-2 text-xs text-slate-200">
                  <p>{card.tcgplayer?.lowPrice != null ? `Low: $${card.tcgplayer.lowPrice.toFixed(2)}` : 'Low: N/A'}</p>
                  <p>
                    {card.tcgplayer?.marketPrice != null
                      ? `Market: $${card.tcgplayer.marketPrice.toFixed(2)}`
                      : 'Market: N/A'}
                  </p>
                  <p>{card.tcgplayer?.highPrice != null ? `High: $${card.tcgplayer.highPrice.toFixed(2)}` : 'High: N/A'}</p>
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center text-slate-400">
          Start by searching for a card to load image-rich results.
        </section>
      )}
    </div>
  )
}
