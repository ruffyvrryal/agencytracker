import { useState } from 'react'
import { useAgencies } from '../hooks/useAgencies.js'
import { useAuth } from '../hooks/useAuth.js'

export default function AgencyPicker({ onSelect }) {
  const { agencies, loading, createAgency, renameAgency, deleteAgency } = useAgencies()
  const { signOut } = useAuth()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [editingId, setEditingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const handleCreate = async (e) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { id, error } = await createAgency(name, password)
    setSubmitting(false)
    if (error) setError(error.message)
    else onSelect(id)
  }

  return (
    <div className="min-h-screen bg-paper p-4 md:p-8">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-ink">Your agencies</h1>
          <button onClick={signOut} className="text-sm text-ink/50 underline">
            Sign out
          </button>
        </div>

        {loading ? (
          <p className="text-ink/60">Loading...</p>
        ) : agencies.length > 0 ? (
          <ul className="space-y-2">
            {agencies.map((a) =>
              editingId === a.id ? (
                <EditAgencyRow
                  key={a.id}
                  agency={a}
                  onRename={renameAgency}
                  onDone={() => setEditingId(null)}
                />
              ) : deletingId === a.id ? (
                <DeleteAgencyRow
                  key={a.id}
                  agency={a}
                  onDelete={deleteAgency}
                  onCancel={() => setDeletingId(null)}
                />
              ) : (
                <li
                  key={a.id}
                  className="border rounded-lg p-3 flex items-center gap-2 hover:bg-gray-50"
                >
                  <button onClick={() => onSelect(a.id)} className="flex-1 text-left flex items-center justify-between min-w-0">
                    <span className="font-medium truncate">{a.name}</span>
                    <span className="text-xs text-ink/50 shrink-0 ml-2">{a.role}</span>
                  </button>
                  {a.role === 'owner' && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setEditingId(a.id)}
                        title="Rename agency"
                        className="p-1.5 rounded-md text-ink/50 hover:text-ink hover:bg-ink/5"
                      >
                        <PencilIcon />
                      </button>
                      <button
                        onClick={() => setDeletingId(a.id)}
                        title="Delete agency"
                        className="p-1.5 rounded-md text-clay/70 hover:text-clay hover:bg-clay/10"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  )}
                </li>
              )
            )}
          </ul>
        ) : (
          <p className="text-sm text-ink/60">
            You're not part of any agency yet. Create one, or open a link someone shared with you.
          </p>
        )}

        {creating ? (
          <form onSubmit={handleCreate} className="space-y-2 border rounded-lg p-4">
            <input
              required
              placeholder="Agency name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
            <input
              required
              type="password"
              placeholder="Set a shared access password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
            <p className="text-xs text-ink/50">
              Anyone with this password (and the agency link) can edit this agency's data.
            </p>
            {error && <p className="text-sm text-clay">{error}</p>}
            <div className="flex gap-2">
              <button
                disabled={submitting}
                className="flex-1 bg-ink text-white rounded-lg py-2"
              >
                {submitting ? 'Creating...' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="px-4 border rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button onClick={() => setCreating(true)} className="text-sm underline text-ink/70">
            + Create a new agency
          </button>
        )}
      </div>
    </div>
  )
}

function EditAgencyRow({ agency, onRename, onDone }) {
  const [name, setName] = useState(agency.name)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  async function handleSave(e) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    const { error } = await onRename(agency.id, name.trim())
    setSaving(false)
    if (error) setError(error.message)
    else onDone()
  }

  return (
    <li className="border rounded-lg p-3 space-y-2 bg-white">
      <form onSubmit={handleSave} className="flex items-center gap-2">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 border rounded-lg px-3 py-1.5 text-sm"
        />
        <button
          disabled={saving}
          className="text-sm bg-forest text-white rounded-lg px-3 py-1.5 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button type="button" onClick={onDone} className="text-sm px-3 py-1.5 border rounded-lg">
          Cancel
        </button>
      </form>
      {error && <p className="text-sm text-clay">{error}</p>}
    </li>
  )
}

function DeleteAgencyRow({ agency, onDelete, onCancel }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete(e) {
    e.preventDefault()
    setDeleting(true)
    setError(null)
    const { error } = await onDelete(agency.id, password)
    setDeleting(false)
    if (error) setError(error.message)
    // on success, the agencies list refreshes and this row disappears on its own
  }

  return (
    <li className="border border-clay/40 rounded-lg p-3 space-y-2 bg-clay/5">
      <p className="text-sm text-ink">
        Delete <span className="font-semibold">{agency.name}</span>? This permanently removes all of
        its tickets, payouts, and photos. Enter the agency password to confirm.
      </p>
      <form onSubmit={handleDelete} className="flex items-center gap-2">
        <input
          autoFocus
          type="password"
          required
          placeholder="Agency password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="flex-1 border rounded-lg px-3 py-1.5 text-sm"
        />
        <button
          disabled={deleting}
          className="text-sm bg-clay text-white rounded-lg px-3 py-1.5 disabled:opacity-50"
        >
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
        <button type="button" onClick={onCancel} className="text-sm px-3 py-1.5 border rounded-lg">
          Cancel
        </button>
      </form>
      {error && <p className="text-sm text-clay">{error}</p>}
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
