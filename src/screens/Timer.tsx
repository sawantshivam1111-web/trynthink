import { useEffect, useRef, useState } from 'react'
import { Card, Button } from '../components/ui'
import { getUser, supabase } from '../lib/db'
import {
  isNative,
  nativeFocusReady,
  openNativeFocusSettings,
  startNativeFocus,
  stopNativeFocus,
} from '../lib/focus'

const PRESETS = [5, 10, 15, 20, 45, 60]
const AI_APPS = ['ChatGPT', 'Gemini', 'Claude', 'Copilot', 'Perplexity']

export default function Timer() {
  const [plannedMinutes, setPlannedMinutes] = useState(25)
  const [customInput, setCustomInput] = useState('')
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [running, setRunning] = useState(false)
  const [blockedApps, setBlockedApps] = useState<string[]>(['ChatGPT', 'Gemini', 'Claude'])
  const [error, setError] = useState('')
  const [savedMessage, setSavedMessage] = useState('')
  const startedAtRef = useRef<number | null>(null)

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          setRunning(false)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [running])

  // When the session ends (countdown or stop), unblock apps and save the session once.
  useEffect(() => {
    if (running || startedAtRef.current === null) return
    const minutes = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 60000))
    startedAtRef.current = null
    stopNativeFocus()
    saveSession(minutes)
  }, [running])

  const saveSession = async (minutes: number) => {
    try {
      const user = await getUser()
      if (!user) {
        setSavedMessage('Focus session finished. Sign in to save it to your progress.')
        return
      }
      const { error: iErr } = await supabase
        .from('sessions')
        .insert({ user_id: user.id, type: 'timer', duration: minutes })
      if (iErr) throw iErr
      setSavedMessage(`Focus session saved: ${minutes} minute${minutes === 1 ? '' : 's'}.`)
    } catch (e: any) {
      setError(`Could not save the session: ${e?.message || 'unknown error'}`)
    }
  }

  const start = async (mins: number) => {
    setError('')
    setSavedMessage('')
    if (!Number.isFinite(mins) || mins < 1 || mins > 240) {
      setError('Choose between 1 and 240 minutes.')
      return
    }
    if (isNative()) {
      const ready = await nativeFocusReady()
      if (!ready) {
        await openNativeFocusSettings()
        setError('Turn on TryNThink under Accessibility, then tap the duration again.')
        return
      }
    }
    setPlannedMinutes(mins)
    setSecondsLeft(mins * 60)
    startedAtRef.current = Date.now()
    setRunning(true)
    if (isNative()) {
      try {
        await startNativeFocus(mins, blockedApps)
      } catch (e: any) {
        setError(`Could not start blocking: ${e?.message || 'unknown error'}`)
      }
    }
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

  if (running) {
    return (
      <div style={{ textAlign: 'center', paddingTop: 40 }}>
        <span className="tag">Focus time · {plannedMinutes} min</span>
        <h1 style={{ fontSize: 72, marginTop: 16 }}>{fmt(secondsLeft)}</h1>
        <p className="muted">Think first. Blocked apps are sent back during this session.</p>

        <Card title="Blocked during this session">
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

  return (
    <div>
      <div className="hero">
        <span className="tag">Focus timer</span>
        <h1 style={{ marginTop: 12 }}>Set your focus time</h1>
        <p className="muted">Pick a length. Blocked apps are sent back to TryNThink until the timer ends.</p>
      </div>

      {savedMessage ? <p style={{ color: 'var(--primary-dark)', marginBottom: 12 }}>{savedMessage}</p> : null}

      <Card title="Duration">
        <div className="row-wrap" style={{ marginBottom: 12 }}>
          {PRESETS.map(m => (
            <Button key={m} variant="secondary" onClick={() => start(m)}>{m} min</Button>
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
            style={{ padding: 10, borderRadius: 8, border: '1px solid #ccc', width: 160 }}
          />
          <Button onClick={() => start(Number(customInput))}>Start custom</Button>
        </div>

        {error ? <p className="error-text" style={{ marginTop: 10 }}>{error}</p> : null}
      </Card>

      <Card title="Apps to block during focus">
        <p className="muted" style={{ marginBottom: 12 }}>
          Choose which AI apps to block. The first time, Android asks you to turn on TryNThink under Accessibility.
        </p>
        {AI_APPS.map(app => (
          <label key={app} className="perm-row" style={{ cursor: 'pointer' }}>
            <span>{app}</span>
            <input type="checkbox" checked={blockedApps.includes(app)} onChange={() => toggleBlock(app)} />
          </label>
        ))}
      </Card>
    </div>
  )
}