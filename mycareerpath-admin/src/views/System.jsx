import { useEffect, useState } from 'react'
import { api } from '../../../src/api.js'

export default function System() {
  const [health, setHealth] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.health().then(setHealth).catch((err) => setError(err.message || 'Could not reach the backend health endpoint.'))
  }, [])

  const backendStatus = error ? 'Unavailable' : health?.status === 'healthy' ? 'Operational' : 'Checking'

  return (
    <section className="view active">
      <div className="section-head">
        <div><h2>System health</h2><p>Values shown here come from the backend health endpoint.</p></div>
      </div>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <div className="sys-grid">
        <div className="sys-card">
          <div className="sys-top"><div><div className="sys-name">Backend API</div><div className="sys-detail">Application service health</div></div><div className="status-pill"><span className="dot" style={{ background: backendStatus === 'Operational' ? 'var(--teal)' : 'var(--gold)' }} />{backendStatus}</div></div>
          <div className="sys-detail">{health ? `${health.service || 'MyCareerPath'} · version ${health.version || 'unknown'}` : 'Waiting for live health response'}</div>
        </div>
        <div className="sys-card">
          <div className="sys-top"><div><div className="sys-name">Database</div><div className="sys-detail">MongoDB connection status</div></div><div className="status-pill">Not reported</div></div>
          <div className="sys-detail">The current health endpoint does not verify database connectivity.</div>
        </div>
        <div className="sys-card">
          <div className="sys-top"><div><div className="sys-name">Authentication</div><div className="sys-detail">OTP and account services</div></div><div className="status-pill">Not reported</div></div>
          <div className="sys-detail">Authentication service telemetry is not available from the current health endpoint.</div>
        </div>
      </div>
      <div className="panel settings-panel">
        <h3>Platform settings</h3>
        <div className="sub">No live settings endpoint is connected. This page does not change platform configuration.</div>
      </div>
    </section>
  )
}
