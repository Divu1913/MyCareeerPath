import { useCallback, useEffect, useState } from 'react'
import { api } from '../../api.js'

const toneFor = (type) => (type === 'security' ? 'brick' : type === 'moderation' ? 'gold' : 'teal')

const colorVar = {
  teal: 'var(--teal, #0d9488)',
  gold: 'var(--gold, #d97706)',
  brick: 'var(--brick, #e11d48)',
  navy: 'var(--navy-soft, #334155)',
}

const timeLabel = (value) => {
  if (!value) return 'Time unavailable'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Time unavailable'
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000))
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  if (minutes < 1440) return `${Math.floor(minutes / 60)} hr ago`
  return date.toLocaleDateString()
}

export default function PlatformActivity() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchActivityLogs = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      // Direct live call to /api/v1/admin/activity-logs with Bearer auth token
      const data = await api.getActivityLogs(100)
      const logs = Array.isArray(data) ? data : data?.items || data?.logs || []
      setItems(logs)
    } catch (err) {
      console.error('Failed to load live activity logs:', err)
      setError(err.message || 'Unable to load platform activity logs.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchActivityLogs()
  }, [fetchActivityLogs])

  return (
    <section className="view active">
      <div className="section-head">
        <div>
          <h2>Platform activity</h2>
          <p>A live trail of what&apos;s happening across candidate, employer and admin dashboards</p>
        </div>
        <button
          className="btn btn-ghost"
          type="button"
          onClick={fetchActivityLogs}
          disabled={loading}
          aria-label="Refresh activity logs"
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {error && (
        <p className="auth-error" role="alert">
          {error}
        </p>
      )}

      <div className="panel">
        <div className="activity-log">
          {loading && items.length === 0 ? (
            <p>Loading activity from live log trail…</p>
          ) : items.map((item, index) => {
            const tone = toneFor(item.type || item.category)
            const title = item.title || item.action || 'Platform event'
            const meta = item.meta || item.description || item.email || ''
            const time = timeLabel(item.created_at || item.timestamp || item.time)
            const dotColor = colorVar[tone] || colorVar.teal

            return (
              <div
                className="activity-log-row"
                key={item.id || item._id || `${title}-${index}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderBottom: '1px solid var(--line, #e2e8f0)',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: dotColor,
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--navy, #0f172a)', fontSize: '14px' }}>
                      {title}
                    </div>
                    {meta && (
                      <div style={{ fontSize: '12.5px', color: 'var(--ink-soft, #64748b)', marginTop: '2px' }}>
                        {meta}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                  <span style={{ fontSize: '12px', color: 'var(--ink-faint, #94a3b8)' }}>{time}</span>
                  <span className={`tag tag-${tone}`}>{item.type || item.category || 'Platform'}</span>
                </div>
              </div>
            )
          })}

          {!loading && !error && items.length === 0 && (
            <p style={{ padding: '16px', color: 'var(--ink-soft, #64748b)' }}>No recent activity found.</p>
          )}
        </div>
      </div>
    </section>
  )
}

export { PlatformActivity }

