import { useState } from 'react'
import { X, Trash2, Plus } from 'lucide-react'
import PhotoUploader from './PhotoUploader.jsx'
import PhotoCard from './PhotoCard.jsx'
import { ticketExpenseTotal, ticketNet } from '../lib/calculations.js'

const STATUSES = ['upcoming', 'ongoing', 'completed']

export default function TicketPanel({
  project,
  expenses,
  photos,
  onClose,
  onSave,
  onDelete,
  onAddExpense,
  onDeleteExpense,
  onAddPhoto,
  onDeletePhoto,
}) {
  const isNew = !project
  const [form, setForm] = useState({
    name: project?.name || '',
    client: project?.client || '',
    status: project?.status || 'upcoming',
    date: project?.date || '',
    price: project?.price ?? '',
    notes: project?.notes || '',
  })
  const [expenseForm, setExpenseForm] = useState({ label: '', amount: '' })
  const [saving, setSaving] = useState(false)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await onSave({ ...form, price: Number(form.price || 0) })
    } finally {
      setSaving(false)
    }
  }

  async function handleAddExpense(e) {
    e.preventDefault()
    if (!expenseForm.label || !expenseForm.amount) return
    await onAddExpense({ label: expenseForm.label, amount: Number(expenseForm.amount) })
    setExpenseForm({ label: '', amount: '' })
  }

  const referencePhotos = photos.filter((p) => p.kind === 'reference')
  const resultPhotos = photos.filter((p) => p.kind === 'result')

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-start md:items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink/10">
          <h2 className="font-bold text-lg">{isNew ? 'New job' : `#${project.ticket_no} · ${project.name}`}</h2>
          <button onClick={onClose} aria-label="Close" className="text-ink/50 hover:text-ink">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Job name">
              <input className="input" value={form.name} onChange={(e) => update('name', e.target.value)} />
            </Field>
            <Field label="Client">
              <input className="input" value={form.client} onChange={(e) => update('client', e.target.value)} />
            </Field>
            <Field label="Status">
              <select className="input" value={form.status} onChange={(e) => update('status', e.target.value)}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </Field>
            <Field label="Date">
              <input type="date" className="input" value={form.date || ''} onChange={(e) => update('date', e.target.value)} />
            </Field>
            <Field label="Price (IDR, what the client pays)">
              <input type="number" className="input" value={form.price} onChange={(e) => update('price', e.target.value)} />
            </Field>
          </div>
          <Field label="Notes">
            <textarea className="input" rows={3} value={form.notes} onChange={(e) => update('notes', e.target.value)} />
          </Field>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving || !form.name}
              className="bg-forest text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
            >
              {isNew ? 'Create job' : 'Save changes'}
            </button>
            {onDelete && (
              <button onClick={onDelete} className="text-clay text-sm font-semibold flex items-center gap-1">
                <Trash2 size={16} /> Delete job
              </button>
            )}
          </div>

          {!isNew && (
            <>
              <hr className="border-ink/10" />

              <section>
                <h3 className="font-bold mb-2">Expenses</h3>
                <ul className="divide-y divide-ink/10 mb-3">
                  {expenses.map((e) => (
                    <li key={e.id} className="flex items-center justify-between py-2 text-sm">
                      <span>{e.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-clay font-medium">- Rp {Number(e.amount).toLocaleString('en-US')}</span>
                        <button onClick={() => onDeleteExpense(e.id)} aria-label="Delete expense" className="text-ink/40 hover:text-clay">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </li>
                  ))}
                  {expenses.length === 0 && <li className="py-2 text-sm text-ink/50">No expenses logged.</li>}
                </ul>
                <form onSubmit={handleAddExpense} className="flex gap-2">
                  <input
                    placeholder="Label (e.g. stock photo)"
                    className="input flex-1"
                    value={expenseForm.label}
                    onChange={(e) => setExpenseForm((f) => ({ ...f, label: e.target.value }))}
                  />
                  <input
                    type="number"
                    placeholder="Amount"
                    className="input w-32"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm((f) => ({ ...f, amount: e.target.value }))}
                  />
                  <button type="submit" className="bg-ink/5 hover:bg-ink/10 rounded-lg px-3">
                    <Plus size={16} />
                  </button>
                </form>
                <p className="text-sm text-ink/60 mt-3">
                  Expense total: Rp {ticketExpenseTotal(expenses).toLocaleString('en-US')} · Net: Rp{' '}
                  {ticketNet(project, expenses).toLocaleString('en-US')}
                </p>
              </section>

              <hr className="border-ink/10" />

              <section>
                <h3 className="font-bold mb-2">Reference photos</h3>
                <div className="flex flex-wrap gap-3 mb-2">
                  {referencePhotos.map((p) => (
                    <PhotoCard key={p.id} photo={p} onDelete={() => onDeletePhoto(p)} />
                  ))}
                </div>
                <PhotoUploader onUpload={(url) => onAddPhoto('reference', url)} />
              </section>

              <section>
                <h3 className="font-bold mb-2">Result photos</h3>
                <p className="text-xs text-ink/50 mb-2">These also appear in the shared Gallery.</p>
                <div className="flex flex-wrap gap-3 mb-2">
                  {resultPhotos.map((p) => (
                    <PhotoCard key={p.id} photo={p} onDelete={() => onDeletePhoto(p)} />
                  ))}
                </div>
                <PhotoUploader onUpload={(url) => onAddPhoto('result', url)} />
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-ink/70 mb-1">{label}</span>
      {children}
    </label>
  )
}
