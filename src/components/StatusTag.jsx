const STYLES = {
  upcoming: 'bg-ink/10 text-ink',
  ongoing: 'bg-sage/20 text-sage',
  completed: 'bg-forest/15 text-forest',
}

const LABELS = {
  upcoming: 'Upcoming',
  ongoing: 'Ongoing',
  completed: 'Completed',
}

export default function StatusTag({ status }) {
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${STYLES[status] || STYLES.upcoming}`}>
      {LABELS[status] || status}
    </span>
  )
}
