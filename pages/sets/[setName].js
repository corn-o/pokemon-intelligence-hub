import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'

function formatPrice(value) {
  return typeof value === 'number' && Number.isFinite(value) ? `$${value.toFixed(2)}` : 'N/A'
}

export default function SetDetailPage() {
  const router = useRouter()
  const setName = useMemo(() => {
    const rawSetName = router.query?.setName
    if (Array.isArray(rawSetName)) return rawSetName[0] || ''
    return rawSetName || ''
  }, [router.query?.setName])

  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [source, setSource] = useState('live')

  useEffect(() => {
    if (!router.isReady || !setName) return

    let canceled = false

    async function loadCards() {
      setLoading(true)
      setError('')

      try {
        const response = await fetch(`/api/cards?set_name=${encodeURIComponent(setName)}`)
        if (!response.ok) throw new Error('Request failed')

        const payload = await response.json()
        if (!canceled) {
          setCards(Array.isArray(payload.cards) ? payload.cards : [])
          setSource(payload.source || 'live')
        }
      } catch (requestError) {
        if (!canceled) {
          setError('Failed to load cards for this set. Please try again later.')
          setSource('live')
        }
      } finally {
        if (!canceled) setLoading(false)
      }
    }

    loadCards()

    return () => {
      canceled = true
    }
  }, [router.isReady, setName])

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <Link href="/sets" className="text-sm text-cyan-300 hover:text-cyan-200">
          ← Back to all sets
        </Link>
        <h1 className="mt-3 text-3xl font-black text-white">{decodeURIComponent(setName || '')}</h1>
        <p className="mt-2 text-slate-300">Cards, pricing, and details for this set.</p>
        {source === 'fallback' && (
          <p className="mt-3 rounded-lg border border-amber-500/40 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
            Live pricing feed is unavailable. Showing fallback card data.
          </p>
        )}
      </section>

      {loading && <p className="text-slate-300">Loading cards…</p>}
      {error && <p className="text-rose-300">{error}</p>}

      {!loading && !error && (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="mb-4 text-sm text-slate-400">Found {cards.length} cards</p>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => (
              <article key={card.id} className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
                {card.image ? <img src={card.image} alt={card.name} className="aspect-[3/4] w-full object-cover" /> : null}
                <div className="space-y-2 p-3">
                  <h2 className="line-clamp-1 font-semibold text-white">{card.name}</h2>
                  <p className="text-xs text-slate-400">#{card.details?.number || 'N/A'} • {card.details?.rarity || 'Unknown rarity'}</p>

                  <div className="rounded-lg bg-slate-800/80 p-2 text-xs text-slate-200">
                    <p>Low: {formatPrice(card.tcgplayer?.lowPrice)}</p>
                    <p>Market: {formatPrice(card.tcgplayer?.marketPrice)}</p>
                    <p>High: {formatPrice(card.tcgplayer?.highPrice)}</p>
                  </div>

                  <p className="text-xs text-slate-400">Artist: {card.details?.artist || 'N/A'}</p>
                  {Array.isArray(card.details?.types) && card.details.types.length ? (
                    <p className="text-xs text-slate-400">Types: {card.details.types.join(', ')}</p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>

          {!cards.length && <p className="p-3 text-sm text-slate-400">No cards found for this set.</p>}
        </section>
      )}
    </div>
  )
}
