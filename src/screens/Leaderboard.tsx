import { useEffect, useState } from 'react'
import { Card } from '../components/ui'
import { getUser, supabase } from '../lib/db'
import { getLevel } from '../lib/scoring'

type Row = { id: string; display_name: string | null; stars: number }

export default function Leaderboard() {
  const [rows, setRows] = useState<Row[]>([])
  const [myId, setMyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const user = await getUser()
        if (!cancelled) setMyId(user?.id ?? null)

        const { data, error: qErr } = await supabase
          .from('profiles')
          .select('id, display_name, stars')
          .eq('profile_visible', true)
          .order('stars', { ascending: false })
          .limit(50)
        if (qErr) throw qErr
        if (!cancelled) setRows((data as Row[]) || [])
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Could not load the leaderboard.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const nameOf = (r: Row, i: number) =>
    r.display_name?.trim() || `Thinker ${i + 1}`

  return (
    <div>
      <div className="hero">
        <span className="tag">Rankings</span>
        <h1 style={{ marginTop: 12 }}>Leaderboard</h1>
        <p className="muted">Stars reward thinking first, not speed. Only public profiles appear here.</p>
      </div>

      <Card>
        {loading ? (
          <p className="muted"><span className="skeleton skeleton-line" aria-label="Loading" /></p>
        ) : error ? (
          <p className="error-text">{error}</p>
        ) : rows.length === 0 ? (
          <p className="muted">
            No public profiles yet. Sign in, open Profile, and tap "Show my profile on leaderboard" to appear here.
          </p>
        ) : (
          <div>
            <div className="perm-row" style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>
              <span style={{ width: 40 }}>#</span>
              <span style={{ flex: 1 }}>Student</span>
              <span style={{ width: 90, textAlign: 'right' }}>Stars</span>
              <span style={{ width: 170, textAlign: 'right' }}>Level</span>
            </div>
            {rows.map((r, i) => {
              const isMe = r.id === myId
              return (
                <div
                  key={r.id}
                  className="perm-row"
                  style={{ background: isMe ? '#f0fdfa' : 'transparent', borderRadius: 8 }}
                >
                  <span style={{ width: 40 }}>{i + 1}</span>
                  <span style={{ flex: 1, fontWeight: isMe ? 700 : 400 }}>
                    {nameOf(r, i)}{isMe ? ' (you)' : ''}
                  </span>
                  <span style={{ width: 90, textAlign: 'right' }}>{r.stars} ★</span>
                  <span style={{ width: 170, textAlign: 'right' }}>{getLevel(r.stars).level}</span>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <Card>
        <p className="muted">
          Guests can view this board. Sign in to appear on it.
        </p>
      </Card>
    </div>
  )
}