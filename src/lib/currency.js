// All money is stored in IDR. `rates` (from settings.rates) is IDR per 1 unit
// of a foreign currency, e.g. { USD: 15800, EUR: 17200 }.

export function convertFromIDR(amountIDR, currency, rates) {
  if (!currency || currency === 'IDR') return amountIDR
  const rate = rates?.[currency]
  if (!rate) return amountIDR
  return amountIDR / rate
}

export function formatMoney(amountIDR, currency = 'IDR', rates = {}) {
  const value = convertFromIDR(amountIDR, currency, rates)
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'IDR',
      maximumFractionDigits: currency === 'IDR' ? 0 : 2,
    }).format(value)
  } catch {
    // Intl.NumberFormat throws on currency codes it doesn't recognize
    // (e.g. a typo in Settings) -- fall back to a plain number.
    return `${currency} ${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
  }
}
