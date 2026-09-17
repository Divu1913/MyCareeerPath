export default function BarChart({ data }) {
  return (
    <div className="bars">
      {data.map((d) => (
        <div className="bar-col" key={d.month}>
          <div className={`bar${d.alt ? ' alt' : ''}`} style={{ height: `${d.height}%` }} />
          <div className="bar-month">{d.month}</div>
        </div>
      ))}
    </div>
  )
}
