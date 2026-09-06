import { useState } from 'react'
import SummaryCard from './SummaryCard.jsx'
import StatusTag from './StatusTag.jsx'
import { formatMoney } from '../lib/currency.js'
import { ticketExpenseTotal, totalNetProfit, filterByPeriod } from '../lib/calculations.js'

const PERIODS = [
  { key: 'all', label: 'All time' },
  { key: 'month', label: 'This month' },
  { key: 'week', label: 'This week' },
  { key: 'day', label: 'Today' },
]

export default function DashboardPage({ projects, expenses, payouts, settings }) {
  const [period, setPeriod] = useState('all')
  const currency = settings?.display_currency || 'IDR'
  const rates = settings?.rates || {}

  // Projects/expenses are scoped by the project's own date; payouts by their own date.
  const periodProjects = filterByPeriod(projects, 'date', period)
  const periodProjectIds = new Set(periodProjects.map((p) => p.id))
  const periodExpenses = expenses.filter((e) => periodProjectIds.has(e.project_id))
  const periodPayouts = filterByPeriod(payouts, 'date', period)

  const totalBilled = periodProjects.reduce((s, p) => s + Number(p.price || 0), 0)
  const totalExpenses = ticketExpenseTotal(periodExpenses)
  const netProfit = totalNetProfit(periodProjects, periodExpenses)
  const paidToPayroll = periodPayouts.reduce((s, p) => s + Number(p.total_amount || 0), 0)
  const projectCount = periodProjects.length

  const recent = [...projects]
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Dashboard</h1>
        <div className="flex gap-1 bg-white rounded-lg p-1 w-fit shadow-sm">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                period === p.key ? 'bg-forest text-white' : 'text-ink/70 hover:bg-paper'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <SummaryCard label="Works" value={projectCount} />
        <SummaryCard label="Total billed" value={formatMoney(totalBilled, currency, rates)} />
        <SummaryCard label="Total expenses" value={formatMoney(totalExpenses, currency, rates)} tone="negative" />
        <SummaryCard label="Net profit" value={formatMoney(netProfit, currency, rates)} tone="positive" />
        <SummaryCard label="Paid to payroll" value={formatMoney(paidToPayroll, currency, rates)} />
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="px-5 py-4 border-b border-ink/10">
          <h2 className="font-bold">Recent tickets</h2>
        </div>
        {recent.length === 0 ? (
          <p className="p-5 text-ink/60 text-sm">No projects yet. Add your first job on the Job Board.</p>
        ) : (
          <ul className="divide-y divide-ink/10">
            {recent.map((p) => (
              <li key={p.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold truncate">#{p.ticket_no} · {p.name}</p>
                  <p className="text-sm text-ink/60 truncate">{p.client}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="font-semibold">{formatMoney(p.price, currency, rates)}</span>
                  <StatusTag status={p.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
