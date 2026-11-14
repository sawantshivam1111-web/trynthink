import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, Button, Input } from '../components/ui'
import { supabase } from '../lib/db'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const send = async () => {
    setError('')
    if (!email) {
      setError('Please enter your email address')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      })
      if (error) setError(error.message)
      else setSent(true)
    } catch (e: any) {
      setError(e.message || 'Could not send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="hero" style={{ marginTop: 20 }}>
        <span className="tag">Account recovery</span>
        <h1 style={{ marginTop: 12 }}>Reset your password</h1>
        <p className="muted">We'll email you a link to set a new password.</p>
      </div>

      <Card title="Forgot Password">
        {sent ? (
          <>
            <p>Check your inbox. If an account exists for <strong>{email}</strong>, a reset link is on its way.</p>
            <div style={{ marginTop: 16 }}>
              <Link to="/auth" className="link">Back to log in</Link>
            </div>
          </>
        ) : (
          <>
            <Input
              placeholder="Email address"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e: any) => setEmail(e.target.value)}
              onKeyDown={(e: any) => { if (e.key === 'Enter') send() }}
            />
            {error ? <p className="error-text">{error}</p> : null}
            <div className="row-wrap" style={{ marginTop: 16 }}>
              <Button onClick={send} disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
              <Link to="/auth" className="link" style={{ alignSelf: 'center' }}>Cancel</Link>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}