import { Link } from 'react-router-dom'
import { Bot, FileStack, GitCommitVertical, ShieldAlert, UserCheck } from 'lucide-react'
import type { ActivityEvent } from '@/data'

const KIND_ICON = {
  model: GitCommitVertical,
  finding: ShieldAlert,
  evidence: FileStack,
  agent: Bot,
  decision: UserCheck,
} as const

export function ActivityTimeline({ events, dense = false }: { events: ActivityEvent[]; dense?: boolean }) {
  return (
    <ol className={`timeline${dense ? ' timeline--dense' : ''}`}>
      {events.map((event) => {
        const Icon = KIND_ICON[event.kind]
        return (
          <li key={event.id} className={`timeline__item timeline__item--${event.kind}`}>
            <span className="timeline__when">{event.label}</span>
            <span className="timeline__marker" aria-hidden="true">
              <Icon size={11} />
            </span>
            <div className="timeline__body">
              {event.verb ? <span className={`verb verb--${event.verb.toLowerCase()}`}>{event.verb}</span> : null}
              <p className="timeline__text">{event.text}</p>
              {event.refs.length > 0 ? (
                <div className="timeline__refs">
                  {event.refs.map((ref) => (
                    <Link key={ref.label} className="ref" to={ref.to}>
                      {ref.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
