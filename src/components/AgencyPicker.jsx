import { useState } from 'react'
import { useAgencies } from '../hooks/useAgencies.js'
import { useAuth } from '../hooks/useAuth.js'

export default function AgencyPicker({ onSelect }) {
  const { agencies, loading, createAgency } = useAgencies()
  const { signOut } = useAuth()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

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
            {agencies.map((a) => (
              <li key={a.id}>
                <button
                  onClick={() => onSelect(a.id)}
                  className="w-full text-left border rounded-lg p-3 hover:bg-gray-50 flex items-center justify-between"
                >
                  <span className="font-medium">{a.name}</span>
                  <span className="text-xs text-ink/50">{a.role}</span>
                </button>
              </li>
            ))}
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
