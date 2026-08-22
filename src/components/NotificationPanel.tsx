import { Link } from 'react-router-dom'
import { ArrowRight, CircleAlert, Info, TriangleAlert } from 'lucide-react'
import { useModelSession } from '@/lib/model-session'

const TONE_ICON = {
  critical: CircleAlert,
  warning: TriangleAlert,
  info: Info,
} as const

export function NotificationList({ onNavigate }: { onNavigate?: () => void }) {
  const { notifications } = useModelSession()
  return (
    <ul className="notifList">
      {notifications.map((notification) => {
        const Icon = TONE_ICON[notification.tone]
        return (
          <li key={notification.id}>
            <Link
              className={`notif notif--${notification.tone}`}
              to={notification.to}
              onClick={onNavigate}
            >
              <Icon size={14} className="notif__icon" aria-hidden="true" />
              <span className="notif__body">
                <span className="notif__text">{notification.text}</span>
                <span className="notif__detail">{notification.detail}</span>
              </span>
              <span className="notif__action">
                {notification.actionLabel}
                <ArrowRight size={12} aria-hidden="true" />
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
