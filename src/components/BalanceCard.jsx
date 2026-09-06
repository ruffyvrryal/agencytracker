import { formatMoney } from '../lib/currency.js'

export default function BalanceCard({ balance, currency, rates }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <p className="text-sm text-ink/60">Money left to share</p>
      <p className="text-3xl font-extrabold text-forest mt-1">{formatMoney(balance, currency, rates)}</p>
      <p className="text-xs text-ink/50 mt-2">Net profit so far, minus what's already been paid out to the team. Savings stays counted in here.</p>
    </div>
  )
}
