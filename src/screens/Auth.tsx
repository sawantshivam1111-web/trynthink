import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Card, Button, Input } from '../components/ui'
import { signIn, signUp, supabase } from '../lib/db'

function friendly(message: string) {
  const m = message.toLowerCase()
  if (m.includes('security purposes') || m.includes('rate limit') || m.includes('too many')) {
    return 'Too many attempts right now. Please wait a moment.'
  }
  if (m.includes('already registered') || m.includes('already been registered')) {
    return 'This email already has an account. Log in instead.'
  }
  if (m.includes('invalid login')) return 'Email or password is incorrect.'
  if (m.includes('email not confirmed')) return 'NOT_CONFIRMED'
  return message
}

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('signup')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
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
    setNotice('')
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
        const msg = friendly(res.error.message)
        setError(msg === 'NOT_CONFIRMED'
          ? 'Your account is not confirmed yet. Check your inbox and spam folder for the link, or resend it below.'
          : msg)
      } else if (mode === 'signup' && !res.data?.session) {
        setNotice('Almost done! We sent a confirmation link to your email. Open it, then log in here.')
        setMode('login')
      } else {
        nav('/permissions')
      }
    } catch (e: any) {
      setError(friendly(e?.message || 'Something went wrong. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  const resend = async () => {
    if (loading || cooldown > 0) return
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail) {
      setError('Enter your email above first.')
      return
    }
    setLoading(true)
    setError('')
    const { error: rErr } = await supabase.auth.resend({ type: 'signup', email: cleanEmail })
    setLoading(false)
    if (rErr) {
      const wait = rErr.message.match(/(\d+)\s*seconds?/i)
      if (wait) setCooldown(Number(wait[1]))
      setError(friendly(rErr.message))
    } else {
      setNotice('Confirmation email sent. Check your inbox and spam folder, then log in.')
    }
  }

  const busy = loading || cooldown > 0
  const buttonLabel = loading
    ? 'Please wait...'
    : cooldown > 0
      ? `Try again in ${cooldown}s`
      : mode === 'signup' ? 'Create Account' : 'Log In'
  const needsConfirm = error.startsWith('Your account is not confirmed')

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

        {notice ? <p style={{ color: 'var(--primary-dark)', marginTop: 10 }}>{notice}</p> : null}
        {error ? <p className="error-text" style={{ marginTop: 10 }}>{error}</p> : null}

        <div className="row-wrap" style={{ marginTop: 16 }}>
          <Button onClick={submit} disabled={busy}>{buttonLabel}</Button>
          <Button variant="secondary" onClick={() => nav('/permissions')}>Continue as Guest</Button>
        </div>

        {needsConfirm ? (
          <div style={{ marginTop: 12 }}>
            <Button variant="secondary" onClick={resend} disabled={busy}>
              Resend confirmation email
            </Button>
          </div>
        ) : null}

        <p className="muted" style={{ marginTop: 16, textAlign: 'center' }}>
          {mode === 'signup' ? 'Already have an account?' : 'Need an account?'}{' '}
          <button
            type="button"
            className="link-btn"
            onClick={() => { setError(''); setNotice(''); setMode(mode === 'signup' ? 'login' : 'signup') }}
          >
            {mode === 'signup' ? 'Log in here' : 'Create account'}
          </button>
        </p>
      </Card>
    </div>
  )
}