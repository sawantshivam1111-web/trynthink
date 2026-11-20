import { Button } from './ui'

type Props = {
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
  icon?: string
}

export default function EmptyState({ title, message, actionLabel, onAction, icon = '✨' }: Props) {
  return (
    <div className="empty-state">
      <div className="empty-icon" aria-hidden="true">{icon}</div>
      <h3 className="empty-title">{title}</h3>
      <p className="muted empty-message">{message}</p>
      {actionLabel && onAction ? (
        <div style={{ marginTop: 12 }}>
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      ) : null}
    </div>
  )
}