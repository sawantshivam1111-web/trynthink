import { useState } from 'react'
import { Card, Button, TextArea } from '../components/ui'
import { callTutor, Message } from '../lib/ai'
import { getReadyMethods, StudyMethod } from '../lib/methods'
import { UNI_LOGOS } from '../lib/logos'

function UniLogo({ methodId }: { methodId: string }) {
  const logo = UNI_LOGOS[methodId]
  const [broken, setBroken] = useState(false)
  if (!logo) return null
  if (broken) {
    return (
      <div style={{ width: 64, height: 64, borderRadius: 12, background: logo.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
        {logo.initials}
      </div>
    )
  }
  return (
    <img
      src={logo.file}
      alt=""
      onError={() => setBroken(true)}
      style={{ width: 64, height: 64, objectFit: 'contain', borderRadius: 12, background: '#fff' }}
    />
  )
}

export default function GodMode() {
  const methods = getReadyMethods()
  const [selected, setSelected] = useState<StudyMethod | null>(methods[0] || null)
  const [topic, setTopic] = useState('')
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [busy, setBusy] = useState(false)

  const send = async () => {
    const text = draft.trim()
    if (!text || busy || !selected) return
    setBusy(true)

    const question = topic.trim() ? `Topic: ${topic.trim()}\n\n${text}` : text
    const history = messages.map(m => ({ role: m.role, text: m.text }))

    setMessages(prev => [...prev, { role: 'user', text }])
    setDraft('')

    const reply = await callTutor(question, history, 'openrouter/auto', {
      id: selected.id,
      name: selected.name,
      summary: selected.summary,
      howAIUsesIt: selected.howAIUsesIt,
    })

    setMessages(prev => [...prev, { role: 'ai', text: reply }])
    setBusy(false)
  }

  if (methods.length === 0) {
    return (
      <div>
        <div className="hero">
          <span className="tag">God mode</span>
          <h1 style={{ marginTop: 12 }}>Learn with a research method</h1>
        </div>
        <Card title="No methods ready yet">
          <p className="muted">Methods appear here once their verified source link is added in src/lib/methods.ts.</p>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <div className="hero">
        <span className="tag">God mode</span>
        <h1 style={{ marginTop: 12 }}>Choose a university method</h1>
        <p className="muted">Tap a university to learn the way its research recommends.</p>
      </div>

      <Card title="Universities">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          {methods.map(m => {
            const isSelected = selected?.id === m.id
            return (
              <div
                key={m.id}
                onClick={() => setSelected(m)}
                role="button"
                tabIndex={0}
                style={{
                  cursor: 'pointer',
                  padding: 14,
                  borderRadius: 14,
                  border: isSelected ? '2px solid var(--primary-dark, #0f766e)' : '1px solid #e5e7eb',
                  background: isSelected ? '#f0fdfa' : '#fff',
                  textAlign: 'center',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                  <UniLogo methodId={m.id} />
                </div>
                <div style={{ fontWeight: 700, color: 'var(--text)' }}>{m.source.university}</div>
                <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{m.name}</div>
              </div>
            )
          })}
        </div>
      </Card>

      {selected ? (
        <Card title={`${selected.source.university}: ${selected.name}`}>
          <p className="muted" style={{ marginBottom: 8 }}>{selected.summary}</p>
          <p className="muted" style={{ marginBottom: 12 }}>
            Paper: {selected.source.title} ({selected.source.year ?? 'year not set'}).{' '}
            <a href={selected.source.url} target="_blank" rel="noreferrer">Open paper</a>
          </p>
          <input
            type="text"
            placeholder="Topic, for example: photosynthesis"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            style={{ padding: 10, borderRadius: 8, border: '1px solid #ccc', width: '100%' }}
          />
        </Card>
      ) : null}

      <Card title="Lesson">
        <div style={{ maxHeight: 360, overflowY: 'auto', marginBottom: 12 }}>
          {messages.length === 0 ? (
            <p className="muted">Ask a question, or type "start" to begin the lesson.</p>
          ) : null}
          {messages.map((m, i) => (
            <div key={i} style={{ marginBottom: 10, textAlign: m.role === 'user' ? 'right' : 'left' }}>
              <span className="tag">{m.role === 'user' ? 'You' : 'Teacher'}</span>
              <p style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>{m.text}</p>
            </div>
          ))}
          {busy ? <p className="muted">Thinking...</p> : null}
        </div>

        <TextArea
          rows={3}
          value={draft}
          onChange={(e: any) => setDraft(e.target.value)}
          placeholder="Type your question or your answer..."
        />
        <div style={{ marginTop: 8 }}>
          <Button onClick={send} disabled={busy || !draft.trim()}>Send</Button>
        </div>
      </Card>
    </div>
  )
}
