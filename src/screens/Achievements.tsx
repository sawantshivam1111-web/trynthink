import { useState } from 'react'
import { Card, Button } from '../components/ui'
import { getLevel } from '../lib/scoring'

const BADGES = [
  { name: 'First Thinker', icon: '🧠', desc: 'Complete your first thinking break or challenge.', unlocked: true },
  { name: 'Independent Mind', icon: '💡', desc: 'Submit 5 challenges before using AI.', unlocked: true },
  { name: 'Creative Explorer', icon: '🧭', desc: 'Try 3 different challenge topics.', unlocked: false },
  { name: 'Consistent Learner', icon: '🔥', desc: 'Keep a 7-day thinking streak.', unlocked: false },
  { name: 'Community Contributor', icon: '🤝', desc: 'Get 10 upvotes on your community answers.', unlocked: false },
  { name: 'AI-Free Champion', icon: '🏆', desc: 'Complete 10 breaks with no AI use.', unlocked: false },
]

export default function Achievements() {
  const stars = Number(localStorage.getItem('stars') || '120')
  const lvl = getLevel(stars)
  const [shareMsg, setShareMsg] = useState('')

  const share = async () => {
    const text = `I reached ${lvl.level} on TryNThink with ${stars} stars. Think first, then ask AI.`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'TryNThink', text })
      } else {
        await navigator.clipboard.writeText(text)
        setShareMsg('Copied to clipboard.')
      }
    } catch {
      setShareMsg('Sharing was cancelled.')
    }
  }

  const unlockedCount = BADGES.filter(b => b.unlocked).length

  return (
    <div>
      <div className="hero">
        <span className="tag">Achievements</span>
        <h1 style={{ marginTop: 12 }}>Your progress, certified</h1>
        <p className="muted">{unlockedCount} of {BADGES.length} badges unlocked.</p>
      </div>

      <div className="certificate">
        <div className="cert-label">Certificate of Thinking</div>
        <div className="cert-level">{lvl.level}</div>
        <div className="cert-stars">{stars} ★ earned</div>
        <span className="tag">Verified thinker</span>
      </div>

      <div className="row-wrap" style={{ marginTop: 14 }}>
        <Button onClick={share}>Share achievement</Button>
        <Button variant="secondary" onClick={() => window.print()}>Save as PDF</Button>
      </div>
      {shareMsg ? <p className="muted" style={{ marginTop: 8 }}>{shareMsg}</p> : null}

      <h2 className="section-title">Badges</h2>
      <div className="badge-grid">
        {BADGES.map(b => (
          <Card key={b.name}>
            <div className={`badge ${b.unlocked ? '' : 'locked'}`}>
              <div className="badge-icon">{b.icon}</div>
              <div className="badge-name">{b.name}</div>
              <div className="muted">{b.desc}</div>
              <span className="tag" style={{ marginTop: 8 }}>{b.unlocked ? 'Unlocked' : 'Locked'}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}