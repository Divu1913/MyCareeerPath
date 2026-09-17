import { useEffect, useState } from 'react'
import StatCard from '../components/StatCard.jsx'
import BarChart from '../components/BarChart.jsx'
import Donut from '../components/Donut.jsx'
import ActivityFeed from '../components/ActivityFeed.jsx'
import { api } from '../../../src/api.js'
import { activityFeed, userComposition } from '../data.js'

export default function Dashboard({ user }) {
  const [data, setData] = useState({ users: 18420, employers: 1286, jobs: 3057, applications: 642, months: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    Promise.all([api.getAdminOverview(), api.getAdminReports()])
      .then(([overview, reports]) => setData((current) => ({
        ...current,
        users: overview.total_candidates ?? current.users,
        employers: overview.verified_recruiters ?? current.employers,
        jobs: overview.active_jobs ?? current.jobs,
        applications: overview.active_applications ?? current.applications,
        months: reports.applications || []
      })))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [refreshKey])

  const monthData = data.months.map((month) => ({
    month: month.month.slice(5),
    height: Math.max(5, month.count),
    alt: false
  }))

  return (
    <section className="view active">
      <div className="section-head"><div /><button className="btn btn-primary" type="button" onClick={() => setRefreshKey((value) => value + 1)}>🔄 Refresh Data</button></div>
      {error && <p className="auth-error">{error}</p>}
      {loading ? <p>Loading dashboard...</p> : (
        <>
          <div className="stat-row">
            <StatCard label="Total candidates" value={data.users.toLocaleString()} delta="▲ 4.2% this month" trend="up" accent="teal" />
            <StatCard label="Registered employers" value={data.employers.toLocaleString()} delta="▲ 2.8% this month" trend="up" accent="gold" />
            <StatCard label="Active job posts" value={data.jobs.toLocaleString()} delta="▼ 1.1% this week" trend="down" accent="brick" />
            <StatCard label="Applications today" value={data.applications.toLocaleString()} delta="▲ 12.6% vs yesterday" trend="up" accent="navy" />
          </div>
          <div className="grid-2">
            <div className="panel">
              <h3>Monthly application volume</h3>
              <div className="sub">Application activity across the platform</div>
              {monthData.length ? <BarChart data={monthData} /> : <p>No monthly application data yet.</p>}
            </div>
            <div className="panel">
              <h3>User composition</h3>
              <div className="sub">Current registered account mix</div>
              <Donut segments={userComposition} />
            </div>
          </div>
          <div className="panel activity-panel">
            <h3>Recent platform activity</h3>
            <div className="sub">The latest events across MyCareerPath</div>
            <ActivityFeed items={activityFeed} />
          </div>
        </>
      )}
    </section>
  )
}
