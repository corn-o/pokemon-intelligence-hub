export const fallbackCards = [
  {
    id: 'base1-4',
    name: 'Charizard',
    image: 'https://images.pokemontcg.io/base1/4_hires.png',
    setName: 'Base',
    tcgplayer: { lowPrice: 180, marketPrice: 245.5, highPrice: 399.99 },
  },
  {
    id: 'sv4pt5-160',
    name: 'Pikachu',
    image: 'https://images.pokemontcg.io/sv4pt5/160_hires.png',
    setName: 'Paldean Fates',
    tcgplayer: { lowPrice: 11.25, marketPrice: 15.8, highPrice: 26.49 },
  },
  {
    id: 'swsh12pt5-gg45',
    name: 'Mewtwo VSTAR',
    image: 'https://images.pokemontcg.io/swsh12pt5gg/GG45_hires.png',
    setName: 'Crown Zenith',
    tcgplayer: { lowPrice: 45.2, marketPrice: 51.35, highPrice: 82.0 },
  },
  {
    id: 'sv3-215',
    name: 'Gengar',
    image: 'https://images.pokemontcg.io/sv3/215_hires.png',
    setName: 'Obsidian Flames',
    tcgplayer: { lowPrice: 14.9, marketPrice: 19.1, highPrice: 30.0 },
  },
]

export const fallbackSets = [
  { id: 'sv8', name: 'Surging Sparks', cardCount: { total: 191 }, symbol: 'https://images.pokemontcg.io/sv8/symbol.png' },
  { id: 'sv7', name: 'Stellar Crown', cardCount: { total: 175 }, symbol: 'https://images.pokemontcg.io/sv7/symbol.png' },
  { id: 'sv6', name: 'Twilight Masquerade', cardCount: { total: 167 }, symbol: 'https://images.pokemontcg.io/sv6/symbol.png' },
  { id: 'sv4pt5', name: 'Paldean Fates', cardCount: { total: 245 }, symbol: 'https://images.pokemontcg.io/sv4pt5/symbol.png' },
]

export const fallbackNews = [
  {
    title: 'Fallback: Pokémon TCG market feed temporarily unavailable',
    link: 'https://www.pokemon.com/us/pokemon-tcg',
    pubDate: new Date().toISOString(),
    snippet: 'Live news feed is unavailable right now. Showing built-in updates so the app remains usable.',
  },
]
