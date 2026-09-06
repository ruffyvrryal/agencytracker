import { LayoutDashboard, ClipboardList, Image, Wallet, Settings, Building2 } from 'lucide-react'

const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'tickets', label: 'Job Board', icon: ClipboardList },
  { key: 'gallery', label: 'Gallery', icon: Image },
  { key: 'payroll', label: 'Payroll', icon: Wallet },
  { key: 'settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ current, onNavigate, studioName, onSwitchAgency }) {
  return (
    <nav className="bg-forest text-white md:w-56 md:min-h-screen flex md:flex-col shrink-0 sticky top-0 z-10 md:static shadow-sm md:shadow-none">
      <div className="hidden md:block p-5">
        <p className="font-extrabold text-lg leading-tight truncate">{studioName || 'Studio'}</p>
        <p className="text-white/60 text-xs mt-0.5">Agency Tracker</p>
        {onSwitchAgency && (
          <button
            onClick={onSwitchAgency}
            className="mt-3 flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors"
          >
            <Building2 size={14} /> Switch agency
          </button>
        )}
      </div>

      <div className="flex md:hidden items-center justify-between px-3 py-2.5">
        <p className="font-bold text-sm truncate">{studioName || 'Studio'}</p>
        {onSwitchAgency && (
          <button
            onClick={onSwitchAgency}
            className="flex items-center gap-1 text-xs text-white/70 hover:text-white shrink-0"
          >
            <Building2 size={13} /> Switch
          </button>
        )}
      </div>

      <ul className="flex md:flex-col overflow-x-auto md:overflow-visible px-2 md:px-3 gap-1 pb-2 md:pb-6">
        {NAV.map(({ key, label, icon: Icon }) => {
          const active = current === key
          return (
            <li key={key} className="shrink-0">
              <button
                onClick={() => onNavigate(key)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active ? 'bg-white text-forest shadow-sm' : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={17} />
                {label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
