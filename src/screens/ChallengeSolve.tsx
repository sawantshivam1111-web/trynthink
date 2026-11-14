import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Button, TextArea } from '../components/ui'
import { calculateThinkingScore } from '../lib/scoring'
import { getUser, addStars, supabase } from '../lib/db'

const MIN_CHARACTERS = 10
const CHALLENGE_STARS = 25

function countWords(text: string) {
  return text.split(' ').filter(Boolean).length
}

// Pull a 0-100 score out of the AI's reply, if it gave one
function parseScore(text: string): number | null {
  const m = text.match(/score[^\d]{0,20}(\d{1,3})/i) || text.match(/(\d{1,3})\s*\/\s*100/)
  if (!m) return null
  const n = Number(m[1])
  return n >= 0 && n <= 100 ? n : null
}

export default function ChallengeSolve() {
  const { id } = useParams()
  const nav = useNavigate()
  const [draft, setDraft] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [score, setScore] = useState(0)

  const wordCount = countWords(draft)

  const handleSubmit = async () => {
    setError('')
    if (draft.trim().length < MIN_CHARACTERS) {
      setError(`Please write at least ${MIN_CHARACTERS} characters first.`)
      return
    }
    setSaving(true)
    try {
      // 1. Get real AI feedback on the student's own reasoning
      const { data, error: fnError } = await supabase.functions.invoke('ai', {
        body: { prompt: draft, mode: 'feedback' },
      })
      const aiText: string = fnError
        ? 'Feedback is unavailable right now. Your answer is saved.'
        : data?.text || 'No feedback returned.'
      const finalScore = parseScore(aiText) ?? calculateThinkingScore(wordCount, true)

      // 2. Save the response
      const user = await getUser()
      if (user) {
        const { error: insertError } = await supabase.from('responses').insert({
          user_id: user.id,
          challenge_id: id || '1',
          draft,
          submitted: true,
          thinking_score: finalScore,
          ai_assist_level: 'none',
        })
        if (insertError) throw insertError
      }

      setFeedback(aiText)
      setScore(finalScore)
      setSubmitted(true)
    } catch (e: any) {
      setError(e.message || 'Could not submit your answer')
    } finally {
      setSaving(false)
    }
  }

  const handleClaimStars = async () => {
    setError('')
    setSaving(true)
    try {
      const user = await getUser()
      let message: string
      if (user) {
        await addStars(user.id, CHALLENGE_STARS, 'challenge')
        message = `Challenge complete! +${CHALLENGE_STARS} stars saved.`
      } else {
        const curr = Number(localStorage.getItem('stars') || '0')
        localStorage.setItem('stars', String(curr + CHALLENGE_STARS))
        message = `Guest challenge complete! +${CHALLENGE_STARS} stars saved on this device.`
      }
      nav('/challenges', { state: { flash: message } })
    } catch (e: any) {
      setError(e.message || 'Could not save your stars')
      setSaving(false)
    }
  }

  if (submitted) {
    return (
      <div>
        <div className="hero">
          <span className="tag">Challenge #{id} · Evaluation</span>
          <h1 style={{ marginTop: 12 }}>Nice thinking</h1>
          <p className="muted">Your reasoning came first. Now compare it with AI.</p>
        </div>

        <Card title="Your Thinking Score">
          <div style={{ textAlign: 'center', margin: '12px 0 16px' }}>
            <h1 className="score">{score}/100</h1>
          </div>
          <div className="feedback">
            <p style={{ whiteSpace: 'pre-wrap' }}>{feedback}</p>
          </div>

          {!showAI ? (
            <div style={{ marginTop: 16 }}>
              <Button onClick={() => setShowAI(true)}>Continue to Reflection →</Button>
            </div>
          ) : (
            <Card title="Reflection">
              <p className="muted" style={{ color: 'var(--text)', marginBottom: 14 }}>
                What insight did you work out on your own before reading the feedback above?
              </p>
              <Button onClick={handleClaimStars} disabled={saving}>
                {saving ? 'Saving stars...' : `Claim +${CHALLENGE_STARS} ★ & Return`}
              </Button>
            </Card>
          )}

          {error ? <p className="error-text">{error}</p> : null}
        </Card>
      </div>
    )
  }

  return (
    <div>
      <div className="hero">
        <span className="tag">Independent Mode</span>
        <h1 style={{ marginTop: 12 }}>Challenge #{id}</h1>
        <p className="muted">Write your own reasoning. AI stays locked until you submit.</p>
      </div>

      <Card title="Think First">
        <TextArea
          rows={8}
          value={draft}
          onChange={(e: any) => setDraft(e.target.value)}
          placeholder="Step 1: Write what you know. Step 2: Formulate your logical answer..."
        />
        <div className="row" style={{ justifyContent: 'space-between', margin: '8px 0 16px' }}>
          <span className="muted">{wordCount} words</span>
          <span className="muted">{draft.trim().length} / {MIN_CHARACTERS}+ characters</span>
        </div>

        {error ? <p className="error-text">{error}</p> : null}

        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? 'Getting feedback...' : 'Submit & Evaluate Reasoning'}
        </Button>
      </Card>
    </div>
  )
}