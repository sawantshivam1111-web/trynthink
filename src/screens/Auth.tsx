import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Card, Button, Input } from '../components/ui'
import { signIn, signUp } from '../lib/db'

function friendly(message: string) {
  const m = message.toLowerCase()
  if (m.includes('security purposes') || m.includes('rate limit') || m.includes('too many')) {
    return 'Too many attempts right now. Please wait a moment.'
  }
  if (m.includes('already registered') || m.includes('already been registered')) {
    return 'This email already has an account. Log in instead.'
  }
  if (m.includes('invalid login')) return 'Email or password is incorrect.'
  if (m.includes('email not confirmed')) return 'Please confirm your email first. Check your inbox.'
  return message
}

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('signup')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const nav = useNavigate()

  useEffect(() => {
    if (cooldown <= 0) return
    const id = window.setInterval(() => setCooldown(c => (c > 0 ? c - 1 : 0)), 1000)
    return () => window.clearInterval(id)
  }, [cooldown])

  const submit = async () => {
    if (loading || cooldown > 0) return
    setError('')
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !password) {
      setError('Please enter email and password')
      return
    }
    if (mode === 'signup' && password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    try {
      const res = mode === 'signup'
        ? await signUp(cleanEmail, password)
        : await signIn(cleanEmail, password)
      if (res.error) {
        const wait = res.error.message.match(/(\d+)\s*seconds?/i)
        if (wait) setCooldown(Number(wait[1]))
        setError(friendly(res.error.message))
      } else {
        nav('/permissions')
      }
    } catch (e: any) {
      setError(friendly(e?.message || 'Something went wrong. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  const busy = loading || cooldown > 0
  const buttonLabel = loading
    ? 'Please wait...'
    : cooldown > 0
      ? `Try again in ${cooldown}s`
      : mode === 'signup' ? 'Create Account' : 'Log In'

  return (
    <div className="auth-wrap">
      <div className="hero" style={{ marginTop: 20 }}>
        <span className="tag">TryNThink · Think First</span>
        <h1 style={{ marginTop: 12 }}>Welcome to TryNThink</h1>
        <p className="muted">Think independently. Learn confidently.</p>
      </div>

      <Card title={mode === 'signup' ? 'Create Account' : 'Welcome Back'}>
        <Input
          placeholder="Email address"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e: any) => setEmail(e.target.value)}
        />
        <Input
          placeholder="Password (min 6 characters)"
          type="password"
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          value={password}
          onChange={(e: any) => setPassword(e.target.value)}
          onKeyDown={(e: any) => { if (e.key === 'Enter') submit() }}
        />

        {mode === 'login' && (
          <div style={{ textAlign: 'right', marginTop: 4 }}>
            <Link to="/forgot-password" className="link">Forgot password?</Link>
          </div>
        )}

        {error ? <p className="error-text">{error}</p> : null}

        <div className="row-wrap" style={{ marginTop: 16 }}>
          <Button onClick={submit} disabled={busy}>{buttonLabel}</Button>
          <Button variant="secondary" onClick={() => nav('/permissions')}>
            Continue as Guest
          </Button>
        </div>

        <p className="muted" style={{ marginTop: 16, textAlign: 'center' }}>
          {mode === 'signup' ? 'Already have an account?' : 'Need an account?'}{' '}
          <button
            type="button"
            className="link-btn"
            onClick={() => { setError(''); setMode(mode === 'signup' ? 'login' : 'signup') }}
          >
            {mode === 'signup' ? 'Log in here' : 'Create account'}
          </button>
        </p>
      </Card>
    </div>
  )
}