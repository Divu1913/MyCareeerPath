const colorVar = {
  teal: 'var(--teal)',
  gold: 'var(--gold)',
  brick: 'var(--brick)',
  navy: 'var(--navy-soft)',
}

export default function ActivityFeed({ items }) {
  return (
    <div className="feed">
      {items.map((item, i) => (
        <div className="feed-item" key={i}>
          <span className="feed-dot" style={{ background: colorVar[item.color] }} />
          <div className="feed-body">
            <div className="feed-title">{item.title}</div>
            <div className="feed-meta">{item.meta}</div>
          </div>
          <div className="feed-time">{item.time}</div>
        </div>
      ))}
    </div>
  )
}
