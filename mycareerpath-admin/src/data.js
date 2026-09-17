export const stats = [
  { label: 'Total candidates', value: '18,420', delta: '▲ 4.2% this month', trend: 'up', accent: 'teal' },
  { label: 'Registered employers', value: '1,286', delta: '▲ 2.8% this month', trend: 'up', accent: 'gold' },
  { label: 'Active job posts', value: '3,057', delta: '▼ 1.1% this week', trend: 'down', accent: 'brick' },
  { label: 'Applications today', value: '642', delta: '▲ 12.6% vs yesterday', trend: 'up', accent: 'navy' },
]

export const applicationVolume = [
  { month: 'Mar', height: 52 },
  { month: 'Apr', height: 64 },
  { month: 'May', height: 40, alt: true },
  { month: 'Jun', height: 78 },
  { month: 'Jul', height: 58 },
  { month: 'Aug', height: 90 },
  { month: 'Sep', height: 70, alt: true },
]

export const userComposition = [
  { label: 'Candidates', pct: 60, color: 'var(--teal)' },
  { label: 'Employers', pct: 27, color: 'var(--gold)' },
  { label: 'Admins & staff', pct: 13, color: 'var(--brick)' },
]

export const dashboardFeed = [
  { color: 'teal', title: 'New employer verified — Nexora Labs', meta: 'Company profile approved after document review', time: '2 min ago' },
  { color: 'gold', title: 'Job post flagged for review — "Remote Data Entry"', meta: 'Auto-flagged by spam filter, pending admin decision', time: '14 min ago' },
  { color: 'brick', title: 'Candidate account suspended — R. Fernandes', meta: 'Suspended for duplicate profile creation', time: '41 min ago' },
  { color: 'teal', title: '312 new candidate applications synced', meta: 'Batch sync from candidate dashboard, 9:00–10:00 AM', time: '1 hr ago' },
]

export const activityFeed = [
  { color: 'teal', title: 'Candidate login spike detected', meta: '1,204 logins between 9:00–9:30 AM, within normal range', time: 'Just now' },
  { color: 'gold', title: 'Employer posted new job — "Remote Data Entry"', meta: 'Auto-flagged: unusually high application rate for role type', time: '12 min ago' },
  { color: 'navy', title: 'Backend sync completed — Node.js / Express', meta: '18,420 candidate records reconciled with MongoDB', time: '28 min ago' },
  { color: 'brick', title: 'Duplicate profile detected — R. Fernandes', meta: 'Flagged by identity check, account auto-suspended pending review', time: '41 min ago' },
  { color: 'teal', title: 'Shortlist finalized — Greenfield Logistics', meta: '6 candidates moved to interview stage for Warehouse Supervisor', time: '1 hr 10 min ago' },
  { color: 'gold', title: 'New employer registration — Harborview Retail', meta: 'Awaiting document verification before going live', time: '2 hr ago' },
]

export const candidates = [
  { initials: 'AK', name: 'Ananya Kulkarni', sub: 'B.Tech, Computer Science', email: 'ananya.k@mail.com', applications: 14, joined: 'Jan 12, 2026', status: 'Active', tag: 'teal' },
  { initials: 'RS', name: 'Rohan Sen', sub: 'MBA, Marketing', email: 'rohan.sen@mail.com', applications: 7, joined: 'Feb 3, 2026', status: 'Active', tag: 'teal' },
  { initials: 'RF', name: 'R. Fernandes', sub: 'Diploma, Mechanical', email: 'r.fernandes@mail.com', applications: 2, joined: 'Aug 28, 2026', status: 'Suspended', tag: 'brick' },
  { initials: 'SM', name: 'Sara Mathew', sub: 'B.Sc, Data Science', email: 'sara.m@mail.com', applications: 21, joined: 'Nov 19, 2025', status: 'Pending KYC', tag: 'gold' },
]

export const employers = [
  { initials: 'NL', name: 'Nexora Labs', sub: 'Software & IT services', email: 'hr@nexoralabs.com', roles: 9, joined: 'Sep 1, 2026', status: 'Verified', tag: 'teal' },
  { initials: 'HV', name: 'Harborview Retail', sub: 'Retail & e-commerce', email: 'careers@harborview.com', roles: 4, joined: 'Jul 22, 2026', status: 'Pending review', tag: 'gold' },
  { initials: 'GF', name: 'Greenfield Logistics', sub: 'Supply chain', email: 'talent@greenfield.com', roles: 12, joined: 'Apr 5, 2026', status: 'Verified', tag: 'teal' },
]

export const jobPosts = [
  { title: 'Frontend Engineer, React', company: 'Nexora Labs', applications: 84, posted: 'Aug 20, 2026', status: 'Live', tag: 'teal' },
  { title: 'Warehouse Supervisor', company: 'Greenfield Logistics', applications: 39, posted: 'Aug 24, 2026', status: 'Live', tag: 'teal' },
  { title: 'Remote Data Entry', company: 'QuickHire Pvt Ltd', applications: 211, posted: 'Aug 30, 2026', status: 'Flagged', tag: 'gold' },
  { title: 'Store Associate', company: 'Harborview Retail', applications: 17, posted: 'Sep 1, 2026', status: 'Draft', tag: 'flat' },
]

export const pendingApplications = [
  { initials: 'AK', name: 'Ananya Kulkarni', job: 'Frontend Engineer, React', submitted: 'Sep 1, 10:14 AM', status: 'In review', tag: 'gold' },
  { initials: 'RS', name: 'Rohan Sen', job: 'Warehouse Supervisor', submitted: 'Sep 1, 9:52 AM', status: 'In review', tag: 'gold' },
  { initials: 'SM', name: 'Sara Mathew', job: 'Remote Data Entry', submitted: 'Sep 1, 8:41 AM', status: 'Suspicious', tag: 'danger' },
]

export const reports = [
  { title: 'Job reports', desc: 'Posting volume, fill rate and time-to-hire across every employer on the platform.', metaLabel1: 'Last generated', metaValue1: 'Sep 1, 2026, 6:00 AM', metaLabel2: 'Covers', metaValue2: '3,057 active postings', cta: 'Generate report', primary: true },
  { title: 'Candidate reports', desc: 'Application funnel, shortlist rate and drop-off points by role category.', metaLabel1: 'Last generated', metaValue1: 'Aug 31, 2026, 6:00 AM', metaLabel2: 'Covers', metaValue2: '18,420 candidate profiles', cta: 'Generate report', primary: true },
  { title: 'Moderation summary', desc: 'Flagged listings, suspended accounts and resolution time this month.', metaLabel1: 'Open items', metaValue1: '7 pending', metaLabel2: 'Resolved this week', metaValue2: '23', cta: 'View summary', primary: false },
  { title: 'Traffic & sources', desc: 'Where candidate and employer sign-ups are coming from this month.', metaLabel1: 'Top source', metaValue1: 'Direct + referral', metaLabel2: 'Growth', metaValue2: '+4.2% MoM', cta: 'View summary', primary: false },
]

export const systemStatus = [
  { name: 'Backend — Node.js / Express', detail: 'API layer connecting all dashboards', status: 'Operational', color: 'teal', extra: 'Avg. response time: 118ms · Uptime 99.98%' },
  { name: 'Database — MongoDB', detail: 'Stores users, job posts & applications', status: 'Operational', color: 'teal', extra: 'Storage used: 62% · Last backup 3 hr ago' },
  { name: 'Authentication service', detail: 'Handles login & role-based access', status: 'Degraded', color: 'gold', extra: 'Elevated latency detected on password reset flow' },
]

export const settingsToggles = [
  { title: 'Maintenance mode', desc: 'Temporarily block new logins during deployments', on: false },
  { title: 'Auto-flag suspicious job posts', desc: 'Runs the spam filter on every new listing', on: true },
  { title: 'Nightly database backup', desc: 'Full MongoDB snapshot at 2:00 AM daily', on: true },
  { title: 'New employer auto-verification', desc: 'Skip manual review for employers with a verified domain', on: false },
]

export const navItems = [
  { key: 'dashboard', label: 'Dashboard', group: 'Overview' },
  { key: 'users', label: 'Manage users', group: 'Platform' },
  { key: 'approvals', label: 'Company approvals', group: 'Platform' },
  { key: 'jobs', label: 'Job posts & applications', group: 'Platform' },
  { key: 'activity', label: 'Platform activity', group: 'Platform' },
  { key: 'reports', label: 'Reports', group: 'Insights' },
  { key: 'system', label: 'System & maintenance', group: 'Insights' },
]

export const pageMeta = {
  dashboard: ['Admin dashboard', 'Overview of MyCareerPath activity'],
  users: ['Manage users', 'Candidates & employers'],
  approvals: ['Company approvals', 'Recruiter verification queue'],
  jobs: ['Job posts & applications', 'Listings, applicants and moderation'],
  activity: ['Platform activity', 'Live event trail'],
  reports: ['Reports', 'Job reports & candidate reports'],
  system: ['System & maintenance', 'Platform health and settings'],
}
