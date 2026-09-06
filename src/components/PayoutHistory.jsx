import { useState } from 'react'
import { formatMoney } from '../lib/currency.js'

export default function PayoutHistory({
  payouts,
  payoutLines,
  members,
  currency,
  rates,
  updatePayout,
  deletePayout,
}) {
  const [editingId, setEditingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

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

            if (editingId === p.id) {
              return (
                <EditPayoutRow
                  key={p.id}
                  payout={p}
                  lines={lines}
                  memberName={memberName}
                  currency={currency}
                  rates={rates}
                  updatePayout={updatePayout}
                  onDone={() => setEditingId(null)}
                />
              )
            }

            if (deletingId === p.id) {
              return (
                <DeletePayoutRow
                  key={p.id}
                  payout={p}
                  currency={currency}
                  rates={rates}
                  deletePayout={deletePayout}
                  onCancel={() => setDeletingId(null)}
                />
              )
            }

            return (
              <li key={p.id} className="px-5 py-4 group">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold">{new Date(p.date).toLocaleDateString()}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{formatMoney(p.total_amount, currency, rates)} paid out</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingId(p.id)}
                        title="Edit payout"
                        className="p-1.5 rounded-md text-ink/50 hover:text-ink hover:bg-ink/5"
                      >
                        <PencilIcon />
                      </button>
                      <button
                        onClick={() => setDeletingId(p.id)}
                        title="Delete payout"
                        className="p-1.5 rounded-md text-clay/70 hover:text-clay hover:bg-clay/10"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
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

function EditPayoutRow({ payout, lines, memberName, currency, rates, updatePayout, onDone }) {
  const [rows, setRows] = useState(() => lines.map((l) => ({ ...l })))
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  const total = rows.reduce((s, r) => s + Number(r.amount || 0), 0)

  function setField(id, field, value) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await updatePayout(
        payout.id,
        rows.map((r) => ({ id: r.id, member_id: r.member_id, percent: Number(r.percent || 0), amount: Number(r.amount || 0) }))
      )
      onDone()
    } catch (err) {
      setError(err.message || String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <li className="px-5 py-4 bg-forest/5">
      <form onSubmit={handleSave} className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold">{new Date(payout.date).toLocaleDateString()}</span>
          <span className="text-sm text-ink/60">Editing payout</span>
        </div>

        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center gap-3">
              <span className="flex-1 text-sm font-medium">{memberName(r.member_id)}</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="any"
                  className="input w-20 text-right"
                  value={r.percent}
                  onChange={(e) => setField(r.id, 'percent', e.target.value)}
                />
                <span className="text-ink/50 text-sm">%</span>
              </div>
              <input
                type="number"
                step="any"
                className="input w-32 text-right"
                value={r.amount}
                onChange={(e) => setField(r.id, 'amount', e.target.value)}
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-sm text-ink/60 border-t border-ink/10 pt-2">
          <span>New total</span>
          <span className="font-semibold text-ink">{formatMoney(total, currency, rates)}</span>
        </div>

        {error && <p className="text-sm text-clay">{error}</p>}

        <div className="flex gap-2">
          <button
            disabled={saving}
            className="bg-forest text-white px-4 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
          <button type="button" onClick={onDone} className="px-4 py-1.5 border rounded-lg text-sm">
            Cancel
          </button>
        </div>
      </form>
    </li>
  )
}

function DeletePayoutRow({ payout, currency, rates, deletePayout, onCancel }) {
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    setError(null)
    try {
      await deletePayout(payout.id)
    } catch (err) {
      setError(err.message || String(err))
      setDeleting(false)
    }
  }

  return (
    <li className="px-5 py-4 bg-clay/5 space-y-2">
      <p className="text-sm text-ink">
        Delete the {formatMoney(payout.total_amount, currency, rates)} payout from{' '}
        <span className="font-semibold">{new Date(payout.date).toLocaleDateString()}</span>? This can't be undone.
      </p>
      {error && <p className="text-sm text-clay">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="bg-clay text-white px-4 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-50"
        >
          {deleting ? 'Deleting...' : 'Delete payout'}
        </button>
        <button onClick={onCancel} className="px-4 py-1.5 border rounded-lg text-sm">
          Cancel
        </button>
      </div>
    </li>
  )
}

function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
