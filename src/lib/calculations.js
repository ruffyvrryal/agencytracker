// Shared math used across Dashboard, Job Board, and Payroll pages.

export function ticketExpenseTotal(expenses = []) {
  return expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)
}

export function ticketNet(project, expenses = []) {
  return Number(project.price || 0) - ticketExpenseTotal(expenses)
}

// Total net profit across every project (all prices minus all expenses).
export function totalNetProfit(projects = [], expenses = []) {
  const totalPrice = projects.reduce((sum, p) => sum + Number(p.price || 0), 0)
  const totalExpenses = ticketExpenseTotal(expenses)
  return totalPrice - totalExpenses
}

// Money left to share: total net profit minus everything already paid out
// to members. Any unallocated percentage from a payout just stays in this
// balance automatically — there's no separate savings bucket to track.
export function computeBalance(projects = [], expenses = [], payouts = []) {
  const profit = totalNetProfit(projects, expenses)
  const paidOut = payouts.reduce((sum, p) => sum + Number(p.total_amount || 0), 0)
  return profit - paidOut
}

// ---- Period filtering (Dashboard: All time / This month / This week / Today) ----

function startOfDay(d = new Date()) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function startOfWeek(d = new Date()) {
  const x = startOfDay(d)
  const day = x.getDay() // 0 = Sunday
  const diffToMonday = day === 0 ? 6 : day - 1
  x.setDate(x.getDate() - diffToMonday)
  return x
}

function startOfMonth(d = new Date()) {
  const x = startOfDay(d)
  x.setDate(1)
  return x
}

// Returns the cutoff Date for a period key, or null for 'all' (no cutoff).
export function periodStart(period) {
  switch (period) {
    case 'day':
      return startOfDay()
    case 'week':
      return startOfWeek()
    case 'month':
      return startOfMonth()
    default:
      return null
  }
}

// Keeps items whose `dateField` falls on/after the period's start.
export function filterByPeriod(items = [], dateField, period) {
  const start = periodStart(period)
  if (!start) return items
  return items.filter((item) => item[dateField] && new Date(item[dateField]) >= start)
}
