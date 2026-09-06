import BalanceCard from './BalanceCard.jsx'
import PayoutForm from './PayoutForm.jsx'
import PayoutHistory from './PayoutHistory.jsx'
import { computeBalance } from '../lib/calculations.js'

export default function PayrollPage({
  projects,
  expenses,
  payouts,
  payoutLines,
  members,
  settings,
  recordPayout,
  updatePayout,
  deletePayout,
}) {
  const currency = settings?.display_currency || 'IDR'
  const rates = settings?.rates || {}
  const balance = computeBalance(projects, expenses, payouts)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Payroll</h1>

      <BalanceCard balance={balance} currency={currency} rates={rates} />

      <PayoutForm
        members={members}
        balance={balance}
        currency={currency}
        rates={rates}
        onPay={(lines) => recordPayout(lines, balance)}
      />

      <PayoutHistory
        payouts={payouts}
        payoutLines={payoutLines}
        members={members}
        currency={currency}
        rates={rates}
        updatePayout={updatePayout}
        deletePayout={deletePayout}
      />
    </div>
  )
}
