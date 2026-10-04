import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import StatCard from '../components/StatCard.jsx'
import { api } from '../../../src/api.js'

const BarChart = lazy(() => import('../components/BarChart.jsx'))
const Donut = lazy(() => import('../components/Donut.jsx'))
const ActivityFeed = lazy(() => import('../components/ActivityFeed.jsx'))

function ChartSkeleton() {
  return <div aria-hidden="true" className="dashboard-chart-skeleton min-h-[250px]" />
}

const emptyData = { users: 0, employers: 0, jobs: 0, applications: 0, months: [] }

function relativeTime(value) {
  if (!value) return 'Time unavailable'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Time unavailable'
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000))
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  if (minutes < 1440) return `${Math.floor(minutes / 60)} hr ago`
  return date.toLocaleDateString()
}

function makeComposition(overview = {}) {
  const candidates = Number(overview.total_candidates || 0)
  const recruiters = Number(overview.total_recruiters || 0)
  const other = Math.max(0, Number(overview.total_users || 0) - candidates - recruiters)
  const total = candidates + recruiters + other
  if (!total) return []
  return [
    { label: 'Candidates', count: candidates, color: 'var(--teal)' },
    { label: 'Recruiters', count: recruiters, color: 'var(--gold)' },
    { label: 'Other accounts', count: other, color: 'var(--brick)' },
  ].filter((item) => item.count > 0).map((item) => ({
    label: item.label,
    pct: Math.round((item.count / total) * 100),
    color: item.color,
  }))
}

export default function Dashboard() {
  const [data, setData] = useState(emptyData)
  const [recentUsers, setRecentUsers] = useState([])
  const [recentJobs, setRecentJobs] = useState([])
  const [userComposition, setUserComposition] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [error, setError] = useState('')

  const loadAdminData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [overview, reports, usersResponse, jobsResponse, activityResponse] = await Promise.all([
        api.getAdminOverview(),
        api.getAdminReports(),
        api.getAdminUsers({ page: 1, size: 100 }),
        api.getAdminJobs({ page: 1, size: 100 }),
        api.getActivityLogs(6).catch(() => ({ items: [] })),
      ])
      const users = Array.isArray(usersResponse) ? usersResponse : (usersResponse?.items || [])
      const jobs = Array.isArray(jobsResponse) ? jobsResponse : (jobsResponse?.items || [])

      setData({
        users: overview.total_candidates ?? 0,
        employers: overview.verified_recruiters ?? 0,
        jobs: overview.active_jobs ?? 0,
        applications: overview.active_applications ?? 0,
        months: reports?.applications || [],
      })
      setRecentUsers(users.slice(0, 5))
      setRecentJobs(jobs.slice(0, 5))
      setUserComposition(makeComposition(overview))
      const activityItems = Array.isArray(activityResponse) ? activityResponse : (activityResponse?.items || activityResponse?.logs || [])
      setRecentActivity(activityItems.slice(0, 6).map((item) => ({
        color: item.type === 'moderation' ? 'gold' : item.type === 'security' ? 'brick' : 'teal',
        title: item.title || item.action || 'Platform event',
        meta: item.meta || item.description || '',
        time: relativeTime(item.created_at || item.timestamp || item.time),
      })))
    } catch (err) {
      setError(err.message || 'Failed to refresh admin dashboard data.')
    } finally {
      setLoading(false)
      setHasLoaded(true)
    }
  }, [])

  useEffect(() => { loadAdminData() }, [loadAdminData])

  const monthData = data.months.map((month) => ({
    month: (month.month || '').slice(5),
    height: Math.max(5, month.count || 0),
    alt: false,
  }))

  return (
    <section className="view active">
      <div className="section-head">
        <div><p>Live dashboard data</p></div>
        <button className="btn btn-primary admin-refresh-button" type="button" onClick={loadAdminData} disabled={loading} aria-label="Refresh admin dashboard data">
          <RefreshCw size={15} className={loading ? 'admin-refresh-spin' : ''} aria-hidden="true" />
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <>
          <div className="stat-row">
            <div className="dashboard-stat-slot min-h-[250px]"><StatCard label="Total candidates" value={hasLoaded ? data.users.toLocaleString() : '—'} delta="Live from backend" trend="up" accent="teal" /></div>
            <div className="dashboard-stat-slot min-h-[250px]"><StatCard label="Registered employers" value={hasLoaded ? data.employers.toLocaleString() : '—'} delta="Live from backend" trend="up" accent="gold" /></div>
            <div className="dashboard-stat-slot min-h-[250px]"><StatCard label="Active job posts" value={hasLoaded ? data.jobs.toLocaleString() : '—'} delta="Live from backend" trend="up" accent="brick" /></div>
            <div className="dashboard-stat-slot min-h-[250px]"><StatCard label="Applications" value={hasLoaded ? data.applications.toLocaleString() : '—'} delta="Live from backend" trend="up" accent="navy" /></div>
          </div>
          <div className="grid-2">
            <div className="panel">
              <h3>Monthly application volume</h3>
              <div className="sub">Application activity across the platform</div>
              <div className="dashboard-chart-slot min-h-[250px]">
                {monthData.length ? <Suspense fallback={<ChartSkeleton />}><BarChart data={monthData} /></Suspense> : <div className="dashboard-empty-chart min-h-[250px]"><p>{hasLoaded ? 'No monthly application data yet.' : 'Loading chart data...'}</p></div>}
              </div>
            </div>
            <div className="panel">
              <h3>User composition</h3>
              <div className="sub">Current registered account mix</div>
              <div className="dashboard-chart-slot min-h-[250px]">{userComposition.length ? <Suspense fallback={<ChartSkeleton />}><Donut segments={userComposition} /></Suspense> : <div className="dashboard-empty-chart min-h-[250px]"><p>{hasLoaded ? 'No account composition data yet.' : 'Loading chart data...'}</p></div>}</div>
            </div>
          </div>
          <div className="grid-2">
            <div className="panel">
              <h3>Recent accounts</h3>
              <div className="sub">Latest users returned by the admin API</div>
              {recentUsers.length ? recentUsers.map((account) => <div className="activity-log-row" key={account.id || account._id || account.email}>
                <div><strong>{account.full_name || account.name || account.email || 'Unnamed user'}</strong><div className="sub">{account.email || account.phone || 'No contact listed'} · {account.role || 'user'}</div></div>
              </div>) : <p>No users returned.</p>}
            </div>
            <div className="panel">
              <h3>Recent job listings</h3>
              <div className="sub">Latest postings returned by the admin API</div>
              {recentJobs.length ? recentJobs.map((job) => <div className="activity-log-row" key={job.id || job._id || job.title}>
                <div><strong>{job.title || 'Untitled job'}</strong><div className="sub">{job.company_name || job.company || 'Company not provided'} · {job.location || 'Location not listed'}</div></div>
              </div>) : <p>No job listings returned.</p>}
            </div>
          </div>
          <div className="panel activity-panel">
            <h3>Recent platform activity</h3>
            <div className="sub">The latest events across MyCareerPath</div>
            <div className="dashboard-chart-slot min-h-[250px]">{recentActivity.length ? <Suspense fallback={<ChartSkeleton />}><ActivityFeed items={recentActivity} /></Suspense> : <div className="dashboard-empty-chart min-h-[250px]"><p>{hasLoaded ? 'No recent platform activity.' : 'Loading activity...'}</p></div>}</div>
          </div>
      </>
    </section>
  )
}
