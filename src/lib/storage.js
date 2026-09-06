import { supabase } from './supabaseClient.js'

const BUCKET = 'project-photos'

// Uploads a file to the project-photos bucket and returns its public URL.
export async function uploadPhoto(file, projectId) {
  const ext = file.name.split('.').pop()
  const path = `${projectId}/${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file)
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return { url: data.publicUrl, path }
}

// Deletes a file from storage given its path (not its full public URL).
export async function deletePhoto(path) {
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) throw error
}

// Storage paths aren't stored in the photos table (only the public URL is),
// so this pulls the path back out of a Supabase public URL for deletion.
export function pathFromPublicUrl(url) {
  const marker = `/${BUCKET}/`
  const idx = url.indexOf(marker)
  return idx === -1 ? null : url.slice(idx + marker.length)
}
