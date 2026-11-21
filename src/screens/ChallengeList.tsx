import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, Button } from '../components/ui'
import { callAI, parseJSON } from '../lib/ai'
import { getUser, supabase } from '../lib/db'

type Challenge = { id: string; title: string; prompt: string; topic: string; difficulty: string }

export default function ChallengeList() {
  const [items, setItems] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState<string | null>(null)

  const load = async (uid: string) => {
    const { data, error: qErr } = await supabase
      .from('challenges')
      .select('id, title, prompt, topic, difficulty')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
    if (qErr) throw qErr
    setItems((data as Challenge[]) || [])
  }

  useEffect(() => {
    (async () => {
      try {
        const user = await getUser()
        if (!user) { setError('Please sign in to see challenges.'); return }
        setUserId(user.id)
        await load(user.id)
      } catch (e: any) {
        setError(e?.message || 'Could not load challenges.')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const newChallenge = async () => {
    if (!userId || busy) return
    setBusy(true)
    setError('')
    try {
      const { data: existing } = await supabase.from('challenges').select('topic').eq('user_id', userId)
      const covered = (existing || []).map((x: any) => x.topic).join(', ') || 'none yet'
      const r = await callAI('challenge', `Topics the student already has (do not repeat any of these): ${covered}. Create one new challenge.`)
      const c = r.ok ? parseJSON<any>(r.text) : null
      if (!c || !c.title || !c.prompt || !c.topic) {
        setError(r.ok ? 'The AI did not return a challenge. Tap New challenge again.' : `Server error: ${r.error}`)
        return
      }
      if ((existing || []).some((x: any) => String(x.topic).toLowerCase() === String(c.topic).toLowerCase())) {
        setError('That topic was already used. Tap New challenge again for a different one.')
        return
      }
      const { error: iErr } = await supabase.from('challenges').insert({
        user_id: userId,
        title: String(c.title).slice(0, 80),
        prompt: String(c.prompt),
        topic: String(c.topic).slice(0, 60),
        difficulty: ['easy', 'medium', 'hard'].includes(c.difficulty) ? c.difficulty : 'medium',
      })
      if (iErr) throw iErr
      await load(userId)
    } catch (e: any) {
      setError(e?.message || 'Could not create a challenge.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="hero">
        <span className="tag">Challenges</span>
        <h1 style={{ marginTop: 12 }}>Think it through first</h1>
        <p className="muted">Every challenge is new for you. Tap a card to solve it before using AI.</p>
      </div>

      <div style={{ marginBottom: 12 }}>
        <Button onClick={newChallenge} disabled={busy || !userId}>
          {busy ? 'Creating a new challenge...' : '+ New challenge'}
        </Button>
      </div>

      {error ? <p className="error-text" style={{ marginBottom: 10 }}>{error}</p> : null}

      {loading ? (
        <p className="muted">Loading challenges...</p>
      ) : items.length === 0 ? (
        <Card>
          <p className="muted">No challenges yet. Tap <strong>New challenge</strong> to get your first one.</p>
        </Card>
      ) : (
        items.map(c => (
          <Link key={c.id} to={`/challenge/${c.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <Card>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span className="tag">{c.difficulty}</span>
                <span className="muted" style={{ fontSize: 12 }}>{c.topic}</span>
              </div>
              <h3 style={{ marginTop: 8 }}>{c.title}</h3>
              <p className="muted" style={{ marginTop: 4 }}>{c.prompt}</p>
            </Card>
          </Link>
        ))
      )}
    </div>
  )
}