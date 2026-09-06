import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'

export default function AgencyPasswordGate({ agencyId, onUnlock, onBack }) {
  const [agencyName, setAgencyName] = useState(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    let cancelled = false
    supabase.rpc('agency_display_name', { target_agency_id: agencyId }).then(({ data }) => {
      if (!cancelled) setAgencyName(data)
    })
    return () => {
      cancelled = true
    }
  }, [agencyId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setChecking(true)
    setError(null)
    const { data: ok, error } = await supabase.rpc('verify_agency_password', {
      target_agency_id: agencyId,
      agency_password: password,
    })
    setChecking(false)
    if (error) setError(error.message)
    else if (!ok) setError('Incorrect password.')
    else onUnlock()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-xl shadow p-6 space-y-3">
        <h1 className="text-lg font-semibold">{agencyName ?? 'Enter agency'}</h1>
        <p className="text-sm text-ink/60">Enter the access password for this agency.</p>
        <input
          type="password"
          required
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        />
        {error && <p className="text-sm text-clay">{error}</p>}
        <button disabled={checking} className="w-full bg-ink text-white rounded-lg py-2">
          {checking ? 'Checking...' : 'Unlock'}
        </button>
        {onBack && (
          <button type="button" onClick={onBack} className="w-full text-sm text-ink/50 underline">
            Back to agency list
          </button>
        )}
      </form>
    </div>
  )
}
