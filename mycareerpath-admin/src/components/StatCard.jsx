export default function StatCard({ label, value, delta, trend, accent }) {
  return (
    <div className={`stat-card${accent !== 'teal' ? ' c-' + accent : ''}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-num">{value}</div>
      <div className={`stat-delta ${trend}`}>{delta}</div>
    </div>
  )
}
