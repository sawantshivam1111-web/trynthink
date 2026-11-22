import { useEffect, useState } from 'react'
import { Card, Button } from '../components/ui'
import { callAI, parseJSON } from '../lib/ai'
import { getUser, supabase } from '../lib/db'
import { getReadyMethods } from '../lib/methods'

type Report = {
  summary: string
  strengths: string[]
  weaknesses: string[]
  next_steps: string[]
  suggested_method: string
}

type Numbers = {
  challenges: number
  avg_thinking_score: number | null
  ai_assist_rate_pct: number | null
  tests: number
  avg_test_pct: number | null
  interview_answers: number
  focus_minutes: number
}

// A short fingerprint of the data behind a report. Same data gives the same fingerprint.
function fingerprint(n: Numbers, latestAt: string | null) {
  return [n.challenges, n.avg_thinking_score, n.tests, n.avg_test_pct, n.interview_answers, n.focus_minutes, latestAt ?? 'none'].join('|')
}

export default function Progress() {
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [signedIn, setSignedIn] = useState(true)
  const [numbers, setNumbers] = useState<Numbers | null>(null)
  const [report, setReport] = useState<Report | null>(null)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [previous, setPrevious] = useState<Numbers | null>(null)
  const [fresh, setFresh] = useState<boolean | null>(null)

  const methods = getReadyMethods()

  useEffect(() => {
    (async () => {
      try {
        const user = await getUser()
        if (!user) { setSignedIn(false); return }
        const { data, error: qErr } = await supabase
          .from('thinking_reports')
          .select('summary, strengths, weaknesses, next_steps, stats, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(2)
        if (qErr) throw qErr
        if (data && data[0]) {
          const r = data[0] as any
          setReport({
            summary: r.summary || '',
            strengths: r.strengths || [],
            weaknesses: r.weaknesses || [],
            next_steps: r.next_steps || [],
            suggested_method: r.stats?.suggested_method || '',
          })
          setNumbers(r.stats?.numbers || null)
          setSavedAt(r.created_at)
        }
        if (data && data[1]) setPrevious((data[1] as any).stats?.numbers || null)
      } catch (e: any) {
        setError(e?.message || 'Could not load your progress.')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((s, x) => s + x, 0) / xs.length) : null)

  const generate = async () => {
    setBusy(true)
    setError('')
    try {
      const user = await getUser()
      if (!user) throw new Error('Please sign in first.')

      const [resp, tests, answers, focus] = await Promise.all([
        supabase.from('responses').select('thinking_score, ai_assist_level, created_at').eq('user_id', user.id).eq('submitted', true).order('created_at', { ascending: false }).limit(20),
        supabase.from('test_results').select('score, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
        supabase.from('onboarding_answers').select('topic, question, answer, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('sessions').select('duration').eq('user_id', user.id).eq('type', 'timer'),
      ])
      if (resp.error) throw resp.error
      if (tests.error) throw tests.error
      if (answers.error) throw answers.error
      if (focus.error) throw focus.error

      const r = (resp.data || []) as any[]
      const t = (tests.data || []) as any[]
      const a = (answers.data || []) as any[]
      const f = (focus.data || []) as any[]

      const scores = r.map(x => x.thinking_score).filter((x: any) => typeof x === 'number') as number[]
      const aided = r.filter(x => x.ai_assist_level && x.ai_assist_level !== 'none').length
      const focusMinutes = f.reduce((s, x) => s + (Number(x.duration) || 0), 0)

      const n: Numbers = {
        challenges: r.length,
        avg_thinking_score: avg(scores),
        ai_assist_rate_pct: r.length ? Math.round((aided / r.length) * 100) : null,
        tests: t.length,
        avg_test_pct: avg(t.map(x => Number(x.score)).filter(x => !isNaN(x))),
        interview_answers: a.length,
        focus_minutes: focusMinutes,
      }

      if (n.challenges + n.tests + n.interview_answers + f.length === 0) {
        throw new Error('No data yet. Complete a challenge, a test, the interview, or a focus session first.')
      }

      const latestAt = [r[0]?.created_at, t[0]?.created_at, a[0]?.created_at].filter(Boolean).sort().pop() || null
      const fp = fingerprint(n, latestAt)

      // If nothing changed since the last report, keep the same report (same method, same wording)
      const { data: last } = await supabase
        .from('thinking_reports')
        .select('summary, strengths, weaknesses, next_steps, stats, created_at, data_fingerprint')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (last && (last as any).data_fingerprint === fp) {
        setFresh(false)
        setNumbers(n)
        setReport({
          summary: last.summary || '',
          strengths: last.strengths || [],
          weaknesses: last.weaknesses || [],
          next_steps: last.next_steps || [],
          suggested_method: (last as any).stats?.suggested_method || '',
        })
        setSavedAt(last.created_at)
        return
      }

      const interview = a.slice(0, 6).map((x, i) => `${i + 1}. (${x.topic}) ${x.question} -> ${x.answer}`).join('\n')
      const recentScores = scores.slice(0, 5).join(', ') || 'none'
      const recentTests = t.slice(0, 5).map(x => x.score).join(', ') || 'none'
      const methodNames = methods.map(m => m.name).join(', ') || 'none'

      const prompt = `Numbers about this student (most recent data first):
${JSON.stringify(n)}

Most recent thinking scores: ${recentScores}
Most recent test scores: ${recentTests}

Recent interview answers:
${interview || 'none'}

Available study methods (use only these names): ${methodNames}

Base the report mainly on the most recent scores and answers. Mention what changed if the scores moved. Write the report as the JSON described.`

      const res = await callAI('report', prompt)
      const parsed = res.ok ? parseJSON<Report>(res.text) : null
      if (!parsed || !parsed.summary) {
        throw new Error(res.ok ? 'The report could not be built. Tap Refresh report again.' : `Server error: ${res.error}`)
      }

      const clean: Report = {
        summary: String(parsed.summary),
        strengths: (parsed.strengths || []).map(String).slice(0, 4),
        weaknesses: (parsed.weaknesses || []).map(String).slice(0, 4),
        next_steps: (parsed.next_steps || []).map(String).slice(0, 4),
        suggested_method: String(parsed.suggested_method || ''),
      }

      const { error: insErr } = await supabase.from('thinking_reports').insert({
        user_id: user.id,
        summary: clean.summary,
        strengths: clean.strengths,
        weaknesses: clean.weaknesses,
        next_steps: clean.next_steps,
        stats: { numbers: n, suggested_method: clean.suggested_method },
        data_fingerprint: fp,
      })
      if (insErr) setError(`Report built, but not saved: ${insErr.message}`)

      setPrevious(numbers)
      setNumbers(n)
      setReport(clean)
      setSavedAt(new Date().toISOString())
      setFresh(true)
    } catch (e: any) {
      setError(e?.message || 'Could not build the report.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <p className="muted">Loading your progress...</p>

  if (!signedIn) {
    return (
      <div>
        <div className="hero">
          <span className="tag">Progress</span>
          <h1 style={{ marginTop: 12 }}>Sign in to see your progress</h1>
          <p className="muted">Your thinking pattern report is saved to your account.</p>
        </div>
      </div>
    )
  }

  const suggested = methods.find(m => m.name === report?.suggested_method)
  const independentPct = numbers?.ai_assist_rate_pct != null ? 100 - numbers.ai_assist_rate_pct : null
  const delta = (now: number | null | undefined, before: number | null | undefined) =>
    now != null && before != null ? now - before : null
  const scoreChange = delta(numbers?.avg_thinking_score, previous?.avg_thinking_score)
  const testChange = delta(numbers?.avg_test_pct, previous?.avg_test_pct)

  return (
    <div>
      <div className="hero">
        <span className="tag">Progress</span>
        <h1 style={{ marginTop: 12 }}>Your thinking pattern report</h1>
        <p className="muted">
          {numbers
            ? `Based on ${numbers.challenges} challenge${numbers.challenges === 1 ? '' : 's'}, ${numbers.tests} test${numbers.tests === 1 ? '' : 's'}, and ${numbers.interview_answers} interview answer${numbers.interview_answers === 1 ? '' : 's'}.`
            : 'Built from your challenges, tests, interview answers, and focus sessions.'}
        </p>
        {fresh === false ? <p className="muted" style={{ marginTop: 6 }}>No new activity since the last report, so it's unchanged.</p> : null}
      </div>

      {numbers ? (
        <Card title="Your numbers">
          <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <h2>{numbers.avg_thinking_score ?? '–'}</h2>
              <div className="muted">Avg thinking score</div>
              {scoreChange != null && scoreChange !== 0 ? <div className="muted" style={{ fontSize: 12 }}>{scoreChange > 0 ? '▲' : '▼'} {Math.abs(scoreChange)} since last report</div> : null}
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <h2>{independentPct != null ? `${independentPct}%` : '–'}</h2>
              <div className="muted">Solved without AI</div>
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <h2>{numbers.avg_test_pct != null ? `${numbers.avg_test_pct}%` : '–'}</h2>
              <div className="muted">Avg test score</div>
              {testChange != null && testChange !== 0 ? <div className="muted" style={{ fontSize: 12 }}>{testChange > 0 ? '▲' : '▼'} {Math.abs(testChange)} since last report</div> : null}
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <h2>{numbers.interview_answers}</h2>
              <div className="muted">Interview answers</div>
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <h2>{numbers.focus_minutes ?? 0}</h2>
              <div className="muted">Focus minutes</div>
            </div>
          </div>
        </Card>
      ) : null}

      {report ? (
        <>
          <Card title="Summary">
            <p>{report.summary}</p>
            {savedAt ? <p className="muted" style={{ marginTop: 8 }}>Last updated {new Date(savedAt).toLocaleString()}</p> : null}
          </Card>

          <Card title="Strengths">
            {report.strengths.length ? report.strengths.map((s, i) => <p key={i}>• {s}</p>) : <p className="muted">Not enough data yet.</p>}
          </Card>

          <Card title="Areas to grow">
            {report.weaknesses.length ? report.weaknesses.map((s, i) => <p key={i}>• {s}</p>) : <p className="muted">Not enough data yet.</p>}
          </Card>

          <Card title="Next steps">
            {report.next_steps.length ? report.next_steps.map((s, i) => <p key={i}>{i + 1}. {s}</p>) : <p className="muted">Not enough data yet.</p>}
          </Card>

          {suggested ? (
            <Card title="Suggested study method">
              <p><strong>{suggested.name}</strong> from {suggested.source.university}</p>
              <p className="muted" style={{ marginTop: 6 }}>{suggested.source.title} ({suggested.source.year ?? 'year not set'})</p>
              <p style={{ marginTop: 8 }}>
                <a href={suggested.source.url} target="_blank" rel="noreferrer">Open the paper</a>
              </p>
            </Card>
          ) : null}
        </>
      ) : (
        <Card>
          <p className="muted">No report yet. Complete a challenge, a test, the interview, or a focus session, then generate your report.</p>
        </Card>
      )}

      <Card title="Research sources">
        <p className="muted" style={{ marginBottom: 8 }}>Verified papers behind the methods you can study with:</p>
        {methods.length === 0 ? (
          <p className="muted">No verified sources are active yet.</p>
        ) : (
          methods.map(m => (
            <p key={m.id} style={{ marginTop: 6 }}>
              <strong>{m.source.university}</strong>: {m.source.title} ({m.source.year ?? 'year not set'}).{' '}
              <a href={m.source.url} target="_blank" rel="noreferrer">Open</a>
            </p>
          ))
        )}
      </Card>

      <div style={{ marginTop: 8 }}>
        <Button onClick={generate} disabled={busy}>
          {busy ? 'Building report...' : report ? 'Refresh report' : 'Generate report'}
        </Button>
      </div>

      {error ? <p className="error-text" style={{ marginTop: 12 }}>{error}</p> : null}
    </div>
  )
}