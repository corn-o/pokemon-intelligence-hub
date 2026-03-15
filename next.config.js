/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'assets.tcgdex.net',
      'images.pokemontcg.io',
      'placekitten.com'
    ],
  },
  // When deploying to Netlify the basePath may need to be configured.
};

module.exports = nextConfig;