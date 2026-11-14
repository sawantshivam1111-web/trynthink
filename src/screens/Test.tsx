import { useEffect, useState } from 'react'
import { Card, Button, TextArea } from '../components/ui'
import { callAI, loadMaterial, parseJSON, Material } from '../lib/ai'
import { getUser, supabase } from '../lib/db'

type Q = { question: string; answer: string }
type Tab = 'quiz' | 'flashcards'
type Result = { pct: number; correct: number; total: number; feedback: string }

const PASS = 60
const MIN_CHARS = 80
const SOURCE_CHARS = 12000

export default function Test() {
  const [tab, setTab] = useState<Tab>('quiz')
  const [material, setMaterial] = useState<Material | null>(null)
  const [loadingMaterial, setLoadingMaterial] = useState(true)
  const [usePasted, setUsePasted] = useState(false)
  const [pasted, setPasted] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const [questions, setQuestions] = useState<Q[]>([])
  const [answers, setAnswers] = useState<string[]>([])
  const [result, setResult] = useState<Result | null>(null)

  const [cards, setCards] = useState<Q[]>([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState(0)
  const [review, setReview] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    (async () => {
      setMaterial(await loadMaterial())
      setLoadingMaterial(false)
    })()
  }, [])

  const useUploaded = !!material && !usePasted
  const source = (useUploaded ? material!.content : pasted.trim()).slice(0, SOURCE_CHARS)
  const sourceName = useUploaded ? material!.fileName : 'pasted passage'
  const canGenerate = source.length >= MIN_CHARS && !busy
  const hasSession = questions.length > 0 || cards.length > 0 || !!result || done

  const resetAll = () => {
    setError('')
    setResult(null)
    setQuestions([])
    setAnswers([])
    setCards([])
    setIndex(0)
    setFlipped(false)
    setKnown(0)
    setReview(0)
    setDone(false)
  }

  const toList = (raw: string): Q[] | null => {
    const arr = parseJSON<any[]>(raw)
    if (!Array.isArray(arr)) return null
    const clean = arr
      .filter(x => x && typeof x.question === 'string' && typeof x.answer === 'string')
      .slice(0, 5)
    return clean.length ? clean : null
  }

  const makeQuiz = async () => {
    setError('')
    setResult(null)
    setBusy(true)
    const prompt = `Passage (from ${sourceName}):\n"""\n${source}\n"""\n\nWrite exactly 5 short quiz questions based only on this passage. Return only a JSON array: [{"question":"...","answer":"..."}]`
    const r = await callAI('quiz', prompt)
    const list = r.ok ? toList(r.text) : null
    if (!list) {
      setError(r.ok ? 'The AI did not return a quiz in the right format. Click Create quiz again.' : `Server error: ${r.error}`)
    } else {
      setQuestions(list)
      setAnswers(new Array(list.length).fill(''))
    }
    setBusy(false)
  }

  const submitQuiz = async () => {
    setBusy(true)
    setError('')
    const pairs = questions
      .map((q, i) => `Q${i + 1}: ${q.question}\nExpected: ${q.answer}\nStudent: ${answers[i]?.trim() || '(no answer)'}`)
      .join('\n\n')
    const prompt = `Mark these answers. Return only JSON: {"correct": number, "total": ${questions.length}, "feedback": "one short line per question"}\n\n${pairs}`
    const r = await callAI('grade', prompt)
    const parsed = r.ok ? parseJSON<{ correct: number; total: number; feedback: string }>(r.text) : null
    if (!parsed || typeof parsed.correct !== 'number') {
      setError(r.ok ? 'Could not mark the answers. Press Submit answers again.' : `Server error: ${r.error}`)
      setBusy(false)
      return
    }
    const total = questions.length
    const correct = Math.max(0, Math.min(parsed.correct, total))
    const pct = total ? Math.round((correct / total) * 100) : 0
    setResult({ pct, correct, total, feedback: String(parsed.feedback || '') })

    const user = await getUser()
    if (user) {
      await supabase.from('test_results').insert({ user_id: user.id, score: pct, total, correct })
    }
    setBusy(false)
  }

  const makeCards = async () => {
    setBusy(true)
    resetAll()
    const prompt = `Passage (from ${sourceName}):\n"""\n${source}\n"""\n\nMake exactly 5 flashcards from this passage. Each question tests one key idea; each answer is one short sentence. Return only a JSON array: [{"question":"...","answer":"..."}]`
    const r = await callAI('flashcards', prompt)
    const list = r.ok ? toList(r.text) : null
    if (!list) {
      setError(r.ok ? 'The AI did not return flashcards in the right format. Try again.' : `Server error: ${r.error}`)
    } else {
      setCards(list)
    }
    setBusy(false)
  }

  const mark = (knewIt: boolean) => {
    if (knewIt) setKnown(k => k + 1)
    else setReview(r => r + 1)
    setFlipped(false)
    if (index + 1 >= cards.length) setDone(true)
    else setIndex(i => i + 1)
  }

  return (
    <div>
      <div className="hero">
        <span className="tag">Test</span>
        <h1 style={{ marginTop: 12 }}>Test yourself</h1>
        <p className="muted">Quiz mode or flashcards, built from the material you uploaded.</p>
      </div>

      {loadingMaterial ? (
        <Card><p className="muted">Loading your material...</p></Card>
      ) : (
        <Card title="Source">
          {material && useUploaded ? (
            <>
              <p>Using your uploaded material: <strong>{material.fileName}</strong></p>
              <div style={{ marginTop: 8 }}>
                <Button variant="secondary" onClick={() => setUsePasted(true)}>Use a pasted passage instead</Button>
              </div>
            </>
          ) : material ? (
            <>
              <p className="muted">Using a pasted passage.</p>
              <div style={{ marginTop: 8 }}>
                <Button variant="secondary" onClick={() => setUsePasted(false)}>Use my uploaded material</Button>
              </div>
            </>
          ) : (
            <p className="muted">No uploaded material found. Upload on the Study page, or paste a passage below.</p>
          )}

          {!useUploaded ? (
            <div style={{ marginTop: 12 }}>
              <TextArea
                rows={5}
                value={pasted}
                onChange={(e: any) => setPasted(e.target.value)}
                placeholder="Paste a passage (at least 80 characters)..."
              />
            </div>
          ) : null}
        </Card>
      )}

      <div className="row-wrap" style={{ margin: '12px 0' }}>
        <Button
          variant={tab === 'quiz' ? undefined : 'secondary'}
          onClick={() => { setTab('quiz'); resetAll() }}
        >
          Quiz mode
        </Button>
        <Button
          variant={tab === 'flashcards' ? undefined : 'secondary'}
          onClick={() => { setTab('flashcards'); resetAll() }}
        >
          Flashcards mode
        </Button>
      </div>

      {!hasSession && !loadingMaterial ? (
        <Card>
          <Button onClick={tab === 'quiz' ? makeQuiz : makeCards} disabled={!canGenerate}>
            {busy ? 'Working...' : tab === 'quiz' ? 'Create quiz' : 'Create flashcards'}
          </Button>
        </Card>
      ) : null}

      {questions.length > 0 && !result ? (
        <Card title="Quiz">
          {questions.map((q, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <p style={{ fontWeight: 600 }}>{i + 1}. {q.question}</p>
              <TextArea
                rows={2}
                value={answers[i] || ''}
                placeholder="Your answer..."
                onChange={(e: any) => {
                  const next = [...answers]
                  next[i] = e.target.value
                  setAnswers(next)
                }}
              />
            </div>
          ))}
          <Button onClick={submitQuiz} disabled={busy}>
            {busy ? 'Marking...' : 'Submit answers'}
          </Button>
        </Card>
      ) : null}

      {result ? (
        <Card title={result.pct >= PASS ? 'Pass' : 'Not yet passed'}>
          <h2 style={{ color: 'var(--text)' }}>{result.pct}% ({result.correct} of {result.total})</h2>
          <p style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{result.feedback}</p>
          <div style={{ marginTop: 12 }}>
            <Button variant="secondary" onClick={resetAll}>New quiz</Button>
          </div>
        </Card>
      ) : null}

      {cards.length > 0 && !done ? (
        <Card title={`Card ${index + 1} of ${cards.length}`}>
          <div
            onClick={() => setFlipped(f => !f)}
            role="button"
            tabIndex={0}
            style={{
              cursor: 'pointer',
              minHeight: 160,
              padding: 20,
              borderRadius: 14,
              background: flipped ? '#f0fdfa' : '#fff',
              border: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: 18, fontWeight: 600 }}>
              {flipped ? cards[index].answer : cards[index].question}
            </p>
          </div>
          <p className="muted" style={{ textAlign: 'center', marginTop: 8 }}>
            {flipped ? 'Answer. Tap the card to flip back.' : 'Question. Tap the card to reveal the answer.'}
          </p>
          {flipped ? (
            <div className="row-wrap" style={{ marginTop: 12, justifyContent: 'center' }}>
              <Button onClick={() => mark(true)}>I knew it</Button>
              <Button variant="secondary" onClick={() => mark(false)}>Review again</Button>
            </div>
          ) : null}
        </Card>
      ) : null}

      {done ? (
        <Card title="Flashcards complete">
          <p>Knew it: {known} · Review again: {review}</p>
          <div style={{ marginTop: 12 }}>
            <Button onClick={resetAll}>New set</Button>
          </div>
        </Card>
      ) : null}

      {error ? <p className="error-text">{error}</p> : null}
    </div>
  )
}
