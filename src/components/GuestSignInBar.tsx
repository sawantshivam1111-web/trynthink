import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getUser } from '../lib/db'

// Shows a clear Sign in / Create account bar to guests on every page.
export default function GuestSignInBar() {
  const [guest, setGuest] = useState(false)
  const loc = useLocation()

  useEffect(() => {
    let alive = true
    getUser().then(u => { if (alive) setGuest(!u) })
    return () => { alive = false }
  }, [loc.pathname])

  if (!guest || loc.pathname.startsWith('/auth')) return null

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      padding: '10px 16px', margin: '8px 12px', borderRadius: 12,
      background: 'var(--primary, #16a34a)', color: '#fff', fontWeight: 600, fontSize: 14,
    }}>
      <span>Sign in to save your progress and see Challenges.</span>
      <Link to="/auth" style={{
        background: '#fff', color: 'var(--primary, #16a34a)', padding: '6px 12px',
        borderRadius: 999, textDecoration: 'none', whiteSpace: 'nowrap',
      }}>Sign in / Create account</Link>
    </div>
  )
}