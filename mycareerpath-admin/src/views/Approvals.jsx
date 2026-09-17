import { useEffect, useState } from 'react'
import Tag from '../components/Tag.jsx'
import { api } from '../../../src/api.js'

const formatDate = (value) => value ? new Date(value).toLocaleDateString() : '-'

export default function Approvals() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    api.getAdminPendingCompanies().then(setCompanies).catch((err) => setError(err.message)).finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function decide(company, approved) {
    try {
      await api.decideAdminCompany(company._id || company.id, { approved })
      setCompanies((current) => current.filter((item) => (item._id || item.id) !== (company._id || company.id)))
    } catch (err) {
      setError(err.message)
    }
  }

  return <section className="view active">
    <div className="section-head"><div><h2>Company approvals</h2><p>Review recruiter registration details before verification</p></div></div>
    {error && <p className="auth-error">{error}</p>}
    <div className="panel">
      {loading ? <p>Loading approval queue...</p> : <table><thead><tr><th>Recruiter</th><th>Company</th><th>Website</th><th>Address</th><th>Tax ID / GSTIN</th><th>Joined</th><th>Actions</th></tr></thead><tbody>{companies.map((company) => <tr key={company._id || company.id}><td><b>{company.full_name || 'Unnamed recruiter'}</b><div className="p-sub">{company.email || company.phone || '-'}</div></td><td>{company.company_name || <Tag tone="brick">Missing</Tag>}</td><td>{company.company_website || '-'}</td><td>{company.company_address || '-'}</td><td>{company.company_tax_id || '-'}</td><td>{formatDate(company.created_at)}</td><td className="row-actions"><button className="btn btn-primary" onClick={() => decide(company, true)}>Approve</button><button className="btn btn-ghost" onClick={() => decide(company, false)}>Reject</button></td></tr>)}</tbody></table>}
      {!loading && companies.length === 0 && <p>No pending company approvals.</p>}
    </div>
  </section>
}
