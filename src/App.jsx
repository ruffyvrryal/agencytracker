import { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import DashboardPage from './components/DashboardPage.jsx'
import TicketsPage from './components/TicketsPage.jsx'
import GalleryPage from './components/GalleryPage.jsx'
import PayrollPage from './components/PayrollPage.jsx'
import SettingsPage from './components/SettingsPage.jsx'
import LoginPage from './components/LoginPage.jsx'
import AgencyPicker from './components/AgencyPicker.jsx'
import AgencyPasswordGate from './components/AgencyPasswordGate.jsx'
import { useAuth } from './hooks/useAuth.js'
import { useAgencyData } from './hooks/useAgencyData.js'

const PAGES = {
  dashboard: DashboardPage,
  tickets: TicketsPage,
  gallery: GalleryPage,
  payroll: PayrollPage,
  settings: SettingsPage,
}

export default function App() {
  const { user, loading: authLoading } = useAuth()

  // Agency id can arrive via a shared link: yoursite.com/?agency=<uuid>
  const [agencyId, setAgencyId] = useState(
    () => new URLSearchParams(window.location.search).get('agency')
  )
  const [unlocked, setUnlocked] = useState(false)
  const [page, setPage] = useState('dashboard')

  // Keep the URL in sync so the current agency is always a shareable link,
  // and switching agencies re-locks the password gate.
  useEffect(() => {
    const url = new URL(window.location.href)
    if (agencyId) url.searchParams.set('agency', agencyId)
    else url.searchParams.delete('agency')
    window.history.replaceState({}, '', url)
    setUnlocked(false)
  }, [agencyId])

  if (authLoading) return <p className="p-8 text-ink/60">Loading...</p>
  if (!user) return <LoginPage />
  if (!agencyId) return <AgencyPicker onSelect={setAgencyId} />
  if (!unlocked) {
    return (
      <AgencyPasswordGate
        agencyId={agencyId}
        onUnlock={() => setUnlocked(true)}
        onBack={() => setAgencyId(null)}
      />
    )
  }

  return <Dashboard agencyId={agencyId} page={page} setPage={setPage} onSwitchAgency={() => setAgencyId(null)} />
}

function Dashboard({ agencyId, page, setPage, onSwitchAgency }) {
  const data = useAgencyData(agencyId)
  const Page = PAGES[page]

  return (
    <div className="min-h-screen bg-paper flex flex-col md:flex-row">
      <Sidebar
        current={page}
        onNavigate={setPage}
        studioName={data.settings?.studio_name}
        onSwitchAgency={onSwitchAgency}
      />
      <main className="flex-1 min-w-0 p-4 md:p-8">
        {data.loading ? (
          <p className="text-ink/60">Loading...</p>
        ) : data.error ? (
          <div className="bg-clay/10 border border-clay text-clay rounded-lg p-4">
            <p className="font-semibold">Couldn't load data</p>
            <p className="text-sm mt-1">{data.error}</p>
          </div>
        ) : (
          <Page {...data} agencyId={agencyId} />
        )}
      </main>
    </div>
  )
}
