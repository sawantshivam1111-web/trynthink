import { useEffect, useState } from 'react'
import { Card } from '../components/ui'
import { getUser } from '../lib/db'
import { getLevel } from '../lib/scoring'
import {
  loadLeaderboard,
  loadPermissions,
  setProfileVisibility,
  LeaderRow,
} from '../lib/data'
import type { Period } from '../types'

const PERIODS: Period[] = ['Weekly', 'Monthly', 'All-time']

export default function Leaderboard() {
  const [period, setPeriod] = useState<Period>('All-time')
  const [rows, setRows] = useState<LeaderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    (async () => {
      const user = await getUser()
      if (!user) return
      setUserId(user.id)
      try {
        const p = await loadPermissions(user.id)
        setVisible(p.profileVisibility)
      } catch {
        // Default to private if the setting can't be read
      }
    })()
  }, [])

  useEffect(() => {
    setLoading(true)
    setError('')
    loadLeaderboard(period)
      .then(setRows)
      .catch(e => setError(e.message || 'Could not load the leaderboard'))
      .finally(() => setLoading(false))
  }, [period])

  const toggleVisibility = async () => {
    if (!userId) return
    const next = !visible
    setVisible(next)
    try {
      await setProfileVisibility(userId, next)
      setRows(await loadLeaderboard(period))
    } catch (e: any) {
      setVisible(!next)
      setError(e.message || 'Could not update your privacy setting')
    }
  }

  return (
    <div>
      <div className="hero">
        <span className="tag">Rankings</span>
        <h1 style={{ marginTop: 12 }}>Leaderboard</h1>
        <p className="muted">Stars reward thinking first, not speed.</p>
      </div>

      <div className="segmented" role="tablist">
        {PERIODS.map(p => (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={period === p}
            className={period === p ? 'seg active' : 'seg'}
            onClick={() => setPeriod(p)}
          >
            {p}
          </button>
        ))}
      </div>

      {error ? <p className="error-text">{error}</p> : null}

      <Card>
        <div className="table-head">
          <span className="rank">#</span>
          <span style={{ flex: 1, marginLeft: 12 }}>Student</span>
          <span className="stars">Stars</span>
          <span className="level-col">Level</span>
        </div>

        {loading ? (
          <p className="muted" style={{ padding: 14 }}>Loading…</p>
        ) : rows.length === 0 ? (
          <p className="muted" style={{ padding: 14 }}>
            No public profiles yet. Turn on your profile below to appear here.
          </p>
        ) : (
          rows.map((r, i) => (
            <div key={r.user_id} className={`table-row ${r.is_me ? 'me' : ''}`}>
              <span className="rank">{i + 1}</span>
              <span style={{ flex: 1, marginLeft: 12, fontWeight: r.is_me ? 700 : 500 }}>
                {r.is_me ? 'You' : r.display_name}
              </span>
              <span className="stars">{r.total_stars} ★</span>
              <span className="level-col muted">{getLevel(r.total_stars).level}</span>
            </div>
          ))
        )}
      </Card>

      {userId ? (
        <Card title="Privacy">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span>Show my name on the leaderboard</span>
            <button
              type="button"
              role="switch"
              aria-checked={visible}
              aria-label="Show my name on the leaderboard"
              className={`toggle ${visible ? 'on' : ''}`}
              onClick={toggleVisibility}
            >
              <span className="toggle-knob" />
            </button>
          </div>
          <p className="muted" style={{ marginTop: 8 }}>
            Your rank stays private unless you turn this on.
          </p>
        </Card>
      ) : (
        <p className="muted" style={{ marginTop: 12 }}>Sign in to appear on the leaderboard.</p>
      )}
    </div>
  )
}