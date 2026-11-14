import { useState, useRef, useEffect } from 'react'
import { Card, Button, Input } from '../components/ui'
import { callTutor, FREE_MODELS, Message } from '../lib/ai'

const GREETING: Message = {
  role: 'ai',
  text: 'Welcome to the Socratic Tutor. What concept are you working on today?',
}

export default function Tutor() {
  const [messages, setMessages] = useState<Message[]>([GREETING])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState(FREE_MODELS[0].id)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = async () => {
    const textToSend = input.trim()
    if (!textToSend || loading) return
    setInput('')
    const updatedHistory: Message[] = [...messages, { role: 'user', text: textToSend }]
    setMessages(updatedHistory)
    setLoading(true)
    try {
      const replyText = await callTutor(textToSend, updatedHistory, selectedModel)
      setMessages([...updatedHistory, { role: 'ai', text: replyText }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="hero">
        <span className="tag">Socratic tutor</span>
        <h1 style={{ marginTop: 12 }}>Ask, then reason</h1>
        <p className="muted">The tutor guides you with questions instead of giving the answer.</p>
      </div>

      <Card title="AI model">
        <select
          className="select"
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
        >
          {FREE_MODELS.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </Card>

      <Card title="Socratic chat">
        <div className="chat-list">
          {messages.map((m, i) => (
            <div key={i} className={`bubble ${m.role === 'user' ? 'bubble-user' : 'bubble-ai'}`}>
              <div className="bubble-label">{m.role === 'user' ? 'You' : 'Tutor'}</div>
              <div className="bubble-text">{m.text}</div>
            </div>
          ))}
          {loading && <div className="muted typing">Tutor is formulating a guiding hint…</div>}
          <div ref={chatEndRef} />
        </div>

        <div className="row" style={{ gap: 8, marginTop: 12 }}>
          <Input
            value={input}
            onChange={(e: any) => setInput(e.target.value)}
            onKeyDown={(e: any) => { if (e.key === 'Enter') handleSend() }}
            placeholder="Type your thought..."
            disabled={loading}
            style={{ margin: 0 }}
          />
          <Button onClick={handleSend} disabled={loading || !input.trim()}>
            {loading ? '...' : 'Send'}
          </Button>
        </div>
      </Card>
    </div>
  )
}