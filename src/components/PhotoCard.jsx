import { X } from 'lucide-react'

export default function PhotoCard({ photo, caption, onDelete, onClick }) {
  return (
    <div className="relative w-28 h-28 rounded-lg overflow-hidden bg-ink/5 group">
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          className="w-full h-full block"
          aria-label={caption ? `View ${caption}` : 'View photo'}
        >
          <img src={photo.url} alt={caption || 'Uploaded photo'} className="w-full h-full object-cover" />
        </button>
      ) : (
        <img src={photo.url} alt={caption || 'Uploaded photo'} className="w-full h-full object-cover" />
      )}
      {caption && (
        <div className="absolute bottom-0 inset-x-0 bg-ink/70 text-white text-[11px] px-1.5 py-1 truncate pointer-events-none">
          {caption}
        </div>
      )}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          aria-label="Delete photo"
          className="absolute top-1 right-1 bg-ink/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X size={12} />
        </button>
      )}
    </div>
  )
}
