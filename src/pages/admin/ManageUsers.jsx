import { useCallback, useEffect, useState } from 'react'
import { api } from '../../api.js'

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : '-')

export default function ManageUsers({ user }) {
  const [tab, setTab] = useState('candidate')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Helper to ensure Bearer auth token is reliably extracted from all standard storage keys
  const getAdminToken = () =>
    localStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('mcp_access_token') ||
    localStorage.getItem('mcp_admin_token') ||
    ''

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      // Ensure requests explicitly target /api/v1/admin/users with Authorization: Bearer <token>
      const token = getAdminToken()
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }

      // Try primary API helper targeting /api/v1/admin/users
      let data
      try {
        data = await api.getAdminUsers({ page: 1, size: 500, role: tab })
      } catch (clientErr) {
        // Fallback to direct fetch to /api/v1/admin/users with Bearer header if helper encounters network issue
        const baseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE || 'http://localhost:8000'
        const endpoint = `${baseUrl}/api/v1/admin/users?page=1&size=500&role=${encodeURIComponent(tab)}`
        
        let response
        try {
          response = await fetch(endpoint, { headers })
        } catch (fetchErr) {
          // If custom host fails to fetch, attempt localhost fallback
          response = await fetch(`http://localhost:8000/api/v1/admin/users?page=1&size=500&role=${encodeURIComponent(tab)}`, { headers })
        }

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}))
          throw new Error(errData?.detail || errData?.message || `Request failed with status ${response.status}`)
        }
        data = await response.json()
      }

      const list = Array.isArray(data) ? data : data?.users || data?.candidates || data?.items || []
      setUsers(list)
    } catch (err) {
      console.error('Error fetching admin users:', err)
      setUsers([])
      setError(err.message || 'Failed to fetch users.')
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  async function toggleStatus(userRecord) {
    const id = userRecord._id || userRecord.id
    try {
      const updated = await api.updateAdminUser(id, { is_active: !userRecord.is_active })
      setUsers((current) =>
        current.map((item) => ((item._id || item.id) === id ? { ...item, ...updated, is_active: !userRecord.is_active } : item)),
      )
    } catch (err) {
      setError(err.message || 'Failed to update user status.')
    }
  }

  async function toggleRole(userRecord) {
    const id = userRecord._id || userRecord.id
    const targetRole = userRecord.role === 'candidate' ? 'recruiter' : 'candidate'
    if (!window.confirm(`Change account role to ${targetRole}?`)) return
    try {
      const updated = await api.updateAdminUser(id, { role: targetRole })
      setUsers((current) =>
        current.map((item) => ((item._id || item.id) === id ? { ...item, ...updated, role: targetRole } : item)),
      )
    } catch (err) {
      setError(err.message || 'Failed to update user role.')
    }
  }

  async function remove(userRecord) {
    const id = userRecord._id || userRecord.id
    if (!window.confirm(`Delete ${userRecord.full_name || userRecord.email || 'this user'} permanently?`)) return
    try {
      await api.deleteAdminUser(id)
      setUsers((current) => current.filter((item) => (item._id || item.id) !== id))
    } catch (err) {
      setError(err.message || 'Failed to delete user.')
    }
  }

  return (
    <section className="view active">
      <div className="section-head">
        <div>
          <h2>Manage users</h2>
          <p>Review candidate and employer accounts across the platform</p>
        </div>
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => window.alert('Admin invitations are sent from the platform security console.')}
        >
          + Invite admin
        </button>
      </div>

      <div className="tabs">
        <div className={`tab${tab === 'candidate' ? ' active' : ''}`} onClick={() => setTab('candidate')}>
          Candidates
        </div>
        <div className={`tab${tab === 'recruiter' ? ' active' : ''}`} onClick={() => setTab('recruiter')}>
          Recruiters
        </div>
      </div>

      {error && <p className="auth-error" role="alert">{error}</p>}

      <div className="panel">
        {loading ? (
          <p>Loading users...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{tab === 'candidate' ? 'Candidate' : 'Recruiter'}</th>
                <th>Email</th>
                <th>Applications</th>
                <th>Joined</th>
                <th>Role / status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((userRecord) => {
                const id = userRecord._id || userRecord.id
                const name = userRecord.full_name || userRecord.company_name || userRecord.company || 'Unnamed user'
                const initials = (name || userRecord.email || '?').slice(0, 2).toUpperCase()
                const isActive = userRecord.is_active !== false
                const isPendingKyc = Boolean(userRecord.pending_kyc)
                const tone = !isActive ? 'brick' : isPendingKyc ? 'gold' : 'teal'
                const statusLabel = isPendingKyc ? 'Pending KYC' : !isActive ? 'Suspended' : 'Active'

                return (
                  <tr key={id}>
                    <td>
                      <div className="person" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          className="p-avatar"
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: 'var(--navy-soft, #334155)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 600,
                            fontSize: '13px',
                          }}
                        >
                          {initials}
                        </div>
                        <div>
                          <div className="p-name" style={{ fontWeight: 600, color: 'var(--navy, #0f172a)' }}>
                            {name}
                          </div>
                          <div className="p-sub" style={{ fontSize: '12px', color: 'var(--ink-soft, #64748b)' }}>
                            {userRecord.company_name || userRecord.company
                              ? `Company: ${userRecord.company_name || userRecord.company}`
                              : userRecord.headline || userRecord.role}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{userRecord.email || userRecord.registered_email || userRecord.phone || '-'}</td>
                    <td>{userRecord.applications_count ?? userRecord.applications ?? 0}</td>
                    <td>{formatDate(userRecord.created_at)}</td>
                    <td>
                      <span className={`tag tag-${tone}`}>{statusLabel}</span>
                    </td>
                    <td className="row-actions">
                      <button className="btn btn-ghost" onClick={() => toggleRole(userRecord)}>
                        Make {userRecord.role === 'candidate' ? 'recruiter' : 'candidate'}
                      </button>
                      <button className="btn btn-ghost" onClick={() => toggleStatus(userRecord)}>
                        {userRecord.is_active === false ? 'Activate' : 'Suspend'}
                      </button>
                      <button className="btn btn-ghost" onClick={() => remove(userRecord)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        {!loading && users.length === 0 && <p>No users found.</p>}
      </div>
    </section>
  )
}

export { ManageUsers }

