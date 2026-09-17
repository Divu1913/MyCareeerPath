import { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Topbar from './components/Topbar.jsx'
import Dashboard from './views/Dashboard.jsx'
import Users from './views/Users.jsx'
import Jobs from './views/Jobs.jsx'
import Activity from './views/Activity.jsx'
import Reports from './views/Reports.jsx'
import System from './views/System.jsx'
import Approvals from './views/Approvals.jsx'
import { pageMeta } from './data.js'
import './App.css'
import { api } from './api.js'

const views = {
  dashboard: Dashboard,
  users: Users,
  approvals: Approvals,
  jobs: Jobs,
  activity: Activity,
  reports: Reports,
  system: System,
}

export default function App() {
  const [active, setActive] = useState('dashboard')
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authError, setAuthError] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [method, setMethod] = useState('email')
  const [code, setCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [devCode, setDevCode] = useState('')
  const View = views[active]
  const [title, subtitle] = pageMeta[active]

  useEffect(() => {
    if (!localStorage.getItem(api.tokenKey)) { setAuthLoading(false); return undefined }
    api.getMe().then((me) => {
      if (me?.role === 'admin' || me?.is_superuser) setUser(me)
      else { api.clearToken(); setAuthError('Admin access is required.') }
    }).catch(() => api.clearToken()).finally(() => setAuthLoading(false))
  }, [])

  async function requestOtp(event) {
    event.preventDefault(); setAuthError('')
    try { const result = await api.login(identifier, 'email'); setOtpSent(true); setDevCode(result.dev_code || '') }
    catch (error) { setAuthError(error.message) }
  }

  async function verifyOtp(event) {
    event.preventDefault(); setAuthError('')
    try { const result = await api.verifyOtp(identifier, code); const me = await api.getMe(); if (me?.role !== 'admin' && !me?.is_superuser) throw new Error('Admin access is required.'); setUser(me); setActive('dashboard'); if (result) setOtpSent(false) }
    catch (error) { api.clearToken(); setAuthError(error.message) }
  }

  if (authLoading) return <div className="auth-screen"><p>Checking admin access...</p></div>
  if (!user) return <AdminAuth identifier={identifier} method={method} code={code} otpSent={otpSent} devCode={devCode} error={authError} setIdentifier={setIdentifier} setMethod={setMethod} setCode={setCode} onRequest={requestOtp} onVerify={verifyOtp} />

  const handleLogout = () => { api.clearToken(); setUser(null); setOtpSent(false); setCode('') }

  return (
    <div className="shell">
      <Sidebar active={active} onNavigate={setActive} />
      <div className="main">
        <Topbar title={title} subtitle={subtitle} user={user} onLogout={handleLogout} />
        <div className="content">
          <View user={user} />
        </div>
        <footer className="admin-footer">© 2026 MyCareerPath. All rights reserved.</footer>
      </div>
    </div>
  )
}

function AdminAuth({ identifier, method, code, otpSent, devCode, error, setIdentifier, setMethod, setCode, onRequest, onVerify }) {
  return <main className="auth-screen"><section className="auth-card"><div className="brand">MyCareer<span>Path</span></div><p className="brand-sub">Admin control center</p><h1>Admin sign in</h1><p>Use your registered email or mobile number. Admin access is verified against the account role.</p>{error && <div className="auth-error" role="alert">{error}</div>}{!otpSent ? <form onSubmit={onRequest}><div className="auth-methods"><button type="button" className={method === 'email' ? 'active' : ''} onClick={() => setMethod('email')}>Email</button><button type="button" className={method === 'phone' ? 'active' : ''} onClick={() => setMethod('phone')}>Mobile</button></div><input type={method === 'email' ? 'email' : 'tel'} inputMode={method === 'email' ? 'email' : 'numeric'} required value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder={method === 'email' ? 'Admin email' : '+91 9876543210'} /><button className="btn btn-primary" type="submit">Send OTP</button></form> : <form onSubmit={onVerify}><input inputMode="numeric" required value={code} onChange={(event) => setCode(event.target.value)} placeholder="6-digit OTP" /><button className="btn btn-primary" type="submit">Verify and continue</button>{devCode && <p className="dev-code">Development OTP: {devCode}</p>}</form>}</section></main>
}
