const DEFAULT_ASSET_QUALITY = 'high'
const DEFAULT_ASSET_EXTENSION = 'webp'

export function normalizeTcgdexAssetUrl(url) {
  if (!url || typeof url !== 'string') return null

  const trimmedUrl = url.trim()
  if (!trimmedUrl) return null
  if (!trimmedUrl.includes('assets.tcgdex.net')) return trimmedUrl

  if (/\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(trimmedUrl)) {
    return trimmedUrl
  }

  const withoutTrailingSlash = trimmedUrl.replace(/\/$/, '')
  const hasQualitySegment = /\/(low|high)$/i.test(withoutTrailingSlash)
  const withQuality = hasQualitySegment
    ? withoutTrailingSlash
    : `${withoutTrailingSlash}/${DEFAULT_ASSET_QUALITY}`

  return `${withQuality}.${DEFAULT_ASSET_EXTENSION}`
}

export function resolveTcgdexImage(value) {
  if (typeof value === 'string') return normalizeTcgdexAssetUrl(value)
  if (value && typeof value.url === 'string') return normalizeTcgdexAssetUrl(value.url)
  return null
}
