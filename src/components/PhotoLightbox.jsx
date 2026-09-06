import { useEffect } from 'react'
import { X, Download } from 'lucide-react'

export default function PhotoLightbox({ photo, caption, onClose }) {
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  async function handleDownload() {
    try {
      // Fetching as a blob forces an actual download instead of the browser
      // just navigating to the image (which is what a plain <a download>
      // often does for cross-origin URLs like Supabase Storage).
      const res = await fetch(photo.url)
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = photo.url.split('/').pop()?.split('?')[0] || 'photo.jpg'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(blobUrl)
    } catch {
      window.open(photo.url, '_blank')
    }
  }

  return (
    <div
      className="fixed inset-0 bg-ink/80 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
        <img
          src={photo.url}
          alt={caption || 'Photo'}
          className="w-full max-h-[75vh] object-contain rounded-lg bg-black/20"
        />
        <div className="flex items-center justify-between mt-3 gap-3">
          <p className="text-white text-sm truncate">{caption}</p>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 bg-white text-ink px-3 py-1.5 rounded-lg text-sm font-semibold hover:opacity-90"
            >
              <Download size={14} /> Download
            </button>
            <button
              onClick={onClose}
              aria-label="Close"
              className="bg-white/10 text-white rounded-full p-2 hover:bg-white/20"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
