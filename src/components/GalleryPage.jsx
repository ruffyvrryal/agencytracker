import { useState } from 'react'
import PhotoCard from './PhotoCard.jsx'
import PhotoLightbox from './PhotoLightbox.jsx'
import { deletePhoto as deleteStoredPhoto, pathFromPublicUrl } from '../lib/storage.js'

export default function GalleryPage({ photos, projects, deletePhotoRow }) {
  const [selected, setSelected] = useState(null)
  const results = photos.filter((p) => p.kind === 'result')

  function projectFor(photo) {
    return projects.find((pr) => pr.id === photo.project_id)
  }

  function captionFor(photo) {
    const project = projectFor(photo)
    return project ? `${project.name} · ${project.client || ''}` : undefined
  }

  async function handleDelete(photo) {
    const path = pathFromPublicUrl(photo.url)
    if (path) await deleteStoredPhoto(path)
    await deletePhotoRow(photo.id)
    if (selected?.id === photo.id) setSelected(null)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Gallery</h1>
      {results.length === 0 ? (
        <p className="text-ink/60 text-sm">
          No finished work yet — result photos uploaded on the Job Board will show up here automatically.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {results.map((p) => (
            <PhotoCard
              key={p.id}
              photo={p}
              caption={captionFor(p)}
              onClick={() => setSelected(p)}
              onDelete={() => handleDelete(p)}
            />
          ))}
        </div>
      )}

      {selected && (
        <PhotoLightbox photo={selected} caption={captionFor(selected)} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
