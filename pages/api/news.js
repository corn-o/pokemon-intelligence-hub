import { fallbackNews } from '../../data/fallbackData'

/**
 * API route to fetch the latest Pokémon TCG news from PokéBeach.
 */
export default async function handler(req, res) {
  try {
    const Parser = (await import('rss-parser')).default
    const parser = new Parser()
    const feed = await parser.parseURL('https://www.pokebeach.com/feed')
    const items = feed.items.map((item) => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      snippet: item.contentSnippet || item.content || '',
    }))
    res.status(200).json({ items, source: 'live' })
  } catch (err) {
    console.error(err)
    res.status(200).json({ items: fallbackNews, source: 'fallback' })
  }
}
