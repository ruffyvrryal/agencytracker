import { useState } from 'react'
import { useAuth } from '../hooks/useAuth.js'

export default function LoginPage() {
  const { signInWithGoogle, signInWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)

  const handleEmailLogin = async (e) => {
    e.preventDefault()
    setError(null)
    const { error } = await signInWithEmail(email)
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow p-6 space-y-4">
        <h1 className="text-xl font-semibold text-ink">Agency Tracker</h1>

        <button
          onClick={signInWithGoogle}
          className="w-full border rounded-lg py-2 font-medium hover:bg-gray-50"
        >
          Continue with Google
        </button>

        <div className="text-center text-sm text-ink/50">or</div>

        {sent ? (
          <p className="text-sm text-ink/70">
            Check <span className="font-medium">{email}</span> for a login link.
          </p>
        ) : (
          <form onSubmit={handleEmailLogin} className="space-y-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@studio.com"
              className="w-full border rounded-lg px-3 py-2"
            />
            {error && <p className="text-sm text-clay">{error}</p>}
            <button
              type="submit"
              className="w-full bg-ink text-white rounded-lg py-2 font-medium"
            >
              Send magic link
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
