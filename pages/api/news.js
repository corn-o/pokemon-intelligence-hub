/**
 * API route to fetch the latest Pokémon TCG news from PokéBeach. It uses
 * rss-parser to consume the site's RSS feed. Only basic fields are
 * returned to keep the response lightweight. Because the serverless
 * environment may block outbound requests during local development,
 * ensure the function handles errors gracefully.
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
    res.status(200).json({ items })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to load news feed' })
  }
}