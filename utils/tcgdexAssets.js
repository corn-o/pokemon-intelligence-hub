const DEFAULT_CARD_QUALITY = 'high'
const DEFAULT_ASSET_EXTENSION = 'webp'

function isTcgdexAssetUrl(url = '') {
  return typeof url === 'string' && url.includes('assets.tcgdex.net')
}

function hasFileExtension(url = '') {
  return /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(url)
}

function withDefaultExtension(url = '') {
  if (!url || hasFileExtension(url)) return url
  return `${url}.${DEFAULT_ASSET_EXTENSION}`
}

export function resolveTcgdexCardImageUrl(url) {
  return resolveTcgdexCardImageWithQuality(url)
}

export function resolveTcgdexCardImageWithQuality(url, quality = DEFAULT_CARD_QUALITY) {
  if (!isTcgdexAssetUrl(url)) return url

  const trimmedUrl = url.trim().replace(/\/$/, '')
  if (!trimmedUrl) return null
  if (hasFileExtension(trimmedUrl)) return trimmedUrl

  const normalizedQuality = quality === 'low' ? 'low' : 'high'
  const withQuality = trimmedUrl.replace(/\/(low|high)$/i, '')
  const qualifiedUrl = `${withQuality}/${normalizedQuality}`

  return withDefaultExtension(qualifiedUrl)
}

export function resolveTcgdexSetAssetUrl(url) {
  if (!isTcgdexAssetUrl(url)) return url

  const trimmedUrl = url.trim().replace(/\/$/, '')
  if (!trimmedUrl) return null

  return withDefaultExtension(trimmedUrl)
}

export function normalizeTcgdexAssetUrl(url) {
  if (!url || typeof url !== 'string') return null

  const trimmedUrl = url.trim()
  if (!trimmedUrl) return null
  if (!isTcgdexAssetUrl(trimmedUrl)) return trimmedUrl

  if (/\/(logo|symbol)$/i.test(trimmedUrl)) {
    return resolveTcgdexSetAssetUrl(trimmedUrl)
  }

  return resolveTcgdexCardImageUrl(trimmedUrl)
}

export function resolveTcgdexImage(value) {
  if (typeof value === 'string') return normalizeTcgdexAssetUrl(value)
  if (value && typeof value.url === 'string') return normalizeTcgdexAssetUrl(value.url)
  return null
}
