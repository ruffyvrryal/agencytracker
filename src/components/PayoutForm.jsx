import { useState } from 'react'
import { formatMoney } from '../lib/currency.js'

export default function PayoutForm({ members, balance, currency, rates, onPay }) {
  const [percents, setPercents] = useState(() => Object.fromEntries(members.map((m) => [m.id, ''])))
  const [paying, setPaying] = useState(false)

  const totalPercent = Object.values(percents).reduce((s, v) => s + Number(v || 0), 0)
  const remainingPercent = 100 - totalPercent
  const remainingAmount = Math.round((balance * remainingPercent) / 100)

  async function handlePay() {
    const lines = members
      .map((m) => ({ member_id: m.id, percent: Number(percents[m.id] || 0) }))
      .filter((l) => l.percent > 0)
    if (lines.length === 0) return

    setPaying(true)
    try {
      await onPay(lines)
      setPercents(Object.fromEntries(members.map((m) => [m.id, ''])))
    } finally {
      setPaying(false)
    }
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
      <h2 className="font-bold">New payout</h2>

      {members.length === 0 && (
        <p className="text-sm text-ink/60">Add team members in Settings before running a payout.</p>
      )}

      {members.map((m) => {
        const amount = Math.round((balance * Number(percents[m.id] || 0)) / 100)
        return (
          <div key={m.id} className="flex items-center gap-3">
            <span className="flex-1 font-medium">{m.name}</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                className="input w-20 text-right"
                value={percents[m.id]}
                onChange={(e) => setPercents((p) => ({ ...p, [m.id]: e.target.value }))}
              />
              <span className="text-ink/50">%</span>
            </div>
            <span className="w-32 text-right text-sm text-ink/60">{formatMoney(amount, currency, rates)}</span>
          </div>
        )
      })}

      <hr className="border-ink/10" />

      <div className="flex items-center gap-3 text-ink/60">
        <span className="flex-1 text-sm">Staying in the balance</span>
        <span className="w-20 text-right text-sm">{Math.max(remainingPercent, 0)}%</span>
        <span className="w-32 text-right text-sm">{formatMoney(Math.max(remainingAmount, 0), currency, rates)}</span>
      </div>

      {totalPercent > 100 && (
        <p className="text-clay text-sm">Percentages add up to {totalPercent}% — that's over 100%.</p>
      )}

      <button
        onClick={handlePay}
        disabled={paying || totalPercent === 0 || totalPercent > 100 || balance <= 0}
        className="bg-forest text-white px-5 py-2.5 rounded-lg font-semibold disabled:opacity-50"
      >
        {paying ? 'Paying...' : 'Pay'}
      </button>
    </div>
  )
}
