export const navItems = [
  { key: 'dashboard', label: 'Dashboard', group: 'Overview' },
  { key: 'users', label: 'Manage users', group: 'Platform' },
  { key: 'approvals', label: 'Company approvals', group: 'Platform' },
  { key: 'enquiries', label: 'Recruiter enquiries', group: 'Platform' },
  { key: 'jobs', label: 'Job posts & applications', group: 'Platform' },
  { key: 'activity', label: 'Platform activity', group: 'Platform' },
  { key: 'reports', label: 'Reports', group: 'Insights' },
  { key: 'system', label: 'System & maintenance', group: 'Insights' },
]

export const pageMeta = {
  dashboard: ['Admin dashboard', 'Overview of MyCareerPath activity'],
  users: ['Manage users', 'Candidates & employers'],
  approvals: ['Company approvals', 'Recruiter verification queue'],
  enquiries: ['Recruiter enquiries', 'Employer callback requests'],
  jobs: ['Job posts & applications', 'Listings, applicants and moderation'],
  activity: ['Platform activity', 'Live event trail'],
  reports: ['Reports', 'Job reports & candidate reports'],
  system: ['System & maintenance', 'Platform health and settings'],
}
