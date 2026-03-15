import { useEffect, useMemo, useRef, useState } from 'react'

const PAGE_SIZE = 20

const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Name (A → Z)' },
  { value: 'name-desc', label: 'Name (Z → A)' },
  { value: 'cards-desc', label: 'Card count (high → low)' },
  { value: 'cards-asc', label: 'Card count (low → high)' },
]

const CARD_COUNT_FILTERS = [
  { value: 'all', label: 'All sets' },
  { value: '100', label: '100+ cards' },
  { value: '200', label: '200+ cards' },
]

export default function SetsPage() {
  const [sets, setSets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [source, setSource] = useState('live')
  const [sortBy, setSortBy] = useState('cards-desc')
  const [minCards, setMinCards] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const scrollContainerRef = useRef(null)
  const loadMoreTriggerRef = useRef(null)

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

  const filteredAndSortedSets = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    const minCardCount = minCards === 'all' ? 0 : Number(minCards)

    const filteredSets = sets.filter((set) => {
      const totalCards = set.cardCount?.total ?? 0
      const matchesCardCount = totalCards >= minCardCount
      const matchesSearch =
        !normalizedQuery ||
        set.name?.toLowerCase().includes(normalizedQuery) ||
        set.id?.toLowerCase().includes(normalizedQuery)

      return matchesCardCount && matchesSearch
    })

    return filteredSets.sort((leftSet, rightSet) => {
      const leftName = leftSet.name?.toLowerCase() || ''
      const rightName = rightSet.name?.toLowerCase() || ''
      const leftCount = leftSet.cardCount?.total ?? 0
      const rightCount = rightSet.cardCount?.total ?? 0

      if (sortBy === 'name-asc') return leftName.localeCompare(rightName)
      if (sortBy === 'name-desc') return rightName.localeCompare(leftName)
      if (sortBy === 'cards-asc') return leftCount - rightCount

      return rightCount - leftCount
    })
  }, [sets, searchQuery, minCards, sortBy])

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [searchQuery, minCards, sortBy])

  const visibleSets = useMemo(
    () => filteredAndSortedSets.slice(0, visibleCount),
    [filteredAndSortedSets, visibleCount]
  )

  const hasMoreRows = visibleCount < filteredAndSortedSets.length

  useEffect(() => {
    if (!hasMoreRows) return undefined

    const scrollRoot = scrollContainerRef.current
    const triggerNode = loadMoreTriggerRef.current

    if (!scrollRoot || !triggerNode) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry?.isIntersecting) {
          setVisibleCount((currentVisibleCount) => {
            if (currentVisibleCount >= filteredAndSortedSets.length) return currentVisibleCount
            return Math.min(currentVisibleCount + PAGE_SIZE, filteredAndSortedSets.length)
          })
        }
      },
      {
        root: scrollRoot,
        rootMargin: '120px 0px',
        threshold: 0.1,
      }
    )

    observer.observe(triggerNode)

    return () => observer.disconnect()
  }, [filteredAndSortedSets.length, hasMoreRows])

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
        <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="grid gap-3 md:grid-cols-3">
            <label className="space-y-1 text-sm text-slate-300">
              <span>Search by name or set ID</span>
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none ring-sky-400/50 placeholder:text-slate-500 focus:ring"
                placeholder="e.g. Scarlet & Violet"
              />
            </label>

            <label className="space-y-1 text-sm text-slate-300">
              <span>Minimum card count</span>
              <select
                value={minCards}
                onChange={(event) => setMinCards(event.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none ring-sky-400/50 focus:ring"
              >
                {CARD_COUNT_FILTERS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-sm text-slate-300">
              <span>Sort sets</span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none ring-sky-400/50 focus:ring"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="text-sm text-slate-400">
            Showing {visibleSets.length} of {filteredAndSortedSets.length} matching sets
          </div>

          <div
            ref={scrollContainerRef}
            className="max-h-[36rem] overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/40"
          >
            <table className="min-w-full divide-y divide-slate-800 text-sm">
              <thead className="sticky top-0 z-10 bg-slate-900/95 text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3">Set</th>
                  <th className="px-4 py-3">Set ID</th>
                  <th className="px-4 py-3">Total Cards</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {visibleSets.map((set) => (
                  <tr key={set.id} className="text-slate-200">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {set.symbol ? (
                          <img src={set.symbol} alt={`${set.name} symbol`} className="h-8 w-8 object-contain" />
                        ) : null}
                        <div>
                          <p className="font-medium text-white">{set.name}</p>
                          {set.logo ? (
                            <img src={set.logo} alt={`${set.name} logo`} className="mt-1 h-6 w-auto object-contain" />
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{set.id}</td>
                    <td className="px-4 py-3">{set.cardCount?.total ?? 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!visibleSets.length && (
              <p className="px-4 py-6 text-sm text-slate-400">No sets match your current filters.</p>
            )}

            {hasMoreRows && <div ref={loadMoreTriggerRef} className="h-10" aria-hidden="true" />}
          </div>
        </section>
      )}
    </div>
  )
}
