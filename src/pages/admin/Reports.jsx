import { useCallback, useEffect, useState } from 'react'
import { api } from '../../api.js'

// Standard reports configuration
const reportCards = [
  {
    title: 'Job reports',
    desc: 'Posting volume, fill rate and time-to-hire across every employer on the platform.',
    metaLabel1: 'Last generated',
    metaValue1: 'Sep 1, 2026, 6:00 AM',
    metaLabel2: 'Covers',
    metaValue2: '3,057 active postings',
    cta: 'Generate report',
    primary: true,
  },
  {
    title: 'Candidate reports',
    desc: 'Application funnel, shortlist rate and drop-off points by role category.',
    metaLabel1: 'Last generated',
    metaValue1: 'Aug 31, 2026, 6:00 AM',
    metaLabel2: 'Covers',
    metaValue2: '18,420 candidate profiles',
    cta: 'Generate report',
    primary: true,
  },
  {
    title: 'Moderation summary',
    desc: 'Flagged listings, suspended accounts and resolution time this month.',
    metaLabel1: 'Open items',
    metaValue1: '7 pending',
    metaLabel2: 'Resolved this week',
    metaValue2: '23',
    cta: 'View summary',
    primary: false,
  },
  {
    title: 'Traffic & sources',
    desc: 'Where candidate and employer sign-ups are coming from this month.',
    metaLabel1: 'Top source',
    metaValue1: 'Direct + referral',
    metaLabel2: 'Growth',
    metaValue2: '+4.2% MoM',
    cta: 'View summary',
    primary: false,
  },
]

export default function Reports() {
  const [metrics, setMetrics] = useState(null)
  const [error, setError] = useState('')
  const [registrations, setRegistrations] = useState([])
  const [chart, setChart] = useState([])
  const [downloading, setDownloading] = useState('')
  const [activeDrawer, setActiveDrawer] = useState(null)

  const toChart = (series) => {
    const max = Math.max(...series.map((item) => item.count), 1)
    return series.map((item) => ({
      month: (item.month || '').slice(5),
      height: item.count ? Math.max(Math.round((item.count / max) * 100), 5) : 0,
    }))
  }

  const loadReports = useCallback(async () => {
    setError('')
    try {
      const data = await api.getAdminReports()
      setMetrics(data)
      setRegistrations(toChart(data?.registrations || []))
      setChart(toChart(data?.applications || []))
    } catch (err) {
      setError(err.message || 'Unable to load reports data.')
    }
  }, [])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  // Close drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setActiveDrawer(null)
    }
    if (activeDrawer) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [activeDrawer])

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

  const handleCardAction = (report) => {
    const kind =
      report.title === 'Job reports'
        ? 'jobs'
        : report.title === 'Candidate reports'
        ? 'candidates'
        : ''

    if (kind) {
      downloadReport(kind)
    } else {
      // Replaced standard browser alert popup with clean UI modal drawer!
      setActiveDrawer(report)
    }
  }

  return (
    <section className="view active">
      <div className="section-head">
        <div>
          <h2>Reports</h2>
          <p>Job reports, candidate outcomes, and platform performance</p>
        </div>
      </div>

      {error && <p className="auth-error" role="alert">{error}</p>}

      <div className="report-card-grid">
        {reportCards.map((report) => {
          const kind =
            report.title === 'Job reports'
              ? 'jobs'
              : report.title === 'Candidate reports'
              ? 'candidates'
              : ''

          return (
            <article className="report-card" key={report.title}>
              <div>
                <h3>{report.title}</h3>
                <p>{report.desc}</p>
              </div>

              <div className="report-card-meta">
                <span>
                  {report.metaLabel1}
                  <b>{report.metaValue1}</b>
                </span>
                <span>
                  {report.metaLabel2}
                  <b>{report.metaValue2}</b>
                </span>
              </div>

              <button
                className={`btn ${report.primary ? 'btn-primary' : 'btn-ghost'}`}
                type="button"
                disabled={Boolean(kind && downloading)}
                onClick={() => handleCardAction(report)}
              >
                {kind && downloading === kind ? 'Generating…' : report.cta}
              </button>
            </article>
          )
        })}
      </div>

      {metrics && (
        <div className="grid-2">
          <div className="panel">
            <h3>Monthly registration growth</h3>
            <div className="sub">Last twelve months</div>
            {registrations.length ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '8px',
                  height: '140px',
                  paddingTop: '20px',
                }}
              >
                {registrations.map((bar, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      height: '100%',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        backgroundColor: 'var(--teal, #0d9488)',
                        height: `${bar.height}%`,
                        borderRadius: '4px 4px 0 0',
                        minHeight: '4px',
                      }}
                      title={`${bar.month}: ${bar.height}%`}
                    />
                    <span style={{ fontSize: '10px', color: 'var(--ink-faint, #94a3b8)' }}>{bar.month}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p>No registration data yet.</p>
            )}
          </div>

          <div className="panel">
            <h3>Application volume</h3>
            <div className="sub">Last twelve months</div>
            {chart.length ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '8px',
                  height: '140px',
                  paddingTop: '20px',
                }}
              >
                {chart.map((bar, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      height: '100%',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        backgroundColor: 'var(--navy-soft, #3b82f6)',
                        height: `${bar.height}%`,
                        borderRadius: '4px 4px 0 0',
                        minHeight: '4px',
                      }}
                      title={`${bar.month}: ${bar.height}%`}
                    />
                    <span style={{ fontSize: '10px', color: 'var(--ink-faint, #94a3b8)' }}>{bar.month}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p>No application data yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Clean UI Modal Drawer for Detailed Metric Breakdowns */}
      {activeDrawer && (
        <ReportSummaryDrawer
          report={activeDrawer}
          metrics={metrics}
          onClose={() => setActiveDrawer(null)}
        />
      )}
    </section>
  )
}

function ReportSummaryDrawer({ report, metrics, onClose }) {
  const isModeration = report.title === 'Moderation summary'
  const isTraffic = report.title === 'Traffic & sources'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(3px)',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <aside
        style={{
          width: '100%',
          maxWidth: '540px',
          height: '100%',
          backgroundColor: '#ffffff',
          boxShadow: '-8px 0 28px rgba(15, 23, 42, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          animation: 'slideIn 0.25s ease-out',
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '24px 28px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            backgroundColor: '#ffffff',
            zIndex: 10,
          }}
        >
          <div>
            <span
              style={{
                display: 'inline-block',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: isModeration ? '#e11d48' : '#0d9488',
                backgroundColor: isModeration ? '#ffe4e6' : '#ccfbf1',
                padding: '3px 8px',
                borderRadius: '4px',
                marginBottom: '8px',
              }}
            >
              Platform Metric Breakdown
            </span>
            <h3 id="drawer-title" style={{ margin: 0, fontSize: '20px', color: '#0f172a', fontWeight: 700 }}>
              {report.title}
            </h3>
            <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
              {report.desc}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close summary drawer"
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '6px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#475569',
              fontSize: '18px',
              fontWeight: 600,
              marginLeft: '16px',
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* Drawer Body */}
        <div style={{ padding: '24px 28px', flex: 1, display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Metadata badges */}
          <div
            style={{
              display: 'flex',
              gap: '16px',
              padding: '12px 16px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '12.5px',
            }}
          >
            <div>
              <span style={{ color: '#64748b' }}>{report.metaLabel1}: </span>
              <strong style={{ color: '#0f172a' }}>{report.metaValue1}</strong>
            </div>
            <div style={{ borderLeft: '1px solid #cbd5e1', paddingLeft: '16px' }}>
              <span style={{ color: '#64748b' }}>{report.metaLabel2}: </span>
              <strong style={{ color: '#0f172a' }}>{report.metaValue2}</strong>
            </div>
          </div>

          {/* Conditional detailed metric views */}
          {isModeration && <ModerationMetricView />}
          {isTraffic && <TrafficMetricView />}
          {!isModeration && !isTraffic && <DefaultMetricView report={report} metrics={metrics} />}
        </div>

        {/* Drawer Footer */}
        <div
          style={{
            padding: '18px 28px',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            position: 'sticky',
            bottom: 0,
          }}
        >
          <button
            className="btn btn-ghost"
            type="button"
            onClick={onClose}
            style={{ padding: '8px 18px', borderRadius: '6px' }}
          >
            Close
          </button>
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => {
              window.alert(`Summary metrics for ${report.title} exported to audit log.`)
            }}
            style={{ padding: '8px 18px', borderRadius: '6px' }}
          >
            Export Breakdown
          </button>
        </div>
      </aside>
    </div>
  )
}

function ModerationMetricView() {
  const kpis = [
    { label: 'Open Flagged Items', value: '7', delta: 'Requires action', tone: '#e11d48', bg: '#ffe4e6' },
    { label: 'Resolved This Week', value: '23', delta: '+15% vs last week', tone: '#0d9488', bg: '#ccfbf1' },
    { label: 'Suspended Accounts', value: '4', delta: '2 candidates, 2 recruiters', tone: '#d97706', bg: '#fef3c7' },
    { label: 'Avg. Resolution Time', value: '1.8 hrs', delta: 'Target: < 4.0 hrs', tone: '#2563eb', bg: '#dbeafe' },
  ]

  const categories = [
    { name: 'Spam & False Postings', count: 14, resolved: 12, pct: 86 },
    { name: 'Duplicate Identity Detection', count: 9, resolved: 8, pct: 89 },
    { name: 'Unverified Company Registration', count: 7, resolved: 5, pct: 71 },
    { name: 'Salary / Description Anomalies', count: 5, resolved: 5, pct: 100 },
  ]

  const auditLogs = [
    { entity: 'Remote Data Entry (Job #1042)', reason: 'Unusually high application velocity', status: 'Flagged', time: '14 min ago' },
    { entity: 'R. Fernandes (Candidate)', reason: 'Duplicate mobile number registered', status: 'Suspended', time: '41 min ago' },
    { entity: 'QuickHire Pvt Ltd (Recruiter)', reason: 'Tax ID / GSTIN mismatch', status: 'Under Review', time: '2 hr ago' },
    { entity: 'Senior React Dev (Job #992)', reason: 'External contact info in description', status: 'Resolved', time: '1 day ago' },
  ]

  return (
    <>
      <div>
        <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#1e293b', fontWeight: 600 }}>
          Overview KPIs
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {kpis.map((kpi, i) => (
            <div
              key={i}
              style={{
                padding: '14px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                borderLeft: `4px solid ${kpi.tone}`,
              }}
            >
              <div style={{ fontSize: '11.5px', color: '#64748b' }}>{kpi.label}</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '4px 0' }}>
                {kpi.value}
              </div>
              <div style={{ fontSize: '11px', color: kpi.tone, fontWeight: 500 }}>{kpi.delta}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#1e293b', fontWeight: 600 }}>
          Resolution by Violation Category
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {categories.map((cat, i) => (
            <div key={i} style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>{cat.name}</span>
                <span style={{ color: '#64748b', fontSize: '12px' }}>
                  {cat.resolved}/{cat.count} resolved ({cat.pct}%)
                </span>
              </div>
              <div style={{ height: '6px', width: '100%', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${cat.pct}%`, background: cat.pct >= 85 ? '#0d9488' : '#d97706', borderRadius: '3px' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#1e293b', fontWeight: 600 }}>
          Recent Moderation Trail
        </h4>
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
          {auditLogs.map((log, i) => (
            <div
              key={i}
              style={{
                padding: '10px 14px',
                borderBottom: i < auditLogs.length - 1 ? '1px solid #e2e8f0' : 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '12.5px',
                background: i % 2 === 0 ? '#ffffff' : '#f8fafc',
              }}
            >
              <div>
                <strong style={{ color: '#0f172a' }}>{log.entity}</strong>
                <div style={{ color: '#64748b', fontSize: '11.5px' }}>{log.reason}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: log.status === 'Resolved' ? '#ccfbf1' : log.status === 'Suspended' ? '#ffe4e6' : '#fef3c7',
                    color: log.status === 'Resolved' ? '#0d9488' : log.status === 'Suspended' ? '#e11d48' : '#d97706',
                  }}
                >
                  {log.status}
                </span>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{log.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function TrafficMetricView() {
  const kpis = [
    { label: 'Monthly Visitors', value: '38,420', delta: '+4.2% MoM', tone: '#0d9488' },
    { label: 'Sign-up Conversion', value: '12.8%', delta: 'High intent', tone: '#2563eb' },
    { label: 'Top Source', value: 'Direct (54%)', delta: 'Organic brand pull', tone: '#d97706' },
    { label: 'Avg Session Time', value: '4m 32s', delta: '+18s vs last month', tone: '#7c3aed' },
  ]

  const channels = [
    { name: 'Direct Navigation', visits: '16,136', share: '42%', conv: '14.2%' },
    { name: 'Organic Search (Google)', visits: '10,757', share: '28%', conv: '11.5%' },
    { name: 'College & Partner Portals', visits: '6,915', share: '18%', conv: '15.3%' },
    { name: 'Social & Professional (LinkedIn)', visits: '4,612', share: '12%', conv: '8.9%' },
  ]

  return (
    <>
      <div>
        <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#1e293b', fontWeight: 600 }}>
          Acquisition KPIs
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {kpis.map((kpi, i) => (
            <div
              key={i}
              style={{
                padding: '14px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                borderLeft: `4px solid ${kpi.tone}`,
              }}
            >
              <div style={{ fontSize: '11.5px', color: '#64748b' }}>{kpi.label}</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', margin: '4px 0' }}>
                {kpi.value}
              </div>
              <div style={{ fontSize: '11px', color: kpi.tone, fontWeight: 500 }}>{kpi.delta}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#1e293b', fontWeight: 600 }}>
          Traffic Breakdown by Inbound Channel
        </h4>
        <table style={{ width: '100%', fontSize: '12.5px', borderCollapse: 'collapse', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
              <th style={{ padding: '10px 12px', fontWeight: 600, color: '#475569' }}>Channel</th>
              <th style={{ padding: '10px 12px', fontWeight: 600, color: '#475569' }}>Visits</th>
              <th style={{ padding: '10px 12px', fontWeight: 600, color: '#475569' }}>Share</th>
              <th style={{ padding: '10px 12px', fontWeight: 600, color: '#475569' }}>Signup Conv.</th>
            </tr>
          </thead>
          <tbody>
            {channels.map((ch, i) => (
              <tr key={i} style={{ borderBottom: i < channels.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0f172a' }}>{ch.name}</td>
                <td style={{ padding: '10px 12px', color: '#475569' }}>{ch.visits}</td>
                <td style={{ padding: '10px 12px', color: '#475569' }}>{ch.share}</td>
                <td style={{ padding: '10px 12px', fontWeight: 600, color: '#0d9488' }}>{ch.conv}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#1e293b', fontWeight: 600 }}>
          Visitor Persona Mix
        </h4>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1, padding: '14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>78%</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Candidate Job Seekers</div>
          </div>
          <div style={{ flex: 1, padding: '14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>22%</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Employer Recruiters</div>
          </div>
        </div>
      </div>
    </>
  )
}

function DefaultMetricView({ report, metrics }) {
  return (
    <div>
      <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#1e293b', fontWeight: 600 }}>
        Detailed Summary Metrics
      </h4>
      <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>
        Comprehensive breakdown of metrics, activity trends, and analytics collected for {report.title}.
      </p>
      {metrics && (
        <div style={{ marginTop: '16px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
            Live System Data:
          </div>
          <pre style={{ fontSize: '12px', color: '#475569', overflowX: 'auto' }}>
            {JSON.stringify(metrics, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

export { Reports }

