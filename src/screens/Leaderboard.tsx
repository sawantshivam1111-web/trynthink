import { useEffect, useState } from 'react'
import { Card } from '../components/ui'
import { getUser, supabase } from '../lib/db'
import { levelInfo } from '../lib/levels'

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

  const displayName = (r: Row) => r.display_name?.trim() || 'Student (no name set)'
  const initial = (r: Row) => (r.display_name?.trim() || 'S').charAt(0).toUpperCase()

  return (
    <div>
      <div className="hero">
        <span className="tag">Rankings</span>
        <h1 style={{ marginTop: 12 }}>Leaderboard</h1>
        <p className="muted">Stars reward thinking first, not speed. Only public profiles appear here.</p>
      </div>

      <Card>
        {loading ? (
          <p className="muted">Loading...</p>
        ) : error ? (
          <p className="error-text">{error}</p>
        ) : rows.length === 0 ? (
          <p className="muted">
            No public profiles yet. Sign in, open Profile, enter your name, and tap "Show my profile on leaderboard".
          </p>
        ) : (
          <div>
            <div className="table-head">
              <span className="rank">#</span>
              <span style={{ flex: 1 }}>Student</span>
              <span className="stars">Stars</span>
              <span className="level-col">Level</span>
            </div>
            {rows.map((r, i) => {
              const isMe = r.id === myId
              return (
                <div key={r.id} className={`table-row${isMe ? ' me' : ''}`}>
                  <span className="rank">{i + 1}</span>
                  <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="avatar" style={{ width: 34, height: 34, fontSize: 14, borderRadius: 10 }}>
                      {initial(r)}
                    </span>
                    <span style={{ fontWeight: isMe ? 800 : 600 }}>
                      {displayName(r)}{isMe ? ' (you)' : ''}
                    </span>
                  </span>
                  <span className="stars">{r.stars} ★</span>
                  <span className="level-col">{levelInfo(r.stars).name}</span>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <Card>
        <p className="muted">Guests can view this board. Sign in and show your profile to appear on it.</p>
      </Card>
    </div>
  )
}