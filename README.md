# Pokémon Intelligence Hub MVP

This repository contains a minimal **Next.js** prototype for a Pokémon trading card data platform. The goal of this MVP is to unify pricing information, set lists and news into a single, fast web experience suitable for deployment on **Netlify**.

## Key Features

- **Card search:** Enter a card name and retrieve basic details along with up‑to‑date pricing data sourced from the [TCGdex API](https://tcgdex.dev/markets-prices) which aggregates TCGplayer (USD) and Cardmarket (EUR) prices.
- **Set list + booster EV calculator:** Browse all official Pokémon TCG sets and use the dedicated **Booster EV** tab to run a set EV model. The calculator estimates rare-slot pull EV, compares it with a box buy-in, and includes available release-to-now booster price snapshots.
- **Price dashboard:** Visualise the low, market and high prices for a single card using a bar chart. This page demonstrates how simple analytics can be integrated; you can extend it to historical time‑series charts.
- **News feed:** A serverless API function fetches the latest headlines from PokéBeach’s RSS feed. The front‑end currently doesn’t consume this endpoint, but it’s available for future integration.

## Getting Started

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Run the development server:**

   ```bash
   npm run dev
   ```

   Navigate to `http://localhost:3000` in your browser. The page will automatically reload as you edit files.

3. **Build for production:**

   ```bash
   npm run build && npm start
   ```

## Data Sources & Considerations

This prototype relies on the **TCGdex** API because it embeds both TCGplayer (USD) and Cardmarket (EUR) pricing directly in card responses and does not require authentication. If you choose to integrate additional marketplaces (e.g. eBay sold data or official TCGplayer APIs), ensure you comply with each platform’s terms of service and usage limits.

For news about upcoming releases, this project uses PokéBeach’s RSS feed. Always respect website terms of service when scraping or consuming content. If PokéBeach publishes an official API or you establish a partnership, swap out the RSS logic accordingly.

## Extending the MVP

The current codebase is intentionally lightweight. Here are some ideas for future development:

- **User accounts:** Allow collectors and resellers to log in, save watch lists and track purchase histories.
- **Historical pricing charts:** Fetch and display price trends over time using the Cardmarket and TCGplayer historical endpoints, if available.

- **Richer historical data:** Replace the seeded booster-box snapshots with a dedicated historical feed (e.g. eBay sold listings API, TCGplayer authenticated data, or a warehoused price time-series).
- **Upcoming set forecasts:** Parse news articles to identify rumoured card lists and use basic machine‑learning models to predict which existing cards might spike in value when new sets drop.
- **Marketplace links:** Provide affiliate or direct purchase links to reputable sellers based on region and stock levels.

Feel free to iterate on this scaffold to build a polished product that serves the Pokémon collecting community.