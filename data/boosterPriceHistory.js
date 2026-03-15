export const boosterPriceHistory = {
  'surging sparks': [
    { date: '2024-11-08', source: 'TCGPlayer market snapshot', price: 161.42 },
    { date: '2024-12-15', source: 'TCGPlayer market snapshot', price: 154.8 },
    { date: '2025-01-20', source: 'TCGPlayer market snapshot', price: 149.15 },
    { date: '2025-03-01', source: 'TCGPlayer market snapshot', price: 145.3 },
    { date: '2025-06-01', source: 'TCGPlayer market snapshot', price: 141.9 },
    { date: '2025-09-01', source: 'TCGPlayer market snapshot', price: 139.4 },
    { date: '2026-01-15', source: 'TCGPlayer market snapshot', price: 137.75 },
  ],
}

export function getBoosterHistoryBySetName(setName = '') {
  return boosterPriceHistory[setName.trim().toLowerCase()] || []
}
