import { IconSearch } from './Icons.jsx'

export default function Topbar({ title, subtitle, user, onLogout }) {
  return (
    <div className="topbar">
      <div>
        <h1>{title}</h1>
        <div className="path">{subtitle}</div>
      </div>
      <div className="top-actions">
        <label className="search">
          <IconSearch />
          <input aria-label="Search users, jobs, tickets" placeholder="Search users, jobs, tickets..." />
        </label>
        <div className="avatar-block">
          <div className="avatar">{(user?.full_name || user?.email || 'AD').slice(0, 2).toUpperCase()}</div>
          <div>
            <div className="avatar-name">{user?.full_name || user?.email || 'Priya Sharma'}</div>
            <button type="button" className="avatar-role" onClick={onLogout}>Sign out</button>
          </div>
        </div>
      </div>
    </div>
  )
}
