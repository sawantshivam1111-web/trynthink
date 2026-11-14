import { useEffect, useRef, useState } from 'react'
import { Card, Button } from '../components/ui'

const PRESETS = [5, 10, 15, 20, 45, 60]
const AI_APPS = ['ChatGPT', 'Gemini', 'Claude', 'Copilot', 'Perplexity', 'Other AI apps']

export default function Timer() {
  const [minutes, setMinutes] = useState(25)
  const [customInput, setCustomInput] = useState('')
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [running, setRunning] = useState(false)
  const [blockedApps, setBlockedApps] = useState<string[]>(['ChatGPT', 'Gemini', 'Claude'])
  const [error, setError] = useState('')
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    if (!running) return
    intervalRef.current = window.setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          setRunning(false)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current)
    }
  }, [running])

  const start = (mins: number) => {
    setError('')
    if (!Number.isFinite(mins) || mins < 1 || mins > 240) {
      setError('Choose between 1 and 240 minutes.')
      return
    }
    setMinutes(mins)
    setSecondsLeft(mins * 60)
    setRunning(true)
  }

  const startCustom = () => {
    const n = Number(customInput)
    start(n)
  }

  const stop = () => {
    setRunning(false)
    setSecondsLeft(0)
  }

  const toggleBlock = (app: string) => {
    setBlockedApps(prev => (prev.includes(app) ? prev.filter(a => a !== app) : [...prev, app]))
  }

  const fmt = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  // Focus screen while the timer runs
  if (running || (secondsLeft === 0 && minutes && intervalRef.current && !running && secondsLeft === 0 && false)) {
    return (
      <div style={{ textAlign: 'center', paddingTop: 40 }}>
        <span className="tag">Focus time</span>
        <h1 style={{ fontSize: 72, marginTop: 16 }}>{fmt(secondsLeft)}</h1>
        <p className="muted">Think first. Stay with your own reasoning.</p>

        <Card title="Blocked during focus (prototype)">
          <p className="muted" style={{ marginBottom: 12 }}>
            These apps would be blocked during this session. Real blocking needs Android
            native code and is not active in this demo.
          </p>
          {blockedApps.map(app => (
            <div key={app} className="perm-row">
              <span>{app}</span>
              <span className="muted">🔒 blocked</span>
            </div>
          ))}
          {blockedApps.length === 0 ? <p className="muted">No apps selected.</p> : null}
        </Card>

        <div style={{ marginTop: 20 }}>
          <Button variant="ghost" onClick={stop}>End focus session</Button>
        </div>
      </div>
    )
  }

  // Session finished
  if (!running && secondsLeft === 0 && minutes && intervalRef.current) {
    // handled below by the setup screen, which shows a completion message
  }

  return (
    <div>
      <div className="hero">
        <span className="tag">Focus timer</span>
        <h1 style={{ marginTop: 12 }}>Set your focus time</h1>
        <p className="muted">Pick a length. The app will show a focus screen while the timer runs.</p>
      </div>

      <Card title="Duration">
        <div className="row-wrap" style={{ marginBottom: 12 }}>
          {PRESETS.map(m => (
            <Button key={m} variant="secondary" onClick={() => start(m)}>
              {m} min
            </Button>
          ))}
        </div>

        <div className="row-wrap" style={{ alignItems: 'center' }}>
          <input
            type="number"
            min={1}
            max={240}
            placeholder="Custom minutes"
            value={customInput}
            onChange={e => setCustomInput(e.target.value)}
            style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border, #ccc)', width: 160 }}
          />
          <Button onClick={startCustom}>Start custom</Button>
        </div>

        {error ? <p className="error-text">{error}</p> : null}
      </Card>

      <Card title="Apps to block during focus (prototype)">
        <p className="muted" style={{ marginBottom: 12 }}>
          Choose which AI apps you want blocked. This is a demo. It shows what the lock would
          look like. Real blocking is added in the Android version.
        </p>
        {AI_APPS.map(app => (
          <label key={app} className="perm-row" style={{ cursor: 'pointer' }}>
            <span>{app}</span>
            <input
              type="checkbox"
              checked={blockedApps.includes(app)}
              onChange={() => toggleBlock(app)}
            />
          </label>
        ))}
      </Card>
    </div>
  )
}