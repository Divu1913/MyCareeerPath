import ActivityFeed from '../components/ActivityFeed.jsx'
import Tag from '../components/Tag.jsx'
import { useCallback, useEffect, useState } from 'react'
import { api } from '../api.js'

const toneFor = (type) => type === 'security' ? 'brick' : type === 'moderation' ? 'gold' : 'teal'
const timeLabel = (value) => {
  if (!value) return 'Time unavailable'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Time unavailable'
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000))
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  if (minutes < 1440) return `${Math.floor(minutes / 60)} hr ago`
  return date.toLocaleString()
}

export default function Activity() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.getActivityLogs()
      setItems(Array.isArray(data) ? data : data?.items || data?.logs || [])
    } catch (err) {
      setError(err.message || 'Unable to load platform activity.')
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { load() }, [load])

  return (
    <section className="view active">
      <div className="section-head">
        <div>
          <h2>Platform activity</h2>
          <p>A live trail of what's happening across candidate, employer and admin dashboards</p>
        </div>
        <button className="btn btn-ghost" type="button" onClick={load} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</button>
      </div>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <div className="panel">
        <div className="activity-log">
          {loading && items.length === 0 ? <p>Loading activity…</p> : items.map((item, index) => {
            const color = toneFor(item.type || item.category || item.color)
            const feedItem = { color, title: item.title || item.action || 'Platform event', meta: item.meta || item.description || item.email || '', time: timeLabel(item.created_at || item.timestamp || item.time) }
            return <div className="activity-log-row" key={item.id || item._id || `${feedItem.title}-${index}`}><ActivityFeed items={[feedItem]} /><Tag tone={color}>{item.type || item.category || 'Platform'}</Tag></div>
          })}
          {!loading && !error && items.length === 0 && <p>No recent activity found.</p>}
        </div>
      </div>
    </section>
  )
}
