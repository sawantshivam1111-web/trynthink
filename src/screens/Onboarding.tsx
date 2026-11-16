import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button } from '../components/ui'
import { getUser, supabase } from '../lib/db'

type Opt = { label: string; style: 'Analytical' | 'Creative' | 'Practical' | 'Reflective' }
type Q = { topic: string; question: string; options: Opt[] }

const QUESTIONS: Q[] = [
  { topic: 'Problem solving', question: 'When you face a hard problem, what do you do first?', options: [
    { label: 'Break it into smaller steps', style: 'Analytical' },
    { label: 'Imagine different ways to solve it', style: 'Creative' },
    { label: 'Try something and see what happens', style: 'Practical' },
    { label: 'Think about why it matters', style: 'Reflective' },
  ]},
  { topic: 'Learning', question: 'When you learn something new, what helps most?', options: [
    { label: 'Reading the basics first', style: 'Analytical' },
    { label: 'Looking at examples and patterns', style: 'Creative' },
    { label: 'Practising with real tasks', style: 'Practical' },
    { label: 'Explaining it in my own words', style: 'Reflective' },
  ]},
  { topic: 'Study notes', question: 'How do you usually take notes?', options: [
    { label: 'Structured summaries', style: 'Analytical' },
    { label: 'Mind maps and sketches', style: 'Creative' },
    { label: 'Quick checklists', style: 'Practical' },
    { label: 'Journal-style reflections', style: 'Reflective' },
  ]},
  { topic: 'Mistakes', question: 'After you get something wrong, what do you do?', options: [
    { label: 'Check each step to find the error', style: 'Analytical' },
    { label: 'Try a completely different approach', style: 'Creative' },
    { label: 'Fix it and try again quickly', style: 'Practical' },
    { label: 'Ask why I made the mistake', style: 'Reflective' },
  ]},
  { topic: 'Focus', question: 'What usually helps you focus?', options: [
    { label: 'A clear plan with time blocks', style: 'Analytical' },
    { label: 'A change of place or atmosphere', style: 'Creative' },
    { label: 'Starting for just five minutes', style: 'Practical' },
    { label: 'Remembering why I am studying', style: 'Reflective' },
  ]},
  { topic: 'Explaining', question: 'When you explain an idea, what do you rely on?', options: [
    { label: 'Clear logical structure', style: 'Analytical' },
    { label: 'Analogies and stories', style: 'Creative' },
    { label: 'A live demonstration', style: 'Practical' },
    { label: 'Questioning the assumptions', style: 'Reflective' },
  ]},
  { topic: 'Memory', question: 'How do you remember things best?', options: [
    { label: 'Repetition and patterns', style: 'Analytical' },
    { label: 'Linking them to images or stories', style: 'Creative' },
    { label: 'Using them hands-on', style: 'Practical' },
    { label: 'Connecting them to my experience', style: 'Reflective' },
  ]},
  { topic: 'Ideas', question: 'When you need a new idea, where do you start?', options: [
    { label: 'Reasoning from known facts', style: 'Analytical' },
    { label: 'Brainstorming freely', style: 'Creative' },
    { label: 'Building a quick prototype', style: 'Practical' },
    { label: 'Thinking about what I value', style: 'Reflective' },
  ]},
  { topic: 'Feedback', question: 'What kind of feedback is most useful to you?', options: [
    { label: 'Specific facts and evidence', style: 'Analytical' },
    { label: 'Alternative ideas to consider', style: 'Creative' },
    { label: 'Steps to improve by doing', style: 'Practical' },
    { label: 'Honest questions about my reasoning', style: 'Reflective' },
  ]},
  { topic: 'Goals', question: 'What do you want from studying most?', options: [
    { label: 'Mastering the subject deeply', style: 'Analytical' },
    { label: 'Creating something original', style: 'Creative' },
    { label: 'Real-world skills I can use', style: 'Practical' },
    { label: 'Understanding myself as a learner', style: 'Reflective' },
  ]},
]

const METHOD: Record<Opt['style'], string> = {
  Analytical: 'Step-by-step breakdown',
  Creative: 'Explore alternatives',
  Practical: 'Learn by doing',
  Reflective: 'Reflect and question',
}

export default function Onboarding() {
  const nav = useNavigate()
  const [index, setIndex] = useState(0)
  const [picks, setPicks] = useState<{ q: Q; opt: Opt }[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const pick = async (opt: Opt) => {
    const q = QUESTIONS[index]
    const next = [...picks, { q, opt }]
    setPicks(next)
    if (next.length < QUESTIONS.length) {
      setIndex(index + 1)
      return
    }
    await finish(next)
  }

  const finish = async (all: { q: Q; opt: Opt }[]) => {
    setSaving(true)
    setError('')
    try {
      const user = await getUser()
      if (!user) throw new Error('Please sign in first.')
      const counts: Record<string, number> = { Analytical: 0, Creative: 0, Practical: 0, Reflective: 0 }
      all.forEach(a => { counts[a.opt.style]++ })
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
      const top = sorted[0][0] as Opt['style']
      const low = sorted[sorted.length - 1][0]

      const rows = all.map(a => ({
        user_id: user.id,
        topic: a.q.topic,
        question: a.q.question,
        answer: a.opt.label,
      }))
      const { error: aErr } = await supabase.from('onboarding_answers').insert(rows)
      if (aErr) throw aErr
      const { error: pErr } = await supabase.from('thinking_profile').upsert({
        user_id: user.id,
        method: METHOD[top],
        strengths: [top],
        weaknesses: [low],
      })
      if (pErr) throw pErr
      nav('/', { replace: true })
    } catch (e: any) {
      setError(e?.message || 'Could not save your answers. Please try again.')
      setSaving(false)
    }
  }

  const q = QUESTIONS[index]
  const done = picks.length

  return (
    <div>
      <div className="hero">
        <span className="tag">Welcome</span>
        <h1 style={{ marginTop: 12 }}>Let's personalise your study</h1>
        <p className="muted">Answer {QUESTIONS.length} quick questions. There are no wrong answers.</p>
      </div>

      {error ? <Card><p className="error-text">{error}</p></Card> : null}

      {!saving && q ? (
        <Card title={`Question ${index + 1} of ${QUESTIONS.length} · ${q.topic}`}>
          <p style={{ fontSize: 17, fontWeight: 600, marginBottom: 14 }}>{q.question}</p>
          <div style={{ display: 'grid', gap: 10 }}>
            {q.options.map(opt => (
              <Button key={opt.label} variant="secondary" onClick={() => pick(opt)}>
                {opt.label}
              </Button>
            ))}
          </div>
          <p className="muted" style={{ marginTop: 14 }}>{done} of {QUESTIONS.length} answered</p>
        </Card>
      ) : null}

      {saving ? <Card><p className="muted">Saving your profile...</p></Card> : null}
    </div>
  )
}