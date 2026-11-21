import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUser, supabase } from '../lib/db'

export default function NamePrompt({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const save = async () => {
    const clean = name.trim().slice(0, 30)
    if (!clean) return
    setBusy(true)
    const user = await getUser()
    if (!user) { setError('Please sign in again.'); setBusy(false); return }
    const { error: e } = await supabase.from('profiles').update({ display_name: clean }).eq('id', user.id)
    if (e) { setError(e.message); setBusy(false); return }
    onDone()
  }
  return (
    <div className="auth-wrap" style={{ paddingTop: 40 }}>
      <div className="hero">
        <span className="tag">One last step</span>
        <h1 style={{ marginTop: 12 }}>What should we call you?</h1>
        <p className="muted">Your name appears on the leaderboard. You only need to set it once.</p>
      </div>
      <div className="card">
        <input className="input" maxLength={30} placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
        <div style={{ marginTop: 10 }}>
          <button className="btn" onClick={save} disabled={busy || !name.trim()}>{busy ? 'Saving...' : 'Save my name'}</button>
        </div>
        {error ? <p className="error-text">{error}</p> : null}
      </div>
    </div>
  )
}