import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, Button } from '../components/ui'
import { getLevel } from '../lib/scoring'
import { getUser, supabase, signOut } from '../lib/db'

function buildLadder(): string[] {
  const names: string[] = []
  for (let s = 0; s <= 5000; s += 5) {
    const n = getLevel(s).level
    if (!names.includes(n)) names.push(n)
  }
  return names
}

export default function Profile() {
  const nav = useNavigate()
  const [loading, setLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [stars, setStars] = useState(Number(localStorage.getItem('stars') || '0'))
  const [visible, setVisible] = useState(false)
  const [rank, setRank] = useState<number | null>(null)
  const [method, setMethod] = useState<string | null>(null)
  const [strength, setStrength] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadRank = async (s: number, isVisible: boolean) => {
    if (!isVisible) {
      setRank(null)
      return
    }
    const { count, error: rErr } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('profile_visible', true)
      .gt('stars', s)
    if (rErr) {
      setRank(null)
      return
    }
    setRank((count ?? 0) + 1)
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const user = await getUser()
        if (!user) {
          if (!cancelled) setLoading(false)
          return
        }
        if (cancelled) return
        setIsGuest(false)
        setUserId(user.id)
        setEmail(user.email || null)

        // Load the profile row. If it doesn't exist yet, create it.
        let { data: profile, error: pErr } = await supabase
          .from('profiles')
          .select('stars, profile_visible')
          .eq('id', user.id)
          .maybeSingle()
        if (pErr) throw new Error(`Could not read your profile: ${pErr.message}`)

        if (!profile) {
          const { error: insErr } = await supabase
            .from('profiles')
            .insert({ id: user.id, stars: 0, profile_visible: false })
          if (insErr) throw new Error(`Could not create your profile: ${insErr.message}`)
          profile = { stars: 0, profile_visible: false } as any
        }

        const s = profile?.stars ?? 0
        const isVisible = !!profile?.profile_visible
        if (cancelled) return
        setStars(s)
        setVisible(isVisible)
        localStorage.setItem('stars', String(s))
        await loadRank(s, isVisible)

        const { data: tp } = await supabase
          .from('thinking_profile')
          .select('method, strengths')
          .eq('user_id', user.id)
          .maybeSingle()
        if (!cancelled && tp) {
          setMethod(tp.method || null)
          setStrength(Array.isArray(tp.strengths) && tp.strengths.length ? tp.strengths[0] : null)
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Could not load your profile.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const toggleVisible = async () => {
    if (!userId) return
    setSaving(true)
    setError('')
    const next = !visible
    const { error: uErr } = await supabase
      .from('profiles')
      .update({ profile_visible: next })
      .eq('id', userId)
    if (uErr) {
      setError(`Could not update your visibility: ${uErr.message}`)
    } else {
      setVisible(next)
      await loadRank(stars, next)
    }
    setSaving(false)
  }

  const logout = async () => {
    await signOut()
    localStorage.removeItem('stars')
    nav('/auth')
  }

  if (loading) return <p className="muted">Loading your profile...</p>

  if (isGuest) {
    return (
      <div>
        <div className="hero">
          <span className="tag">Your profile</span>
          <h1 style={{ marginTop: 12 }}>Guest profile</h1>
          <p className="muted">Your progress is saved only on this device. Sign in to keep it and to appear on the leaderboard.</p>
        </div>
        <Card>
          <p className="muted" style={{ marginBottom: 12 }}>Stars on this device: {stars} ★</p>
          <Button onClick={() => nav('/auth')}>Sign in</Button>
        </Card>
      </div>
    )
  }

  const lvl = getLevel(stars)
  const ladder = buildLadder()
  const levelNumber = Math.max(1, ladder.indexOf(lvl.level) + 1)
  const initial = (email || 'T').charAt(0).toUpperCase()

  return (
    <div>
      <div className="hero">
        <span className="tag">Your profile</span>
        <h1 style={{ marginTop: 12 }}>Your thinking profile</h1>
      </div>

      <Card>
        <div className="row" style={{ alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, background: 'var(--primary-dark)',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 700,
          }}>{initial}</div>
          <div style={{ flex: 1 }}>
            <h2 style={{ color: 'var(--text)' }}>{lvl.level}</h2>
            <div className="muted">{email}</div>
          </div>
        </div>

        <div className="row-wrap" style={{ marginTop: 16, justifyContent: 'space-between' }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <h2>{stars} ★</h2>
            <div className="muted">Stars</div>
          </div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <h2>{levelNumber}</h2>
            <div className="muted">Level</div>
          </div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <h2>{rank ? `#${rank}` : 'Not ranked'}</h2>
            <div className="muted">Rank</div>
          </div>
        </div>

        <p className="muted" style={{ marginTop: 14 }}>
          {visible
            ? 'Your name and rank are public on the leaderboard.'
            : 'You are not on the leaderboard. Turn on a public profile to see your rank.'}
        </p>
        <div style={{ marginTop: 10 }}>
          <Button variant="secondary" onClick={toggleVisible} disabled={saving}>
            {saving ? 'Saving...' : visible ? 'Hide my profile' : 'Show my profile on leaderboard'}
          </Button>
        </div>
      </Card>

      <Card title="Thinking profile summary">
        {method || strength ? (
          <div style={{ background: '#f8fafc', borderRadius: 12, padding: 14 }}>
            <p><strong>Primary strategy:</strong> {method || 'Not enough data yet'}</p>
            <p style={{ marginTop: 6 }}><strong>Strength:</strong> {strength || 'Not enough data yet'}</p>
          </div>
        ) : (
          <p className="muted">
            Not enough data yet. Complete a challenge or a test to build your thinking profile.
          </p>
        )}
      </Card>

      <Card title="Account">
        <div className="row-wrap">
          <Link to="/permissions" style={{ textDecoration: 'none' }}>
            <Button variant="secondary">Permissions &amp; privacy</Button>
          </Link>
          <Link to="/achievements" style={{ textDecoration: 'none' }}>
            <Button variant="secondary">Achievements &amp; badges</Button>
          </Link>
          <Button variant="ghost" onClick={logout}>Sign out</Button>
        </div>
      </Card>

      {error ? <p className="error-text">{error}</p> : null}
    </div>
  )
}