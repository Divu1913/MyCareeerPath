import ActivityFeed from '../components/ActivityFeed.jsx'
import Tag from '../components/Tag.jsx'
import { activityFeed } from '../data.js'

export default function Activity() {
  return (
    <section className="view active">
      <div className="section-head">
        <div>
          <h2>Platform activity</h2>
          <p>A live trail of what's happening across candidate, employer and admin dashboards</p>
        </div>
      </div>
      <div className="panel">
        <div className="activity-log">
          {activityFeed.map((item) => <div className="activity-log-row" key={`${item.title}-${item.time}`}><ActivityFeed items={[item]} /><Tag tone={item.color === 'brick' ? 'brick' : item.color === 'gold' ? 'gold' : 'teal'}>{item.color === 'brick' ? 'Security' : item.color === 'gold' ? 'Moderation' : 'Platform'}</Tag></div>)}
        </div>
      </div>
    </section>
  )
}
