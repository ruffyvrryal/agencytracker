import { useState } from 'react'
import { Plus } from 'lucide-react'
import TicketRow from './TicketRow.jsx'
import TicketPanel from './TicketPanel.jsx'
import { deletePhoto as deleteStoredPhoto, pathFromPublicUrl } from '../lib/storage.js'

const TABS = ['All', 'Upcoming', 'Ongoing', 'Completed']

export default function TicketsPage(props) {
  const { projects, expenses, photos, settings, addProject, updateProject, deleteProject, addExpense, deleteExpense, addPhoto, deletePhotoRow } = props
  const [tab, setTab] = useState('All')
  const [selected, setSelected] = useState(null) // project id, or 'new'

  const currency = settings?.display_currency || 'IDR'
  const rates = settings?.rates || {}

  const filtered = projects.filter((p) => tab === 'All' || p.status === tab.toLowerCase())
  const selectedProject = selected && selected !== 'new' ? projects.find((p) => p.id === selected) : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Job Board</h1>
        <button
          onClick={() => setSelected('new')}
          className="flex items-center gap-1.5 bg-forest text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90"
        >
          <Plus size={16} /> New job
        </button>
      </div>

      <div className="flex gap-1 bg-white rounded-lg p-1 w-fit shadow-sm">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === t ? 'bg-forest text-white' : 'text-ink/70 hover:bg-paper'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        {filtered.length === 0 ? (
          <p className="p-5 text-ink/60 text-sm">No jobs in this view yet.</p>
        ) : (
          <ul className="divide-y divide-ink/10">
            {filtered.map((p) => (
              <li key={p.id}>
                <TicketRow
                  project={p}
                  expenses={expenses.filter((e) => e.project_id === p.id)}
                  currency={currency}
                  rates={rates}
                  onClick={() => setSelected(p.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {selected && (
        <TicketPanel
          project={selectedProject}
          expenses={selectedProject ? expenses.filter((e) => e.project_id === selectedProject.id) : []}
          photos={selectedProject ? photos.filter((ph) => ph.project_id === selectedProject.id) : []}
          onClose={() => setSelected(null)}
          onSave={async (fields) => {
            if (selectedProject) await updateProject(selectedProject.id, fields)
            else await addProject(fields)
            setSelected(null)
          }}
          onDelete={
            selectedProject
              ? async () => {
                  await deleteProject(selectedProject.id)
                  setSelected(null)
                }
              : null
          }
          onAddExpense={selectedProject ? (fields) => addExpense(selectedProject.id, fields) : null}
          onDeleteExpense={deleteExpense}
          onAddPhoto={selectedProject ? (kind, url) => addPhoto(selectedProject.id, kind, url) : null}
          onDeletePhoto={async (photo) => {
            const path = pathFromPublicUrl(photo.url)
            if (path) await deleteStoredPhoto(path)
            await deletePhotoRow(photo.id)
          }}
        />
      )}
    </div>
  )
}
