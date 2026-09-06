import StatusTag from './StatusTag.jsx'
import { formatMoney } from '../lib/currency.js'
import { ticketNet } from '../lib/calculations.js'

export default function TicketRow({ project, expenses, currency, rates, onClick }) {
  const net = ticketNet(project, expenses)

  return (
    <button
      onClick={onClick}
      className="w-full text-left px-5 py-3 flex items-center justify-between gap-4 hover:bg-paper transition-colors"
    >
      <div className="min-w-0">
        <p className="font-semibold truncate">#{project.ticket_no} · {project.name}</p>
        <p className="text-sm text-ink/60 truncate">{project.client}</p>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <span className="text-sm text-ink/60 hidden sm:inline">Net {formatMoney(net, currency, rates)}</span>
        <span className="font-semibold">{formatMoney(project.price, currency, rates)}</span>
        <StatusTag status={project.status} />
      </div>
    </button>
  )
}
