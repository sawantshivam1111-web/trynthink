import { useLocation, Link } from 'react-router-dom'
import { Card, Button } from '../components/ui'

const CHALLENGES = [
  {
    id: '1',
    title: 'Should AI write student essays?',
    prompt: 'Formulate an argument on AI cognitive debt versus utility.',
    stars: 25,
  },
  {
    id: '2',
    title: 'Design a Truth Verification Standard',
    prompt: 'How can a student detect AI hallucinations independently?',
    stars: 25,
  },
  {
    id: '3',
    title: 'Solving Complex Problems Without Search',
    prompt: 'Break down a multi-step logic task using first principles.',
    stars: 25,
  },
]

export default function ChallengeList() {
  const location = useLocation()
  const flash = (location.state as { flash?: string } | null)?.flash

  return (
    <div>
      <div className="hero">
        <span className="tag">Independent Thinking</span>
        <h1 style={{ marginTop: 12 }}>Thinking Challenges</h1>
        <p className="muted">AI answers stay locked until you attempt each challenge first.</p>
      </div>

      {flash ? (
        <div className="flash" role="status">{flash}</div>
      ) : null}

      {CHALLENGES.map(c => (
        <Card key={c.id} title={c.title}>
          <p className="muted" style={{ marginBottom: 14 }}>{c.prompt}</p>
          <Link to={`/challenge/${c.id}`} style={{ textDecoration: 'none' }}>
            <Button>Attempt Challenge (+{c.stars} ★)</Button>
          </Link>
        </Card>
      ))}
    </div>
  )
}