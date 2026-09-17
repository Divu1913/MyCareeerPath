import { useEffect, useState } from 'react'
import Tag from '../components/Tag.jsx'

const formatDate = (value) => value ? new Date(value).toLocaleDateString() : '-'

export default function Users({ user }) {
  const [tab, setTab] = useState('candidate')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    // Import the main app's API dynamically
    import('../../../src/api.js').then(({ api }) => {
      api.getAdminUsers({ page: 1, size: 500, role: tab })
        .then((data) => setUsers(Array.isArray(data) ? data : data?.items || []))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false))
    }).catch((err) => {
      setError(err.message)
      setLoading(false)
    })
  }

  useEffect(load, [tab])

  async function toggle(userRecord) {
    try {
      // Import the API
      const { api } = await import('../../../src/api.js')
      const updated = await api.updateAdminUser(userRecord._id || userRecord.id, { is_active: !userRecord.is_active })
      setUsers((current) => current.map((item) => (item._id || item.id) === (userRecord._id || userRecord.id) ? updated : item))
    } catch (err) {
      setError(err.message)
    }
  }

  async function toggleRole(userRecord) {
    const role = userRecord.role === 'candidate' ? 'recruiter' : 'candidate'
    if (!window.confirm(`Change this account to ${role}?`)) return
    try {
      const { api } = await import('../../../src/api.js')
      const updated = await api.updateAdminUser(userRecord._id || userRecord.id, { role })
      setUsers((current) => current.map((item) => (item._id || item.id) === (userRecord._id || userRecord.id) ? updated : item))
    } catch (err) {
      setError(err.message)
    }
  }

  async function remove(userRecord) {
    if (!window.confirm(`Delete ${userRecord.full_name || userRecord.email || 'this user'}?`)) return
    try {
      const { api } = await import('../../../src/api.js')
      await api.deleteAdminUser(userRecord._id || userRecord.id)
      setUsers((current) => current.filter((item) => (item._id || item.id) !== (userRecord._id || userRecord.id)))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section className="view active">
      <div className="section-head">
        <div>
          <h2>Manage users</h2>
          <p>Review candidate and employer accounts across the platform</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={() => window.alert('Admin invitations are sent from the platform security console.')}>+ Invite admin</button>
      </div>
      <div className="tabs">
        <div className={`tab${tab === 'candidate' ? ' active' : ''}`} onClick={() => setTab('candidate')}>Candidates</div>
        <div className={`tab${tab === 'recruiter' ? ' active' : ''}`} onClick={() => setTab('recruiter')}>Recruiters</div>
      </div>
      {error && <p className="auth-error">{error}</p>}
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
              {users.map((userRecord) => (
                <tr key={userRecord._id || userRecord.id}>
                  <td>
                    <div className="person">
                      <div className="p-avatar">{(userRecord.full_name || userRecord.email || '?').slice(0, 2).toUpperCase()}</div>
                      <div>
                        <div className="p-name">{userRecord.full_name || userRecord.company_name || userRecord.company || 'Unnamed user'}</div>
                        <div className="p-sub">{userRecord.company_name || userRecord.company ? `Company: ${userRecord.company_name || userRecord.company}` : userRecord.headline || userRecord.role}</div>
                      </div>
                    </div>
                  </td>
                  <td>{userRecord.email || userRecord.registered_email || userRecord.phone || '-'}</td>
                  <td>{userRecord.applications_count ?? userRecord.applications ?? 0}</td>
                  <td>{formatDate(userRecord.created_at)}</td>
                  <td><Tag tone={userRecord.is_active === false ? 'brick' : userRecord.pending_kyc ? 'gold' : 'teal'}>{userRecord.pending_kyc ? 'Pending KYC' : userRecord.is_active === false ? 'Suspended' : 'Active'}</Tag></td>
                  <td className="row-actions">
                    <button className="btn btn-ghost" onClick={() => toggleRole(userRecord)}>Make {userRecord.role === 'candidate' ? 'recruiter' : 'candidate'}</button>
                    <button className="btn btn-ghost" onClick={() => toggle(userRecord)}>{userRecord.is_active === false ? 'Activate' : 'Suspend'}</button>
                    <button className="btn btn-ghost" onClick={() => remove(userRecord)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && users.length === 0 && <p>No users found.</p>}
      </div>
    </section>
  )
}
