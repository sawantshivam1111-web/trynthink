import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Wifi, Eye } from 'lucide-react'
import { Card, Button } from '../components/ui'
import { getUser } from '../lib/db'
import { DEFAULT_PERMISSIONS, loadPermissions, savePermissions } from '../lib/data'
import type { Permissions as PermState } from '../types'

type PermKey = keyof PermState

const items: { key: PermKey; label: string; desc: string; Icon: any }[] = [
  { key: 'notifications', label: 'Notifications', desc: 'Gentle reminders for thinking breaks and goals.', Icon: Bell },
  { key: 'internet', label: 'Internet', desc: 'Needed to sync your progress and community answers.', Icon: Wifi },
  { key: 'profileVisibility', label: 'Public profile', desc: 'Show your name and rank on the leaderboard.', Icon: Eye },
]

export default function Permissions() {
  const nav = useNavigate()
  const [allowed, setAllowed] = useState<PermState>(DEFAULT_PERMISSIONS)
  const [userId, setUserId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    (async () => {
      const user = await getUser()
      if (!user) return
      setUserId(user.id)
      try {
        setAllowed(await loadPermissions(user.id))
      } catch {
        // Keep the defaults if the saved choices can't be read
      }
    })()
  }, [])

  const toggle = (key: PermKey) => setAllowed(prev => ({ ...prev, [key]: !prev[key] }))

  const finish = async () => {
    setError('')
    if (!userId) {
      nav('/home')
      return
    }
    setSaving(true)
    try {
      await savePermissions(userId, allowed)
      nav('/home')
    } catch (e: any) {
      setError(e.message || 'Could not save your choices')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="hero" style={{ marginTop: 20 }}>
        <span className="tag">Your choices</span>
        <h1 style={{ marginTop: 12 }}>Set your privacy</h1>
        <p className="muted">Everything here is optional. You can change it anytime in Profile.</p>
      </div>

      <Card>
        {items.map(({ key, label, desc, Icon }) => (
          <div key={key} className="perm-row">
            <div className="perm-icon"><Icon size={20} /></div>
            <div style={{ flex: 1 }}>
              <div className="perm-label">{label}</div>
              <div className="muted">{desc}</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={allowed[key]}
              aria-label={label}
              className={`toggle ${allowed[key] ? 'on' : ''}`}
              onClick={() => toggle(key)}
            >
              <span className="toggle-knob" />
            </button>
          </div>
        ))}
      </Card>

      {error ? <p className="error-text">{error}</p> : null}

      <div className="row-wrap" style={{ marginTop: 8 }}>
        <Button onClick={finish} disabled={saving}>
          {saving ? 'Saving...' : 'Continue to Dashboard'}
        </Button>
        <Button variant="ghost" onClick={() => nav('/home')}>Skip for now</Button>
      </div>
    </div>
  )
}