const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api/v1'
const LEGACY_API_BASE = 'http://localhost:8000/api'
const TOKEN_KEY = 'mcp_admin_token'

function token() {
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem(TOKEN_KEY) ||
    localStorage.getItem('mcp_access_token')
  )
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const currentToken = token()
  if (auth && currentToken) headers.Authorization = `Bearer ${currentToken}`
  const options = { method, headers, body: body === undefined ? undefined : JSON.stringify(body) }
  let response = await fetch(`${API_BASE}${path}`, options)
  if (response.status === 404 && API_BASE.endsWith('/api/v1')) {
    response = await fetch(`${LEGACY_API_BASE}${path}`, options)
  }
  const text = await response.text()
  const data = text ? JSON.parse(text) : null
  if (!response.ok) {
    const error = new Error(data?.detail || data?.message || `Request failed (${response.status})`)
    error.status = response.status
    throw error
  }
  return data
}

const pageParams = ({ page = 1, size = 100, ...rest } = {}) => {
  const params = new URLSearchParams({ skip: String((page - 1) * size), limit: String(size) })
  Object.entries(rest).forEach(([key, value]) => { if (value) params.set(key, value) })
  return params.toString()
}

export const api = {
  API_BASE,
  tokenKey: TOKEN_KEY,
  login: (identifier) => request('/auth/send-otp', { method: 'POST', auth: false, body: { identifier, role: 'admin', is_signup: false } }),
  verifyOtp: (identifier, code) => request('/auth/verify-otp', { method: 'POST', auth: false, body: { identifier, code, role: 'admin', is_signup: false } }).then((data) => {
    localStorage.setItem(TOKEN_KEY, data.access_token)
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('access_token', data.access_token)
    return data
  }),
  getMe: () => request('/auth/me'),
  getOverview: () => request('/admin/overview'),
  getUsers: (params = {}) => request(`/admin/users?${pageParams(params)}`),
  updateUser: (userId, data) => request(`/admin/users/${userId}`, { method: 'PATCH', body: data }),
  deleteUser: (userId) => request(`/admin/users/${userId}`, { method: 'DELETE' }),
  getPendingCompanies: () => request('/admin/recruiters/pending'),
  decideCompany: (userId, data) => request(`/admin/companies/${userId}`, { method: 'PATCH', body: data }),
  getJobs: ({ page = 1, size = 100 } = {}) => request(`/admin/jobs?${pageParams({ page, size })}`),
  updateJob: (itemId, data) => request(`/admin/jobs/${itemId}`, { method: 'PATCH', body: data }),
  deleteJob: (itemId) => request(`/admin/jobs/${itemId}`, { method: 'DELETE' }),
  getReports: () => request('/admin/reports'),
  health: () => fetch('http://localhost:8000/health').then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data?.detail || 'Backend health check failed'); return data }),
  clearToken: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem('token')
    localStorage.removeItem('access_token')
  },
}
