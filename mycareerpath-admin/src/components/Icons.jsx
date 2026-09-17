const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 2 }

export const IconGrid = () => (
  <svg viewBox="0 0 24 24" {...base}><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="8" rx="1.5" /><rect x="3" y="13" width="8" height="8" rx="1.5" /><rect x="13" y="13" width="8" height="8" rx="1.5" /></svg>
)

export const IconUsers = () => (
  <svg viewBox="0 0 24 24" {...base}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20c0-3.6 2.7-6 5.5-6s5.5 2.4 5.5 6" /><circle cx="17.5" cy="9" r="2.4" /><path d="M15.5 13.2c2.4.2 4.5 2.3 4.5 5.8" /></svg>
)

export const IconBriefcase = () => (
  <svg viewBox="0 0 24 24" {...base}><rect x="3.5" y="7" width="17" height="13" rx="1.5" /><path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7" /><path d="M3.5 12h17" /></svg>
)

export const IconPulse = () => (
  <svg viewBox="0 0 24 24" {...base}><path d="M3 12h4l2.5-7 5 14L17 12h4" /></svg>
)

export const IconReport = () => (
  <svg viewBox="0 0 24 24" {...base}><path d="M6 3.5h9l4 4V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" /><path d="M9 13h6M9 16.5h6M9 9.5h2" /></svg>
)

export const IconGear = () => (
  <svg viewBox="0 0 24 24" {...base}><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></svg>
)

export const IconCheck = () => (
  <svg viewBox="0 0 24 24" {...base}><path d="m5 12 4 4L19 6" /></svg>
)

export const IconSearch = () => (
  <svg viewBox="0 0 24 24" {...base}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
)

export const IconEye = () => (
  <svg viewBox="0 0 24 24" {...base}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
)

export const IconEdit = () => (
  <svg viewBox="0 0 24 24" {...base}><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" /></svg>
)

export const navIcons = {
  dashboard: IconGrid,
  users: IconUsers,
  jobs: IconBriefcase,
  activity: IconPulse,
  reports: IconReport,
  system: IconGear,
  approvals: IconCheck,
}
