import { formatMoney } from '../lib/currency.js'

export default function PayoutHistory({ payouts, payoutLines, members, currency, rates }) {
  function memberName(id) {
    return members.find((m) => m.id === id)?.name || 'Unknown'
  }

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="px-5 py-4 border-b border-ink/10">
        <h2 className="font-bold">Payout history</h2>
      </div>
      {payouts.length === 0 ? (
        <p className="p-5 text-sm text-ink/60">No payouts recorded yet.</p>
      ) : (
        <ul className="divide-y divide-ink/10">
          {payouts.map((p) => {
            const lines = payoutLines.filter((l) => l.payout_id === p.id)
            return (
              <li key={p.id} className="px-5 py-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{new Date(p.date).toLocaleDateString()}</span>
                  <span className="font-semibold">{formatMoney(p.total_amount, currency, rates)} paid out</span>
                </div>
                <ul className="text-sm text-ink/60 mt-1 space-y-0.5">
                  {lines.map((l) => (
                    <li key={l.id}>
                      {memberName(l.member_id)}: {l.percent}% · {formatMoney(l.amount, currency, rates)}
                    </li>
                  ))}
                </ul>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
