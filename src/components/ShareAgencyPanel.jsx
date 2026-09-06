import { useEffect, useState } from 'react'
import { Copy, Check, X, RefreshCw, Link2, Mail, UserCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabaseClient.js'
import { useAuth } from '../hooks/useAuth.js'

export default function ShareAgencyPanel({ agencyId }) {
  const { user } = useAuth()
  const [isOwner, setIsOwner] = useState(false)
  const [roleChecked, setRoleChecked] = useState(false)

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
      if (!cancelled) {
        setIsOwner(data?.role === 'owner')
        setRoleChecked(true)
      }
    }
    checkRole()
    return () => {
      cancelled = true
    }
  }, [agencyId, user])

  return (
    <section className="card">
      <div className="px-4 py-3.5 sm:px-6 sm:py-4 border-b border-ink/10">
        <h2 className="font-bold">Share this agency</h2>
        <p className="text-xs sm:text-sm text-ink/50 mt-0.5">
          Give others edit access. They'll still need to enter the agency password every time they open it.
        </p>
      </div>

      <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
        <ShareLinkSection agencyId={agencyId} isOwner={isOwner} roleChecked={roleChecked} />

        {roleChecked && isOwner && (
          <>
            <div className="border-t border-ink/10" />
            <EmailInviteSection agencyId={agencyId} />
            <div className="border-t border-ink/10" />
            <CollaboratorsSection agencyId={agencyId} />
          </>
        )}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------

function ShareLinkSection({ agencyId, isOwner, roleChecked }) {
  const [code, setCode] = useState(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!roleChecked) return
    let cancelled = false
    async function load() {
      setLoading(true)
      if (isOwner) {
        const { data, error } = await supabase.rpc('get_or_create_invite_link', {
          target_agency_id: agencyId,
        })
        if (!cancelled) {
          if (error) setError(error.message)
          else setCode(data)
          setLoading(false)
        }
      } else {
        // Non-owners don't manage the link, just don't show this block.
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [agencyId, isOwner, roleChecked])

  if (!roleChecked || (roleChecked && !isOwner)) return null

  const link = code ? `${window.location.origin}${window.location.pathname}?i=${code}` : ''

  async function handleCopy() {
    if (!link) return
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleRegenerate() {
    setRegenerating(true)
    setError(null)
    const { data, error } = await supabase.rpc('regenerate_invite_link', {
      target_agency_id: agencyId,
    })
    setRegenerating(false)
    if (error) setError(error.message)
    else setCode(data)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-sm font-semibold text-ink/70">
        <Link2 size={15} />
        Share link
      </div>
      {loading ? (
        <p className="text-sm text-ink/50">Loading...</p>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              readOnly
              value={link}
              onFocus={(e) => e.target.select()}
              className="input flex-1 font-mono text-xs sm:text-sm text-ink/70 min-w-0"
            />
            <div className="flex gap-2 shrink-0">
              <button onClick={handleCopy} className="btn-secondary flex-1 sm:flex-none">
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                onClick={handleRegenerate}
                disabled={regenerating}
                title="Generate a new link (old one stops working)"
                className="btn-outline"
              >
                <RefreshCw size={14} className={regenerating ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">Regenerate</span>
              </button>
            </div>
          </div>
          {error && <p className="text-sm text-clay">{error}</p>}
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------

function EmailInviteSection({ agencyId }) {
  const [email, setEmail] = useState('')
  const [invites, setInvites] = useState([])
  const [loading, setLoading] = useState(true)
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState(null)

  async function loadInvites() {
    setLoading(true)
    const { data, error } = await supabase.rpc('list_agency_email_invites', {
      target_agency_id: agencyId,
    })
    setLoading(false)
    if (error) setError(error.message)
    else setInvites(data ?? [])
  }

  useEffect(() => {
    loadInvites()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agencyId])

  async function handleInvite(e) {
    e.preventDefault()
    if (!email.trim()) return
    setInviting(true)
    setError(null)
    const { error } = await supabase.rpc('invite_agency_email', {
      target_agency_id: agencyId,
      invite_email: email.trim(),
    })
    setInviting(false)
    if (error) setError(error.message)
    else {
      setEmail('')
      await loadInvites()
    }
  }

  async function handleRemove(inviteEmail) {
    setError(null)
    const { error } = await supabase.rpc('remove_agency_email_invite', {
      target_agency_id: agencyId,
      invite_email: inviteEmail,
    })
    if (error) setError(error.message)
    else await loadInvites()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 text-sm font-semibold text-ink/70">
        <Mail size={15} />
        Invite by email
      </div>
      <p className="text-xs text-ink/50 -mt-1">
        Anyone signed in with an invited email gets this agency in their agency list automatically.
      </p>

      <form onSubmit={handleInvite} className="flex gap-2">
        <input
          type="email"
          placeholder="teammate@studio.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input flex-1 min-w-0"
        />
        <button disabled={inviting} className="btn-primary shrink-0">
          {inviting ? 'Adding...' : 'Add'}
        </button>
      </form>

      {error && <p className="text-sm text-clay">{error}</p>}

      {loading ? (
        <p className="text-sm text-ink/50">Loading...</p>
      ) : invites.length > 0 ? (
        <ul className="divide-y divide-ink/10 -mx-1">
          {invites.map((inv) => (
            <li key={inv.email} className="flex items-center justify-between gap-2 py-2 px-1">
              <span className="text-sm truncate min-w-0">{inv.email}</span>
              <div className="flex items-center gap-2 shrink-0">
                <span className={inv.joined ? 'badge-success' : 'badge-pending'}>
                  {inv.joined ? 'Joined' : 'Pending'}
                </span>
                <button
                  onClick={() => handleRemove(inv.email)}
                  title="Remove invite"
                  className="icon-btn hover:text-clay hover:bg-clay/10"
                >
                  <X size={15} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink/40">No one invited by email yet.</p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------

function CollaboratorsSection({ agencyId }) {
  const [collaborators, setCollaborators] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function load() {
    setLoading(true)
    const { data, error } = await supabase.rpc('list_agency_collaborators', {
      target_agency_id: agencyId,
    })
    setLoading(false)
    if (error) setError(error.message)
    else setCollaborators(data ?? [])
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agencyId])

  async function handleRemove(userId) {
    setError(null)
    const { error } = await supabase.rpc('remove_agency_collaborator', {
      target_agency_id: agencyId,
      target_user_id: userId,
    })
    if (error) setError(error.message)
    else await load()
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-sm font-semibold text-ink/70">
        <UserCircle2 size={15} />
        Who has access
      </div>
      {loading ? (
        <p className="text-sm text-ink/50">Loading...</p>
      ) : collaborators.length === 0 ? (
        <p className="text-sm text-ink/40">Just you, so far.</p>
      ) : (
        <ul className="divide-y divide-ink/10 -mx-1">
          {collaborators.map((c) => (
            <li key={c.user_id} className="flex items-center justify-between gap-2 py-2 px-1">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{c.email}</p>
                <p className="text-xs text-ink/45">
                  {c.role} · joined {new Date(c.joined_at).toLocaleDateString()}
                </p>
              </div>
              {c.role !== 'owner' && (
                <button
                  onClick={() => handleRemove(c.user_id)}
                  title="Revoke access"
                  className="icon-btn hover:text-clay hover:bg-clay/10 shrink-0"
                >
                  <X size={15} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {error && <p className="text-sm text-clay">{error}</p>}
    </div>
  )
}
