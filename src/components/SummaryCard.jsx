export default function SummaryCard({ label, value, tone = 'default' }) {
  const toneClass =
    tone === 'positive'
      ? 'text-forest'
      : tone === 'negative'
      ? 'text-clay'
      : 'text-ink'

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm">
      <p className="text-sm text-ink/60">{label}</p>
      <p className={`text-2xl font-extrabold mt-1 ${toneClass}`}>{value}</p>
    </div>
  )
}
