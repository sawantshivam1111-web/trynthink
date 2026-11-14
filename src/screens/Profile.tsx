import { useNavigate } from 'react-router-dom'
import { Card, Button } from '../components/ui'
import { signOut } from '../lib/db'
import { getLevel } from '../lib/scoring'

export default function Profile() {
  const nav = useNavigate()
  const stars = Number(localStorage.getItem('stars') || '120')
  const lvl = getLevel(stars)

  const handleLogout = async () => {
    try {
      await signOut()
    } finally {
      localStorage.removeItem('stars')
      nav('/auth')
    }
  }

  return (
    <div>
      <div className="hero">
        <span className="tag">Your profile</span>
        <h1 style={{ marginTop: 12 }}>Your thinking profile</h1>
      </div>

      <Card>
        <div className="row" style={{ gap: 14 }}>
          <div className="avatar">{lvl.level.charAt(0)}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{lvl.level}</div>
            <div className="muted">Rank #42 globally</div>
          </div>
          <span className="tag">Active thinker</span>
        </div>

        <div className="kpi" style={{ marginTop: 16 }}>
          <div className="pill">
            <strong>{stars} ★</strong>
            <span className="muted"><br />Stars</span>
          </div>
          <div className="pill">
            <strong>{lvl.index + 1}</strong>
            <span className="muted"><br />Level</span>
          </div>
          <div className="pill">
            <strong>#42</strong>
            <span className="muted"><br />Rank</span>
          </div>
        </div>
      </Card>

      <Card title="Thinking profile summary">
        <div className="feedback">
          <p><b>Primary strategy:</b> Step-by-step logic</p>
          <p><b>Strength:</b> Socratic reasoning</p>
          <p><b>Recommended mode:</b> Mode 2 (university methods)</p>
        </div>
      </Card>

      <Card title="Account">
        <div className="settings-list">
          <button type="button" className="settings-row" onClick={() => nav('/permissions')}>
            <span>Permissions & privacy</span>
            <span aria-hidden>›</span>
          </button>
          <button type="button" className="settings-row" onClick={() => nav('/achievements')}>
            <span>Achievements & badges</span>
            <span aria-hidden>›</span>
          </button>
          <button type="button" className="settings-row" onClick={() => nav('/leaderboard')}>
            <span>Leaderboard</span>
            <span aria-hidden>›</span>
          </button>
        </div>

        <div style={{ marginTop: 16 }}>
          <Button variant="secondary" onClick={handleLogout}>Sign out</Button>
        </div>
      </Card>
    </div>
  )
}