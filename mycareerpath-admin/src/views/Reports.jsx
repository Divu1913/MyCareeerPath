import { useCallback, useEffect, useState } from 'react'
import BarChart from '../components/BarChart.jsx'
import { api } from '../../../src/api.js'

function toChart(series = []) {
  const max = Math.max(...series.map((item) => Number(item.count) || 0), 1)
  return series.map((item) => ({
    month: (item.month || '').slice(5),
    height: item.count ? Math.max(Math.round((item.count / max) * 100), 5) : 0,
  }))
}

export default function Reports() {
  const [metrics, setMetrics] = useState(null)
  const [error, setError] = useState('')
  const [registrations, setRegistrations] = useState([])
  const [applications, setApplications] = useState([])
  const [downloading, setDownloading] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const data = await api.getAdminReports()
      setMetrics(data)
      setRegistrations(toChart(data?.registrations))
      setApplications(toChart(data?.applications))
    } catch (err) {
      setError(err.message || 'Unable to load reports data.')
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function downloadReport(kind) {
    setError('')
    setDownloading(kind)
    try {
      const blob = await api.downloadAdminReport(kind)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `mycareerpath-${kind}-report.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.message || 'Unable to generate report.')
    } finally {
      setDownloading('')
    }
  }

  const usage = metrics?.usage || {}
  const reportCards = [
    {
      title: 'Job reports',
      desc: 'Export current job listings and their application totals.',
      label: 'Published job posts',
      value: usage.published_jobs,
      kind: 'jobs',
    },
    {
      title: 'Candidate reports',
      desc: 'Export candidate profiles and their application totals.',
      label: 'Candidate profiles',
      value: usage.candidate_profiles,
      kind: 'candidates',
    },
    {
      title: 'Recruiter accounts',
      desc: 'Live count of recruiter profiles stored in the platform.',
      label: 'Recruiter profiles',
      value: usage.recruiter_profiles,
    },
    {
      title: 'Pending approvals',
      desc: 'Recruiter companies awaiting an administrator decision.',
      label: 'Awaiting review',
      value: usage.pending_company_approvals,
    },
  ]

  return (
    <section className="view active">
      <div className="section-head">
        <div><h2>Reports</h2><p>Live platform totals and downloadable reports</p></div>
        <button className="btn btn-ghost" type="button" onClick={load}>Refresh Data</button>
      </div>

      {error && <p className="auth-error" role="alert">{error}</p>}

      <div className="report-card-grid">
        {reportCards.map((report) => (
          <article className="report-card" key={report.title}>
            <div><h3>{report.title}</h3><p>{report.desc}</p></div>
            <div className="report-card-meta">
              <span>{report.label}<b>{metrics ? Number(report.value || 0).toLocaleString() : 'Loading…'}</b></span>
              <span>Source<b>Live database</b></span>
            </div>
            {report.kind && <button className="btn btn-primary" type="button" disabled={!metrics || Boolean(downloading)} onClick={() => downloadReport(report.kind)}>
              {downloading === report.kind ? 'Generating…' : 'Download CSV'}
            </button>}
          </article>
        ))}
      </div>

      {metrics && <div className="grid-2">
        <div className="panel">
          <h3>Monthly registration growth</h3>
          <div className="sub">Last twelve months</div>
          {registrations.length ? <BarChart data={registrations} /> : <p>No registration data yet.</p>}
        </div>
        <div className="panel">
          <h3>Application volume</h3>
          <div className="sub">Last twelve months</div>
          {applications.length ? <BarChart data={applications} /> : <p>No application data yet.</p>}
        </div>
      </div>}
    </section>
  )
}
