import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Card, Button, Input } from '../components/ui'
import { signIn, signUp } from '../lib/db'

export default function Auth() {
  const nav = useNavigate()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const clean = (s: string) => s.trim().toLowerCase()

  const submit = async () => {
    setError('')
    setInfo('')
    if (!email.trim() || password.length < 6) {
      setError('Enter your email and a password of at least 6 characters.')
      return
    }
    setBusy(true)
    try {
      if (mode === 'login') {
        const { error: e } = await signIn(clean(email), password)
        if (e) {
          const msg = e.message?.toLowerCase() || ''
          if (msg.includes('not confirmed')) setError('This account needs email confirmation. Ask the admin to turn off "Confirm email" in Supabase.')
          else if (msg.includes('invalid login')) setError('Wrong email or password. If you have no account yet, tap "Create account" below.')
          else setError(e.message)
          return
        }
        nav('/home', { replace: true })
      } else {
        const { data, error: e } = await signUp(clean(email), password)
        if (e) {
          const msg = e.message?.toLowerCase() || ''
          if (msg.includes('already')) setError('This email is already registered. Tap "Log in" below and sign in with your password.')
          else setError(e.message)
          return
        }
        if (data?.session) {
          nav('/home', { replace: true })
        } else {
          setInfo('Account created. Sign in with the same email and password.')
          setMode('login')
        }
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-wrap" style={{ paddingTop: 40 }}>
      <div className="hero">
        <span className="tag">TryNThink · Think First</span>
        <h1 style={{ marginTop: 12 }}>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
        <p className="muted">{mode === 'login' ? 'Sign in to continue your progress.' : 'It takes a few seconds. You only do this once.'}</p>
      </div>

      <Card>
        <Input placeholder="Email" type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} autoComplete="email" />
        <Input placeholder="Password (at least 6 characters)" type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
        <div style={{ marginTop: 12 }}>
          <Button onClick={submit} disabled={busy}>
            {busy ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Create account'}
          </Button>
        </div>
        {info ? <p style={{ color: 'var(--primary-dark)', marginTop: 10 }}>{info}</p> : null}
        {error ? <p className="error-text">{error}</p> : null}
      </Card>

      <p className="muted" style={{ textAlign: 'center', marginTop: 12 }}>
        {mode === 'login' ? (
          <>New here? <button className="link-btn" onClick={() => { setMode('signup'); setError(''); setInfo('') }}>Create account</button></>
        ) : (
          <>Already have an account? <button className="link-btn" onClick={() => { setMode('login'); setError(''); setInfo('') }}>Log in</button></>
        )}
      </p>
      <p style={{ textAlign: 'center', marginTop: 8 }}>
        <Link to="/home" className="link">Continue as guest</Link>
      </p>
    </div>
  )
}