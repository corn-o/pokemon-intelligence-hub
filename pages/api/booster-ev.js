import { getBoosterHistoryBySetName } from '../../data/boosterPriceHistory'
import { fallbackSets } from '../../data/fallbackData'

const RARE_RARITY_MATCHERS = [
  /rare/i,
  /holo/i,
  /ultra/i,
  /ace spec/i,
  /illustration/i,
  /hyper/i,
  /secret/i,
  /double rare/i,
]

function normalizeName(name = '') {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function scoreSetNameMatch(candidateName = '', query = '') {
  const candidate = normalizeName(candidateName)
  const target = normalizeName(query)

  if (!candidate || !target) return 0
  if (candidate === target) return 100
  if (candidate.includes(target)) return 75
  if (target.includes(candidate)) return 50

  let overlap = 0
  for (const char of target) {
    if (candidate.includes(char)) overlap += 1
  }
  return overlap / target.length
}

async function findSetByName(setName) {
  const exactRes = await fetch(
    `https://api.pokemontcg.io/v2/sets?q=name:${encodeURIComponent(`"${setName}"`)}`
  )

  if (exactRes.ok) {
    const exactData = await exactRes.json()
    if (exactData?.data?.length) {
      return exactData.data[0]
    }
  }

  const broadRes = await fetch('https://api.pokemontcg.io/v2/sets?pageSize=250')
  if (!broadRes.ok) {
    throw new Error('Failed to fetch set metadata from pricing provider')
  }

  const broadData = await broadRes.json()
  const sets = broadData?.data || []

  const best = sets
    .map((set) => ({ set, score: scoreSetNameMatch(set?.name, setName) }))
    .sort((a, b) => b.score - a.score)[0]

  if (!best || best.score < 0.7) return null
  return best.set
}

function getCardMarketPrice(card) {
  const tcg = card?.tcgplayer?.prices
  if (!tcg) return null

  const variants = [
    tcg.normal,
    tcg.holofoil,
    tcg.reverseHolofoil,
    tcg['1stEditionHolofoil'],
    tcg['1stEditionNormal'],
  ].filter(Boolean)

  for (const variant of variants) {
    if (typeof variant.market === 'number') {
      return variant.market
    }
  }

  return null
}

function looksLikeRareSlotCard(card) {
  const rarity = card?.rarity || ''
  return RARE_RARITY_MATCHERS.some((matcher) => matcher.test(rarity))
}

export default async function handler(req, res) {
  const { set: setName, boosterBoxPrice } = req.query

  if (!setName) {
    res.status(400).json({ error: 'Query parameter "set" is required' })
    return
  }

  const userBoosterBoxPrice = Number(boosterBoxPrice)

  try {
    const matchedSet = await findSetByName(setName)

    if (!matchedSet) {
      res.status(404).json({ error: `No set found matching "${setName}"` })
      return
    }

    const cardsRes = await fetch(
      `https://api.pokemontcg.io/v2/cards?q=set.id:${matchedSet.id}&pageSize=250`
    )

    if (!cardsRes.ok) {
      throw new Error('Failed to fetch card pricing from pricing provider')
    }

    const cardsData = await cardsRes.json()
    const cards = cardsData?.data || []

    const rareSlotCards = cards.filter(looksLikeRareSlotCard)
    const rareSlotPrices = rareSlotCards
      .map(getCardMarketPrice)
      .filter((price) => typeof price === 'number')

    if (!rareSlotPrices.length) {
      res.status(422).json({
        error:
          'No eligible rare-slot market prices were found for this set. Try another set or provide a known modern set name.',
      })
      return
    }

    const rareSlotAverage =
      rareSlotPrices.reduce((sum, value) => sum + value, 0) / rareSlotPrices.length

    const expectedValueOfPulls = rareSlotAverage * 36

    const fallbackBoxPrice = matchedSet?.tcgplayer?.prices?.normal?.market
    const boosterPrice = Number.isFinite(userBoosterBoxPrice)
      ? userBoosterBoxPrice
      : Number.isFinite(fallbackBoxPrice)
      ? fallbackBoxPrice
      : null

    const ev = boosterPrice != null ? expectedValueOfPulls - boosterPrice : null

    const history = getBoosterHistoryBySetName(matchedSet.name)

    res.status(200).json({
      set: {
        id: matchedSet.id,
        name: matchedSet.name,
        releaseDate: matchedSet.releaseDate,
      },
      model: {
        description:
          'EV uses a simplified model: one rare-slot pull per pack over 36 packs, weighted by current market prices for rare/holo/ultra-rare cards.',
        rareCardsCount: rareSlotPrices.length,
      },
      pricing: {
        boosterBoxPrice: boosterPrice,
        expectedValueOfPulls,
        ev,
      },
      history,
      source: 'live',
    })
  } catch (err) {
    console.error(err)

    const matchedFallbackSet =
      fallbackSets.find((set) => normalizeName(set.name) === normalizeName(setName)) ||
      fallbackSets.find((set) => normalizeName(set.name).includes(normalizeName(setName))) ||
      fallbackSets[0]

    const baseExpectedValue = 115
    const boosterPrice = Number.isFinite(userBoosterBoxPrice) ? userBoosterBoxPrice : 140
    const expectedValueOfPulls = baseExpectedValue
    const ev = expectedValueOfPulls - boosterPrice
    const history = getBoosterHistoryBySetName(matchedFallbackSet.name)

    res.status(200).json({
      set: {
        id: matchedFallbackSet.id,
        name: matchedFallbackSet.name,
        releaseDate: 'Fallback estimate',
      },
      model: {
        description:
          'Fallback EV estimate is shown because live pricing providers are unavailable in this environment.',
        rareCardsCount: 0,
      },
      pricing: {
        boosterBoxPrice: boosterPrice,
        expectedValueOfPulls,
        ev,
      },
      history,
      source: 'fallback',
    })
  }
}
