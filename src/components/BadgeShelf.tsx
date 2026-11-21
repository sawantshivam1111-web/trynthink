import { useEffect, useState } from 'react'
import { Card } from './ui'
import { getUser, supabase } from '../lib/db'
import { BADGES, LEVELS, BadgeStats, levelInfo } from '../lib/levels'

export default function BadgeShelf({ stars }: { stars: number }) {
  const [stats, setStats] = useState<BadgeStats>({ stars, challenges: 0, bestTest: 0, focusMinutes: 0 })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const user = await getUser()
      if (!user) return
      const [r, t, f] = await Promise.all([
        supabase.from('responses').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('submitted', true),
        supabase.from('test_results').select('score').eq('user_id', user.id),
        supabase.from('sessions').select('duration').eq('user_id', user.id).eq('type', 'timer'),
      ])
      const tests = (t.data || []) as any[]
      const focus = (f.data || []) as any[]
      if (cancelled) return
      setStats({
        stars,
        challenges: r.count ?? 0,
        bestTest: tests.reduce((m, x) => Math.max(m, Number(x.score) || 0), 0),
        focusMinutes: focus.reduce((s, x) => s + (Number(x.duration) || 0), 0),
      })
    })()
    return () => { cancelled = true }
  }, [stars])

  const current = levelInfo(stars).level
  const earned = BADGES.filter(b => b.test(stats))

  return (
    <>
      <Card title={`Badges: ${earned.length} of ${BADGES.length} earned`}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
          {BADGES.map(b => {
            const got = b.test(stats)
            return (
              <div key={b.id} style={{ borderRadius: 14, padding: 12, border: '1px solid #e5e7eb', opacity: got ? 1 : 0.5, textAlign: 'center' }}>
                <div style={{ fontSize: 26 }}>{b.icon}</div>
                <div style={{ fontWeight: 700, marginTop: 4 }}>{b.name}</div>
                <div className="muted" style={{ fontSize: 12 }}>{got ? 'Earned' : b.how}</div>
              </div>
            )
          })}
        </div>
      </Card>

      <Card title="How levels work">
        <p className="muted" style={{ marginBottom: 10 }}>
          You earn stars by completing challenges, tests, thinking breaks, and focus sessions. Each level needs more stars than the one before.
        </p>
        {LEVELS.map(l => (
          <div
            key={l.level}
            className="pill-row"
            style={{
              marginBottom: 6,
              fontWeight: current === l.level ? 800 : 500,
              color: current === l.level ? 'var(--primary-dark)' : undefined,
            }}
          >
            <span>{l.level}. {l.name}{current === l.level ? '  (you are here)' : ''}</span>
            <span>{l.start} ★</span>
          </div>
        ))}
      </Card>
    </>
  )
}