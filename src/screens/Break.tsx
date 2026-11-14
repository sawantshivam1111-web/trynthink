import { useState, useEffect } from 'react'
import { Card, Button } from '../components/ui'
import { ProgressRing } from '../components/charts'
import { getUser, addStars, supabase } from '../lib/db'

const BREAK_SECONDS = 300

export default function Break() {
  const [sec, setSec] = useState(BREAK_SECONDS)
  const [run, setRun] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!run) return
    const id = setInterval(() => setSec(s => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(id)
  }, [run])

  // Stop automatically when the timer reaches zero
  useEffect(() => {
    if (sec === 0) setRun(false)
  }, [sec])

  const pct = Math.round(((BREAK_SECONDS - sec) / BREAK_SECONDS) * 100)
  const elapsed = BREAK_SECONDS - sec

  const handleComplete = async () => {
    setSaving(true)
    setMessage('')
    try {
      const user = await getUser()
      if (user) {
        await supabase.from('sessions').insert({
          user_id: user.id,
          type: 'break',
          duration: elapsed,
          ai_used: false,
        })
        await addStars(user.id, 10, 'break')
        setMessage('Break complete! +10 stars saved.')
      } else {
        const curr = Number(localStorage.getItem('stars') || '0')
        localStorage.setItem('stars', String(curr + 10))
        setMessage('Guest break complete! +10 stars saved on this device.')
      }
      setSec(BREAK_SECONDS)
      setRun(false)
    } catch (e: any) {
      setMessage(e.message || 'Could not save your break')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="hero">
        <span className="tag">Thinking break · AI blocked</span>
        <h1 style={{ marginTop: 12 }}>Give your mind some space</h1>
        <p className="muted">Reason through the problem before asking for any AI answers.</p>
      </div>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0 20px' }}>
          <ProgressRing percent={pct} />
        </div>

        <h1 className="timer">
          {Math.floor(sec / 60)}:{String(sec % 60).padStart(2, '0')}
        </h1>

        <div className="row-wrap" style={{ justifyContent: 'center', marginTop: 12 }}>
          <Button onClick={() => setRun(!run)} disabled={sec === 0}>
            {run ? 'Pause' : sec === BREAK_SECONDS ? 'Start 5 Min' : 'Resume'}
          </Button>
          <Button variant="secondary" onClick={handleComplete} disabled={saving || elapsed === 0}>
            {saving ? 'Saving...' : 'Complete & Claim +10 ★'}
          </Button>
        </div>

        {message ? <p className="muted" style={{ textAlign: 'center', marginTop: 14 }}>{message}</p> : null}
      </Card>
    </div>
  )
}