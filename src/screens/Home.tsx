import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, Button } from '../components/ui'
import { levelInfo, LEVELS } from '../lib/levels'
import { DependencyChart } from '../components/charts'
import { getUser, supabase } from '../lib/db'
import { calcDependency } from '../lib/dependency'

export default function Home() {
  const [stars, setStars] = useState(Number(localStorage.getItem('stars') || '0'))
  const [email, setEmail] = useState<string | null>(null)
  const [dep, setDep] = useState({ independent: 0, assisted: 0, dependent: 0 })
  const lvl = levelInfo(stars)

  useEffect(() => {
    (async () => {
      const user = await getUser()
      if (!user) return
      setEmail(user.email || null)

      const { data: profile } = await supabase
        .from('profiles')
        .select('stars')
        .eq('id', user.id)
        .single()
      if (profile?.stars != null) {
        setStars(profile.stars)
        localStorage.setItem('stars', String(profile.stars))
      }

      const { data: responses } = await supabase
        .from('responses')
        .select('ai_assist_level')
        .eq('user_id', user.id)
        .eq('submitted', true)

      if (responses && responses.length > 0) {
        const sessions = responses.map((r: any) => ({
          type: 'challenge',
          aiUsed: r.ai_assist_level !== 'none' && r.ai_assist_level != null,
        }))
        setDep(calcDependency(sessions))
      }
    })()
  }, [])

  return (
    <div>
      <div className="hero">
        <span className="tag">
          {email ? `Signed in · ${email}` : 'TryNThink · Think First'}
        </span>
        <h1 style={{ marginTop: 12 }}>Train thinking, not AI dependence.</h1>
        <p className="muted">Your daily loop: Think → Try → AI → Compare → Reflect</p>
      </div>

      <Card>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <div className="muted">Current Level</div>
            <h2 style={{ color: 'var(--text)' }}>{lvl.level}</h2>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="muted">Stars</div>
            <h2 style={{ color: 'var(--primary-dark)' }}>{stars} ★</h2>
          </div>
        </div>
        <div className="progress">
          <span style={{ width: `${lvl.progress}%` }} />
        </div>
        <p className="muted" style={{ marginTop: 8 }}>
          {lvl.progress}% to next tier
        </p>
      </Card>

      <Card title="Study tools">
        <p className="muted" style={{ marginBottom: 12 }}>
          Upload your material, choose how to study it, and set a focus timer.
        </p>
        <div className="row-wrap">
          <Link to="/study" style={{ textDecoration: 'none' }}>
            <Button>Upload &amp; Study</Button>
          </Link>
          <Link to="/timer" style={{ textDecoration: 'none' }}>
            <Button variant="secondary">Focus Timer</Button>
          </Link>
          <Link to="/study/god" style={{ textDecoration: 'none' }}>
            <Button variant="ghost">God Mode</Button>
          </Link>
        </div>
      </Card>

      <DependencyChart ind={dep.independent} ast={dep.assisted} dep={dep.dependent} />

      <Card title="Today's Focus">
        <p className="muted" style={{ marginBottom: 12 }}>
          Complete 1 Thinking Break + 1 Challenge before using AI.
        </p>
        <div className="row-wrap">
          <Link to="/break" style={{ textDecoration: 'none' }}>
            <Button>Start Break</Button>
          </Link>
          <Link to="/challenges" style={{ textDecoration: 'none' }}>
            <Button variant="secondary">Open Challenges</Button>
          </Link>
          <Link to="/tutor" style={{ textDecoration: 'none' }}>
            <Button variant="ghost">AI Tutor</Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
