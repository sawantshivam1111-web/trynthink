import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, TextArea } from '../components/ui'
import { callAI, parseJSON } from '../lib/ai'
import { getUser, supabase } from '../lib/db'

type Turn = { topic: string; question: string; answer: string }

const TOTAL = 6

export default function Onboarding() {
  const nav = useNavigate()
  const [turns, setTurns] = useState<Turn[]>([])
  const [current, setCurrent] = useState<{ topic: string; question: string } | null>(null)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      const user = await getUser()
      if (!user) { setError('Please sign in to take the interview.'); return }
      setUserId(user.id)
      await nextQuestion([])
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const nextQuestion = async (history: Turn[]) => {
    setBusy(true)
    setError('')
    const covered = history.map(t => t.topic).join(', ') || 'none yet'
    const last = history.length ? history[history.length - 1] : null
    const prompt = `Covered topics so far (do not repeat any of these): ${covered}.\n` +
      (last ? `The student's last answer to "${last.question}" was: "${last.answer}"\n` : 'This is the first question.\n') +
      'Ask the next question.'
    const r = await callAI('onboard', prompt)
    const parsed = r.ok ? parseJSON<{ topic: string; question: string }>(r.text) : null
    if (!parsed || !parsed.question) {
      setError(r.ok ? 'The interviewer did not return a question. Press Try again.' : `Server error: ${r.error}`)
      setBusy(false)
      return
    }
    setCurrent({ topic: parsed.topic || 'general', question: parsed.question })
    setBusy(false)
  }

  const submitAnswer = async () => {
    if (!current || !draft.trim()) return
    const turn: Turn = { topic: current.topic, question: current.question, answer: draft.trim() }
    const nextTurns = [...turns, turn]
    setTurns(nextTurns)
    setDraft('')
    if (userId) {
      await supabase.from('onboarding_answers').insert({
        user_id: userId, topic: turn.topic, question: turn.question, answer: turn.answer,
      })
    }
    if (nextTurns.length >= TOTAL) {
      await finish(nextTurns)
    } else {
      await nextQuestion(nextTurns)
    }
  }

  const finish = async (all: Turn[]) => {
    setBusy(true)
    setCurrent(null)
    const transcript = all.map((t, i) => `Q${i + 1} (${t.topic}): ${t.question}\nAnswer: ${t.answer}`).join('\n\n')
    const r = await callAI('profile', `Interview answers:\n\n${transcript}`)
    const p = r.ok ? parseJSON<any>(r.text) : null
    if (!p) {
      setError(r.ok ? 'Could not build your profile. Please try again later.' : `Server error: ${r.error}`)
      setBusy(false)
      return
    }
    setProfile(p)
    if (userId) {
      await supabase.from('thinking_profile').upsert({
        user_id: userId,
        method: p.method,
        strengths: [p.strength],
        weaknesses: [p.growth],
      })
    }
    setDone(true)
    setBusy(false)
  }

  return (
    <div>
      <div className="hero">
        <span className="tag">Your interview</span>
        <h1 style={{ marginTop: 12 }}>Let's get to know how you think</h1>
        <p className="muted">One question at a time. Answer in your own words.</p>
      </div>

      {error ? <Card><p className="error-text">{error}</p></Card> : null}

      {!done && current ? (
        <Card title={`Question ${turns.length + 1} of ${TOTAL} · ${current.topic}`}>
          <p style={{ fontSize: 17, fontWeight: 600, marginBottom: 12 }}>{current.question}</p>
          <TextArea
            rows={4}
            value={draft}
            onChange={(e: any) => setDraft(e.target.value)}
            placeholder="Your answer..."
          />
          <div style={{ marginTop: 8 }}>
            <Button onClick={submitAnswer} disabled={busy || !draft.trim()}>
              {busy ? 'Thinking...' : turns.length + 1 === TOTAL ? 'Finish' : 'Next'}
            </Button>
          </div>
        </Card>
      ) : null}

      {!done && !current && !error ? <Card><p className="muted">Preparing your question...</p></Card> : null}

      {done && profile ? (
        <Card title="Your thinking profile">
          <p><strong>Primary strategy:</strong> {profile.method}</p>
          <p style={{ marginTop: 6 }}><strong>Strength:</strong> {profile.strength}</p>
          <p style={{ marginTop: 6 }}><strong>Grow:</strong> {profile.growth}</p>
          <p style={{ marginTop: 6 }}><strong>Recommended:</strong> {profile.recommended_mode}</p>
          <div style={{ marginTop: 12 }}>
            <Button onClick={() => nav('/profile')}>See my profile</Button>
          </div>
        </Card>
      ) : null}
    </div>
  )
}
