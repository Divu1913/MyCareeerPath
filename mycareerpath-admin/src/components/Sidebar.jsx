import { navItems } from '../data.js'
import { navIcons as icons } from './Icons.jsx'

export default function Sidebar({ active, onNavigate, user }) {
  const groups = [...new Set(navItems.map((n) => n.group))]

  return (
    <aside className="sidebar">
      <div className="brand-block flex items-center gap-3">
        <img
          src="/assets/logo.png"
          alt="MyCareerPath Logo"
          style={{ height: '36px', width: 'auto', borderRadius: '6px', objectFit: 'contain' }}
        />
        <div>
          <div className="brand">MyCareer<span>Path</span></div>
          <div className="brand-sub">Admin control center</div>
        </div>
      </div>

      <nav className="nav">
        {groups.map((group) => (
          <div key={group}>
            <div className="nav-group-label">{group}</div>
            {navItems
              .filter((n) => n.group === group)
              .map((item) => {
                const Icon = icons[item.key] || icons.dashboard
                return (
                  <div
                    key={item.key}
                    className={`nav-item${active === item.key ? ' active' : ''}`}
                    onClick={() => onNavigate(item.key)}
                  >
                    <span className="nav-ic"><Icon /></span>
                    {item.label}
                  </div>
                )
              })}
          </div>
        ))}
      </nav>

      <div className="sidebar-foot">
        Signed in as <b>{user?.full_name || user?.email || 'Priya Sharma'}</b>
        <br />
        Platform Administrator
      </div>
    </aside>
  )
}
