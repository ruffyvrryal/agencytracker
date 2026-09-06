import { useState } from 'react'
import { Trash2, Plus } from 'lucide-react'

export default function SettingsPage({ settings, updateSettings, members, addMember, updateMember, deleteMember }) {
  const [studioName, setStudioName] = useState(settings?.studio_name || '')
  const [displayCurrency, setDisplayCurrency] = useState(settings?.display_currency || 'IDR')
  const [rates, setRates] = useState(settings?.rates || {})
  const [newRateCode, setNewRateCode] = useState('')
  const [newRateValue, setNewRateValue] = useState('')
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberRole, setNewMemberRole] = useState('')
  const [saving, setSaving] = useState(false)

  async function saveGeneral() {
    setSaving(true)
    try {
      await updateSettings({ studio_name: studioName, display_currency: displayCurrency, rates })
    } finally {
      setSaving(false)
    }
  }

  function addRate() {
    if (!newRateCode || !newRateValue) return
    setRates((r) => ({ ...r, [newRateCode.toUpperCase()]: Number(newRateValue) }))
    setNewRateCode('')
    setNewRateValue('')
  }

  function removeRate(code) {
    setRates((r) => {
      const next = { ...r }
      delete next[code]
      return next
    })
  }

  async function handleAddMember(e) {
    e.preventDefault()
    if (!newMemberName) return
    await addMember({ name: newMemberName, role: newMemberRole })
    setNewMemberName('')
    setNewMemberRole('')
  }

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-extrabold">Settings</h1>

      <section className="bg-white rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="font-bold">Studio</h2>
        <label className="block">
          <span className="block text-sm font-medium text-ink/70 mb-1">Studio name</span>
          <input className="input" value={studioName} onChange={(e) => setStudioName(e.target.value)} />
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-ink/70 mb-1">Display currency</span>
          <input className="input" value={displayCurrency} onChange={(e) => setDisplayCurrency(e.target.value.toUpperCase())} />
        </label>

        <div>
          <span className="block text-sm font-medium text-ink/70 mb-1">Exchange rates (IDR per 1 unit)</span>
          <ul className="space-y-1 mb-2">
            {Object.entries(rates).map(([code, value]) => (
              <li key={code} className="flex items-center gap-2 text-sm">
                <span className="w-16 font-medium">{code}</span>
                <span className="flex-1">Rp {Number(value).toLocaleString('en-US')}</span>
                <button onClick={() => removeRate(code)} className="text-ink/40 hover:text-clay">
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <input placeholder="USD" className="input w-20" value={newRateCode} onChange={(e) => setNewRateCode(e.target.value)} />
            <input placeholder="15800" type="number" className="input flex-1" value={newRateValue} onChange={(e) => setNewRateValue(e.target.value)} />
            <button onClick={addRate} className="bg-ink/5 hover:bg-ink/10 rounded-lg px-3">
              <Plus size={16} />
            </button>
          </div>
        </div>

        <button
          onClick={saveGeneral}
          disabled={saving}
          className="bg-forest text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
        >
          Save
        </button>
      </section>

      <section className="bg-white rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="font-bold">Team members</h2>
        <ul className="divide-y divide-ink/10">
          {members.map((m) => (
            <li key={m.id} className="flex items-center gap-2 py-2">
              <input
                className="input flex-1"
                value={m.name}
                onChange={(e) => updateMember(m.id, { name: e.target.value })}
              />
              <input
                className="input flex-1"
                value={m.role || ''}
                placeholder="Role"
                onChange={(e) => updateMember(m.id, { role: e.target.value })}
              />
              <button onClick={() => deleteMember(m.id)} className="text-ink/40 hover:text-clay">
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
        <form onSubmit={handleAddMember} className="flex gap-2">
          <input placeholder="Name" className="input flex-1" value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} />
          <input placeholder="Role" className="input flex-1" value={newMemberRole} onChange={(e) => setNewMemberRole(e.target.value)} />
          <button type="submit" className="bg-ink/5 hover:bg-ink/10 rounded-lg px-3">
            <Plus size={16} />
          </button>
        </form>
      </section>
    </div>
  )
}
