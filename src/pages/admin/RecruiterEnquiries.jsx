import { useCallback, useEffect, useState } from 'react'
import { api } from '../../api.js'

const filters = ['all', 'pending', 'contacted', 'approved']

export default function RecruiterEnquiries() {
  const [enquiries, setEnquiries] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.getAdminSalesEnquiries(filter)
      setEnquiries(data?.enquiries || [])
    } catch (err) {
      setError(err.message || 'Unable to load recruiter enquiries.')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    load()
  }, [load])

  // Lock approved/contacted recruiter statuses so they remain static once marked as approved/contacted
  async function updateStatus(enquiry, newStatus) {
    const id = enquiry._id || enquiry.id
    const currentStatus = enquiry.status || 'pending'

    // Static lock: never allow updating an already approved or contacted enquiry
    if (currentStatus === 'approved' || currentStatus === 'contacted' || currentStatus === 'resolved') {
      return
    }

    setUpdatingId(id)
    setError('')
    try {
      await api.updateAdminSalesEnquiryStatus(id, newStatus)
      setEnquiries((current) =>
        current.map((item) =>
          (item._id || item.id) === id ? { ...item, status: newStatus } : item,
        ),
      )
    } catch (err) {
      setError(err.message || 'Unable to update this enquiry.')
    } finally {
      setUpdatingId('')
    }
  }

  return (
    <section className="view active">
      <div className="section-head">
        <div>
          <h2>Recruiter sales enquiries</h2>
          <p>Manage callback requests submitted by employers and track recruiter onboarding statuses</p>
        </div>
        <button className="btn btn-ghost" type="button" onClick={load} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div className="tabs" aria-label="Enquiry status filter">
        {filters.map((status) => (
          <button
            key={status}
            type="button"
            className={`tab${filter === status ? ' active' : ''}`}
            onClick={() => setFilter(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {error && (
        <p className="auth-error" role="alert">
          {error}
        </p>
      )}

      <div className="panel">
        {loading ? (
          <p>Loading enquiries...</p>
        ) : enquiries.length === 0 ? (
          <p>No enquiries found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Full name</th>
                <th>Work email</th>
                <th>Mobile number</th>
                <th>Hiring type</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.map((enquiry) => {
                const id = enquiry._id || enquiry.id
                const status = enquiry.status || 'pending'
                const isApproved = status === 'approved'
                const isContacted = status === 'contacted'
                const isResolved = status === 'resolved'
                const isLocked = isApproved || isContacted || isResolved

                const tone = isApproved || isContacted ? 'teal' : isResolved ? 'flat' : 'gold'

                return (
                  <tr key={id}>
                    <td>
                      <b>{enquiry.full_name || '-'}</b>
                    </td>
                    <td>{enquiry.work_email || '-'}</td>
                    <td>{enquiry.mobile_number || '-'}</td>
                    <td>{enquiry.hiring_for || '-'}</td>
                    <td>
                      <span className={`tag tag-${tone}`}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                        {isLocked && ' 🔒'}
                      </span>
                    </td>
                    <td className="row-actions">
                      {isLocked ? (
                        <button
                          className="btn btn-ghost"
                          type="button"
                          disabled={true}
                          title="Status is permanently locked"
                          style={{ opacity: 0.65, cursor: 'not-allowed' }}
                        >
                          {isApproved ? 'Approved (Locked)' : isContacted ? 'Contacted (Locked)' : 'Resolved'}
                        </button>
                      ) : (
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            className="btn btn-primary"
                            type="button"
                            disabled={updatingId === id}
                            onClick={() => updateStatus(enquiry, 'approved')}
                          >
                            {updatingId === id ? 'Updating…' : 'Approve'}
                          </button>
                          <button
                            className="btn btn-ghost"
                            type="button"
                            disabled={updatingId === id}
                            onClick={() => updateStatus(enquiry, 'contacted')}
                          >
                            Mark contacted
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}

export { RecruiterEnquiries }

