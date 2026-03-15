import { getBoosterHistoryBySetName } from '../../data/boosterPriceHistory'

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

function getCardMarketPrice(card) {
  const tcg = card?.tcgplayer?.prices
  if (!tcg) return null

  const variants = [
    tcg.normal,
    tcg.holofoil,
    tcg['reverseHolofoil'],
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
    const setSearchRes = await fetch(
      `https://api.pokemontcg.io/v2/sets?q=name:${encodeURIComponent(`"${setName}"`)}`
    )

    if (!setSearchRes.ok) {
      res
        .status(setSearchRes.status)
        .json({ error: 'Failed to fetch set metadata from pricing provider' })
      return
    }

    const setSearchData = await setSearchRes.json()
    const matchedSet = setSearchData?.data?.[0]

    if (!matchedSet) {
      res.status(404).json({ error: 'No matching set found for this name' })
      return
    }

    const cardsRes = await fetch(
      `https://api.pokemontcg.io/v2/cards?q=set.id:${matchedSet.id}&pageSize=250`
    )

    if (!cardsRes.ok) {
      res
        .status(cardsRes.status)
        .json({ error: 'Failed to fetch card pricing from pricing provider' })
      return
    }

    const cardsData = await cardsRes.json()
    const cards = cardsData?.data || []

    const rareSlotCards = cards.filter(looksLikeRareSlotCard)
    const rareSlotPrices = rareSlotCards
      .map(getCardMarketPrice)
      .filter((price) => typeof price === 'number')

    const rareSlotAverage = rareSlotPrices.length
      ? rareSlotPrices.reduce((sum, value) => sum + value, 0) / rareSlotPrices.length
      : 0

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
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
}
