import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, TextArea } from '../components/ui'

const questions = [
  'How do you approach a complex problem?',
  'When you disagree with AI, what do you do?',
  'How do you verify online sources?',
  'How do you structure arguments?',
  'What is your goal for independent thinking?',
]

export default function Onboarding() {
  const [i, setI] = useState(0)
  const [answers, setAnswers] = useState<string[]>(Array(questions.length).fill(''))
  const nav = useNavigate()
  const isLast = i === questions.length - 1
  const progress = ((i + 1) / questions.length) * 100

  const update = (value: string) => {
    setAnswers(prev => prev.map((a, idx) => (idx === i ? value : a)))
  }

  return (
    <div className="auth-wrap">
      <div className="hero" style={{ marginTop: 20 }}>
        <span className="tag">Thinking Pattern Assessment</span>
        <h1 style={{ marginTop: 12 }}>Let's see how you think</h1>
        <p className="muted">There are no wrong answers. Write what comes to mind.</p>
      </div>

      <Card title={`Question ${i + 1} of ${questions.length}`}>
        <div className="progress"><span style={{ width: `${progress}%` }} /></div>

        <p className="question">{questions[i]}</p>

        <TextArea
          rows={5}
          placeholder="Type your initial thoughts..."
          value={answers[i]}
          onChange={(e: any) => update(e.target.value)}
        />

        <div className="row-wrap" style={{ marginTop: 16 }}>
          {i > 0 && (
            <Button variant="ghost" onClick={() => setI(i - 1)}>← Back</Button>
          )}
          {isLast ? (
            <Button onClick={() => nav('/home')}>Complete & Open Dashboard</Button>
          ) : (
            <Button onClick={() => setI(i + 1)}>Next Question →</Button>
          )}
        </div>
      </Card>
    </div>
  )
}