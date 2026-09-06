import { useEffect, useState } from 'react'
import { Copy, Check, X } from 'lucide-react'
import { supabase } from '../lib/supabaseClient.js'
import { useAuth } from '../hooks/useAuth.js'

export default function ShareAgencyPanel({ agencyId }) {
  const { user } = useAuth()
  const [isOwner, setIsOwner] = useState(false)
  const [copied, setCopied] = useState(false)
  const [collaborators, setCollaborators] = useState([])
  const [loadingCollaborators, setLoadingCollaborators] = useState(false)
  const [error, setError] = useState(null)

  const shareLink = `${window.location.origin}${window.location.pathname}?agency=${agencyId}`

  useEffect(() => {
    let cancelled = false
    async function checkRole() {
      if (!user) return
      const { data } = await supabase
        .from('agency_members')
        .select('role')
        .eq('agency_id', agencyId)
        .eq('user_id', user.id)
        .single()
      if (!cancelled) setIsOwner(data?.role === 'owner')
    }
    checkRole()
    return () => {
      cancelled = true
    }
  }, [agencyId, user])

  async function loadCollaborators() {
    setLoadingCollaborators(true)
    setError(null)
    const { data, error } = await supabase.rpc('list_agency_collaborators', {
      target_agency_id: agencyId,
    })
    setLoadingCollaborators(false)
    if (error) setError(error.message)
    else setCollaborators(data ?? [])
  }

  useEffect(() => {
    if (isOwner) loadCollaborators()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner, agencyId])

  async function handleCopy() {
    await navigator.clipboard.writeText(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleRemove(userId) {
    setError(null)
    const { error } = await supabase.rpc('remove_agency_collaborator', {
      target_agency_id: agencyId,
      target_user_id: userId,
    })
    if (error) setError(error.message)
    else await loadCollaborators()
  }

  return (
    <section className="bg-white rounded-xl p-6 shadow-sm space-y-4">
      <div>
        <h2 className="font-bold">Share this agency</h2>
        <p className="text-sm text-ink/60 mt-1">
          Send this link to someone so they can edit this agency's data. They'll need to sign in and
          enter the agency password — every time they open it, not just the first time.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <input readOnly value={shareLink} className="input flex-1 text-sm text-ink/70" onFocus={(e) => e.target.select()} />
        <button
          onClick={handleCopy}
          className="shrink-0 flex items-center gap-1.5 bg-ink text-white rounded-lg px-3 py-2 text-sm font-medium"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {isOwner && (
        <div className="pt-2 border-t border-ink/10 space-y-2">
          <h3 className="text-sm font-semibold text-ink/70">Who has access</h3>
          {loadingCollaborators ? (
            <p className="text-sm text-ink/50">Loading...</p>
          ) : collaborators.length === 0 ? (
            <p className="text-sm text-ink/50">Just you, so far.</p>
          ) : (
            <ul className="divide-y divide-ink/10">
              {collaborators.map((c) => (
                <li key={c.user_id} className="flex items-center justify-between py-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{c.email}</p>
                    <p className="text-xs text-ink/50">
                      {c.role} · joined {new Date(c.joined_at).toLocaleDateString()}
                    </p>
                  </div>
                  {c.role !== 'owner' && (
                    <button
                      onClick={() => handleRemove(c.user_id)}
                      title="Revoke access"
                      className="shrink-0 p-1.5 rounded-md text-ink/40 hover:text-clay hover:bg-clay/10"
                    >
                      <X size={16} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {error && <p className="text-sm text-clay">{error}</p>}
        </div>
      )}
    </section>
  )
}
