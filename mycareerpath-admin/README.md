# MyCareerPath — Admin Dashboard (React + Vite)

## Getting started

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (usually http://localhost:5173).

## Build for production

```bash
npm run build
```

Output goes to `dist/`.

## Project structure

```
src/
  main.jsx          entry point
  App.jsx           layout shell + view router (simple useState, no router lib)
  App.css           all component styles
  index.css         global reset + design tokens (CSS variables)
  data.js           mock data for every section — swap for real API calls
  components/
    Sidebar.jsx      left navigation
    Topbar.jsx       header with search + admin avatar
    StatCard.jsx     dashboard metric cards
    BarChart.jsx     CSS bar chart
    Donut.jsx        conic-gradient donut chart
    ActivityFeed.jsx event list used in Dashboard + Activity
    Tag.jsx          status pill
    Icons.jsx        inline SVG icon set
  views/
    Dashboard.jsx
    Users.jsx        Candidates / Employers tabs
    Jobs.jsx         job posts + applications queue
    Activity.jsx     platform activity log
    Reports.jsx      job/candidate/moderation/traffic reports
    System.jsx       backend/DB/auth status + settings toggles
```

## Notes

- All data in `src/data.js` is mock content — replace with API calls (fetch/axios/React Query, etc.) as your backend (Node.js/Express + MongoDB, per the workflow diagram) comes online.
- No routing library is used; navigation is a simple `useState` switch in `App.jsx`. Swap in `react-router-dom` if you want real URLs per section.
- No component library or chart library is used — the bar chart and donut are pure CSS/SVG, so there are only two dependencies: `react` and `react-dom`.
