export default function Donut({ segments }) {
  let cursor = 0
  const stops = segments
    .map((s) => {
      const start = cursor
      cursor += (s.pct / 100) * 360
      return `${s.color} ${start}deg ${cursor}deg`
    })
    .join(', ')

  return (
    <div className="donut-wrap">
      <div className="donut" style={{ background: `conic-gradient(${stops})` }} />
      <div className="legend">
        {segments.map((s) => (
          <div className="legend-item" key={s.label}>
            <span className="dot" style={{ background: s.color }} />
            {s.label}
            <b>{s.pct}%</b>
          </div>
        ))}
      </div>
    </div>
  )
}
