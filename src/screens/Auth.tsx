import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Card, Button, Input } from '../components/ui'
import { signIn, signUp } from '../lib/db'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('signup')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const nav = useNavigate()

  const submit = async () => {
    setError('')
    if (!email || !password) {
      setError('Please enter email and password')
      return
    }
    setLoading(true)
    try {
      const res = mode === 'signup'
        ? await signUp(email, password)
        : await signIn(email, password)
      if (res.error) setError(res.error.message)
      else nav('/permissions')
    } catch (e: any) {
      setError(e.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

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
          <Button onClick={submit} disabled={loading}>
            {loading ? 'Please wait...' : mode === 'signup' ? 'Create Account' : 'Log In'}
          </Button>
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