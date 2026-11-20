import { useEffect, useState } from 'react'
import { Card, Button, TextArea } from '../components/ui'
import { callTutor, Message } from '../lib/ai'
import { getUser, supabase } from '../lib/db'

const CONTEXT_CHARS = 12000

export default function StudyOwn() {
  const [fileName, setFileName] = useState<string | null>(null)
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    (async () => {
      const user = await getUser()
      if (!user) { setLoading(false); return }
      const { data } = await supabase
        .from('study_materials')
        .select('file_name, content')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
      setFileName(data?.[0]?.file_name ?? null)
      setContent(data?.[0]?.content ?? '')
      setLoading(false)
    })()
  }, [])

  const send = async () => {
    const text = draft.trim()
    if (!text || busy) return
    setBusy(true)
    const history = messages.map(m => ({ role: m.role, text: m.text }))
    setMessages(prev => [...prev, { role: 'user', text }])
    setDraft('')

    const material = content
      ? `MATERIAL THE STUDENT UPLOADED (${fileName}):\n"""\n${content.slice(0, CONTEXT_CHARS)}\n"""`
      : 'The student uploaded a file, but no text could be read from it.'

    const framed = `${material}

Help the student study this material on their own terms. Base your questions and explanations only on the material above. Ask them to explain ideas in their own words, check their understanding, and guide them without giving full answers first. If they ask something the material does not cover, say so.

Student: ${text}`

    const reply = await callTutor(framed, history, 'openrouter/auto')
    setMessages(prev => [...prev, { role: 'ai', text: reply }])
    setBusy(false)
  }

  if (loading) return <p className="muted"><span className="skeleton skeleton-line" aria-label="Loading" /></p>

  if (!fileName) {
    return (
      <div>
        <div className="hero">
          <span className="tag">Study by your own</span>
          <h1 style={{ marginTop: 12 }}>Upload material first</h1>
        </div>
        <Card>
          <p className="muted">Go to Upload first, then come back to start studying.</p>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <div className="hero">
        <span className="tag">Study by your own</span>
        <h1 style={{ marginTop: 12 }}>{fileName}</h1>
        <p className="muted">
          {content
            ? 'The AI can read this material and will study it with you.'
            : 'No text was saved for this file. Upload it again so the AI can read it.'}
        </p>
      </div>

      <Card title="Session">
        <div style={{ maxHeight: 360, overflowY: 'auto', marginBottom: 12 }}>
          {messages.length === 0 ? (
            <p className="muted">Ask a question about the material, or say "start" to begin.</p>
          ) : null}
          {messages.map((m, i) => (
            <div key={i} style={{ marginBottom: 10, textAlign: m.role === 'user' ? 'right' : 'left' }}>
              <span className="tag">{m.role === 'user' ? 'You' : 'AI'}</span>
              <p style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>{m.text}</p>
            </div>
          ))}
          {busy ? <p className="muted">Thinking...</p> : null}
        </div>
        <TextArea
          rows={4}
          value={draft}
          onChange={(e: any) => setDraft(e.target.value)}
          placeholder="Ask about the material or type what you are studying..."
        />
        <div style={{ marginTop: 8 }}>
          <Button onClick={send} disabled={busy || !draft.trim()}>Send</Button>
        </div>
      </Card>
    </div>
  )
}
