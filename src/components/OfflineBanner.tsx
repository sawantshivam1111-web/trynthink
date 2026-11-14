import { useEffect, useState } from 'react'

export default function OfflineBanner() {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine)

  useEffect(() => {
    const up = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => {
      window.removeEventListener('online', up)
      window.removeEventListener('offline', down)
    }
  }, [])

  if (online) return null

  return (
    <div
      role="status"
      style={{
        background: '#fef3c7',
        color: '#92400e',
        padding: '10px 16px',
        borderRadius: 10,
        margin: '12px 16px 0',
        fontSize: 14,
        fontWeight: 600,
      }}
    >
      You're offline. Your saved progress is kept on this device. Some features will work again when you reconnect.
    </div>
  )
}
