import { useEffect, useRef, useState } from 'react'
import { Card, Button, TextArea } from '../components/ui'
import Rich from '../components/Rich'
import { callAI, FREE_MODELS, Message } from '../lib/ai'
import { getUser, supabase } from '../lib/db'

const MODEL_GUIDE = [
  { name: 'OpenRouter Auto', use: 'Best default. Picks a suitable model for each message.' },
  { name: 'Llama 3.3 70B', use: 'Good for clear explanations and step-by-step reasoning.' },
  { name: 'DeepSeek', use: 'Good for maths, logic, and careful multi-step problems.' },
  { name: 'Gemini Flash', use: 'Fast replies for quick questions and short definitions.' },
]

export default function Tutor() {
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [model, setModel] = useState('openrouter/auto')
  const [busy, setBusy] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const endRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const user = await getUser()
        if (!user) { setLoading(false); return }
        setUserId(user.id)
        const { data, error: qErr } = await supabase
          .from('chat_messages')
          .select('role, body')
          .eq('user_id', user.id)
          .eq('thread', 'tutor')
          .order('created_at', { ascending: true })
          .limit(200)
        if (qErr) throw qErr
        setMessages((data || []).map((r: any) => ({ role: r.role, text: r.body })))
      } catch (e: any) {
        setError(e?.message || 'Could not load your chat.')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, busy])

  const save = async (role: 'user' | 'ai', body: string) => {
    if (!userId) return
    await supabase.from('chat_messages').insert({ user_id: userId, thread: 'tutor', role, body })
  }

  const send = async () => {
    const text = draft.trim()
    if (!text || busy) return
    setBusy(true)
    setError('')
    const history = messages
    setMessages(prev => [...prev, { role: 'user', text }])
    setDraft('')
    await save('user', text)
    const r = await callAI('tutor', text, history.slice(-12), undefined)
    const reply = r.ok ? r.text : `The tutor could not reply: ${r.error || 'unknown error'}`
    setMessages(prev => [...prev, { role: 'ai', text: reply }])
    if (r.ok) await save('ai', reply)
    setBusy(false)
  }

  const clearChat = async () => {
    if (!userId) return
    if (!confirm('Delete this whole tutor conversation?')) return
    await supabase.from('chat_messages').delete().eq('user_id', userId).eq('thread', 'tutor')
    setMessages([])
  }

  return (
    <div>
      <div className="hero">
        <span className="tag">Socratic tutor</span>
        <h1 style={{ marginTop: 12 }}>Think it through with me</h1>
        <p className="muted">Your conversation is saved, so you can continue it later.</p>
      </div>

      <Card title="AI model">
        <p className="muted" style={{ marginBottom: 10 }}>Not sure which to pick? Leave it on Auto.</p>
        <div className="row-wrap" style={{ marginBottom: 10 }}>
          {FREE_MODELS.map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => setModel(m.id)}
              style={{
                padding: '8px 12px',
                borderRadius: 10,
                border: model === m.id ? '2px solid var(--primary-dark)' : '1px solid #e5e7eb',
                background: 'var(--card, #fff)',
                color: 'var(--text)',
                cursor: 'pointer',
              }}
            >
              {m.name}
            </button>
          ))}
        </div>
        <div style={{ display: 'grid', gap: 6 }}>
          {MODEL_GUIDE.map(g => (
            <p key={g.name} className="muted" style={{ fontSize: 13 }}>
              <strong style={{ color: 'var(--text)' }}>{g.name}:</strong> {g.use}
            </p>
          ))}
        </div>
      </Card>

      <Card title="Conversation">
        {loading ? (
          <p className="muted">Loading your conversation...</p>
        ) : (
          <div style={{ maxHeight: 420, overflowY: 'auto', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.length === 0 ? (
              <p className="muted">Ask a question, or describe the problem you're working on.</p>
            ) : null}
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  padding: '10px 14px',
                  borderRadius: 14,
                  background: m.role === 'user' ? 'var(--accent-soft, #e6f6ef)' : 'var(--card, #ffffff)',
                  border: '1px solid #e5e7eb',
                  fontSize: 15,
                  lineHeight: 1.55,
                }}
              >
                <span className="tag" style={{ fontSize: 10 }}>{m.role === 'user' ? 'You' : 'Tutor'}</span>
                <div style={{ marginTop: 4 }}>
                  {m.role === 'ai' ? <Rich text={m.text} /> : <p style={{ whiteSpace: 'pre-wrap' }}>{m.text}</p>}
                </div>
              </div>
            ))}
            {busy ? <p className="muted">Thinking...</p> : null}
            <div ref={endRef} />
          </div>
        )}

        <TextArea
          rows={3}
          value={draft}
          onChange={(e: any) => setDraft(e.target.value)}
          placeholder="Type your thought..."
          onKeyDown={(e: any) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
        />
        <div className="row-wrap" style={{ marginTop: 8, justifyContent: 'space-between' }}>
          <Button onClick={send} disabled={busy || !draft.trim()}>Send</Button>
          {messages.length > 0 ? <Button variant="ghost" onClick={clearChat}>Clear conversation</Button> : null}
        </div>
        {error ? <p className="error-text" style={{ marginTop: 8 }}>{error}</p> : null}
      </Card>
    </div>
  )
}