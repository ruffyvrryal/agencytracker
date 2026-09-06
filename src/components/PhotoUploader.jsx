import { useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { uploadPhoto } from '../lib/storage.js'

export default function PhotoUploader({ onUpload }) {
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function handleChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      // A random id keeps uploads from a fresh job from colliding by name;
      // the caller links the resulting URL to the right project row.
      const { url } = await uploadPhoto(file, crypto.randomUUID())
      await onUpload(url)
    } catch (err) {
      setError(err.message || 'Upload failed')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="flex items-center gap-1.5 text-sm font-medium text-forest border border-forest rounded-lg px-3 py-1.5 hover:bg-forest/5 disabled:opacity-50"
      >
        <Upload size={14} /> {busy ? 'Uploading...' : 'Upload photo'}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
      {error && <p className="text-clay text-xs mt-1">{error}</p>}
    </div>
  )
}
