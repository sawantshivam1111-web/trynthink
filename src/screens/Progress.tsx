import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, Button } from '../components/ui'
import { getUser, supabase } from '../lib/db'
import { getLevel } from '../lib/scoring'
import { buildBadges, loadLeaderboard, loadStats, DEFAULT_STATS, LeaderRow } from '../lib/data'
import type { Badge } from '../types'

export default function Progress() {
  const [stars, setStars] = useState(Number(localStorage.getItem('stars') || '0'))
  const [badges, setBadges] = useState<Badge[]>(buildBadges(DEFAULT_STATS))
  const [top, setTop] = useState<LeaderRow[]>([])
  const [error, setError] = useState('')
  const lvl = getLevel(stars)

  useEffect(() => {
    (async () => {
      try {
        const board = await loadLeaderboard('All-time')
        setTop(board.slice(0, 3))

        const user = await getUser()
        if (!user) return

        const { data: profile } = await supabase
          .from('profiles')
          .select('stars')
          .eq('id', user.id)
          .maybeSingle()
        if (profile?.stars != null) {
          setStars(profile.stars)
          localStorage.setItem('stars', String(profile.stars))
        }
        setBadges(buildBadges(await loadStats(user.id)))
      } catch (e: any) {
        setError(e.message || 'Could not load your progress')
      }
    })()
  }, [])

  const unlocked = badges.filter(b => b.unlocked)

  return (
    <div>
      <div className="hero">
        <span className="tag">Your progress</span>
        <h1 style={{ marginTop: 12 }}>Keep building your thinking</h1>
        <p className="muted">See your certificate, badges, and where you rank.</p>
      </div>

      {error ? <p className="error-text">{error}</p> : null}

      <Card title="🎓 Achievement certificate">
        <p style={{ margin: '8px 0' }}>
          Level: <strong>{lvl.level}</strong> · {stars} ★
        </p>
        <div className="progress"><span style={{ width: `${lvl.progress}%` }} /></div>
        <p className="muted" style={{ marginTop: 8 }}>{lvl.progress}% to the next level</p>
        <div style={{ marginTop: 14 }}>
          <Link to="/achievements" style={{ textDecoration: 'none' }}>
            <Button variant="secondary">View certificate</Button>
          </Link>
        </div>
      </Card>

      <Card title={`🏆 Badges unlocked (${unlocked.length}/${badges.length})`}>
        {unlocked.length === 0 ? (
          <p className="muted">Complete a break or challenge to earn your first badge.</p>
        ) : (
          <div className="row-wrap" style={{ marginTop: 8 }}>
            {unlocked.map(b => (
              <span key={b.name} className="tag">{b.icon} {b.name}</span>
            ))}
          </div>
        )}
      </Card>

      <Card title="📊 Top thinkers">
        {top.length === 0 ? (
          <p className="muted">No public profiles yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {top.map((p, i) => (
              <div key={p.user_id} className="pill-row">
                <span>
                  <strong>{i + 1}.</strong> {p.is_me ? 'You' : p.display_name}
                </span>
                <span style={{ color: 'var(--primary-dark)', fontWeight: 700 }}>
                  {p.total_stars} ★
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}