import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, Button } from '../components/ui'
import ThemeStudio from '../components/ThemeStudio'
import BadgeShelf from '../components/BadgeShelf'
import { levelInfo } from '../lib/levels'
import { getUser, supabase, signOut } from '../lib/db'

export default function Profile() {
  const nav = useNavigate()
  const [loading, setLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [stars, setStars] = useState(Number(localStorage.getItem('stars') || '0'))
  const [visible, setVisible] = useState(false)
  const [rank, setRank] = useState<number | null>(null)
  const [method, setMethod] = useState<string | null>(null)
  const [strength, setStrength] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [nameSaved, setNameSaved] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadRank = async (s: number, isVisible: boolean) => {
    if (!isVisible || s <= 0) { setRank(null); return }
    const { count, error: rErr } = await supabase
      .from('profiles').select('id', { count: 'exact', head: true })
      .eq('profile_visible', true).gt('stars', s)
    if (rErr) { setRank(null); return }
    setRank((count ?? 0) + 1)
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const user = await getUser()
        if (!user) { if (!cancelled) setLoading(false); return }
        if (cancelled) return
        setIsGuest(false)
        setUserId(user.id)
        setEmail(user.email || null)

        let { data: profile, error: pErr } = await supabase
          .from('profiles')
          .select('stars, profile_visible, display_name, avatar_url')
          .eq('id', user.id)
          .maybeSingle()
        if (pErr) throw new Error(`Could not read your profile: ${pErr.message}`)
        if (!profile) {
          const { error: insErr } = await supabase.from('profiles').insert({ id: user.id, stars: 0, profile_visible: false })
          if (insErr) throw new Error(`Could not create your profile: ${insErr.message}`)
          profile = { stars: 0, profile_visible: false, display_name: null, avatar_url: null } as any
        }

        const s = profile?.stars ?? 0
        const isVisible = !!profile?.profile_visible
        if (cancelled) return
        setStars(s)
        setVisible(isVisible)
        setName(profile?.display_name ?? '')
        setAvatarUrl(profile?.avatar_url ?? null)
        localStorage.setItem('stars', String(s))
        await loadRank(s, isVisible)

        const { data: tp } = await supabase.from('thinking_profile').select('method, strengths').eq('user_id', user.id).maybeSingle()
        if (!cancelled && tp) {
          setMethod(tp.method || null)
          setStrength(Array.isArray(tp.strengths) && tp.strengths.length ? tp.strengths[0] : null)
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Could not load your profile.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const saveName = async () => {
    if (!userId) return
    setError('')
    setNameSaved(false)
    const clean = name.trim().slice(0, 30)
    const { error: nErr } = await supabase.from('profiles').update({ display_name: clean }).eq('id', userId)
    if (nErr) setError(`Could not save your name: ${nErr.message}`)
    else setNameSaved(true)
  }

  const uploadPhoto = async (file: File) => {
    if (!userId) return
    setError('')
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setError('Please choose a JPG, PNG, or WebP image.'); return }
    if (file.size > 2 * 1024 * 1024) { setError('Please choose an image under 2 MB.'); return }
    setPhotoBusy(true)
    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
    const path = `${userId}/avatar.${ext}`
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type })
    if (upErr) { setError(`Could not upload your photo: ${upErr.message}`); setPhotoBusy(false); return }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    const url = `${data.publicUrl}?v=${Date.now()}`
    const { error: uErr } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', userId)
    if (uErr) setError(`Could not save your photo: ${uErr.message}`)
    else setAvatarUrl(url)
    setPhotoBusy(false)
  }

  const toggleVisible = async () => {
    if (!userId) return
    setSaving(true)
    setError('')
    const next = !visible
    const { error: uErr } = await supabase.from('profiles').update({ profile_visible: next }).eq('id', userId)
    if (uErr) setError(`Could not update your visibility: ${uErr.message}`)
    else { setVisible(next); await loadRank(stars, next) }
    setSaving(false)
  }

  const logout = async () => {
    await signOut()
    localStorage.removeItem('stars')
    nav('/auth')
  }

  if (loading) return <p className="muted">Loading your profile...</p>

  if (isGuest) {
    return (
      <div>
        <div className="hero">
          <span className="tag">Your profile</span>
          <h1 style={{ marginTop: 12 }}>Guest profile</h1>
          <p className="muted">Your progress is saved only on this device. Sign in to keep it, add a name and photo, and appear on the leaderboard.</p>
        </div>
        <Card>
          <p className="muted" style={{ marginBottom: 12 }}>Stars on this device: {stars} ★</p>
          <Button onClick={() => nav('/auth')}>Sign in</Button>
        </Card>
        <ThemeStudio />
      </div>
    )
  }

  const lvl = levelInfo(stars)
  const initial = (name.trim() || email || 'T').charAt(0).toUpperCase()

  return (
    <div>
      <div className="hero">
        <span className="tag">Your profile</span>
        <h1 style={{ marginTop: 12 }}>Your thinking profile</h1>
      </div>

      <Card>
        <div className="row" style={{ alignItems: 'center', gap: 14 }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="Your profile" style={{ width: 64, height: 64, borderRadius: 16, objectFit: 'cover' }} />
          ) : (
            <div className="avatar" style={{ width: 64, height: 64, fontSize: 24 }}>{initial}</div>
          )}
          <div style={{ flex: 1 }}>
            <h2 style={{ color: 'var(--text)' }}>{name.trim() || 'Add your name below'}</h2>
            <div className="muted">{lvl.name} · {email}</div>
          </div>
        </div>

        <div className="row-wrap" style={{ marginTop: 16, justifyContent: 'space-between' }}>
          <div style={{ textAlign: 'center', flex: 1 }}><h2>{stars} ★</h2><div className="muted">Stars</div></div>
          <div style={{ textAlign: 'center', flex: 1 }}><h2>{lvl.level}</h2><div className="muted">Level</div></div>
          <div style={{ textAlign: 'center', flex: 1 }}><h2>{rank ? `#${rank}` : 'Not ranked'}</h2><div className="muted">Rank</div></div>
        </div>

        <p className="muted" style={{ marginTop: 14 }}>
          {lvl.nextName ? `${lvl.starsToNext} more stars to reach ${lvl.nextName}.` : 'You have reached the highest level.'}
        </p>
        <div className="progress" style={{ marginTop: 8 }}><span style={{ width: `${lvl.progress}%` }} /></div>
      </Card>

      <Card title="Your name and photo">
        <p className="muted" style={{ marginBottom: 10 }}>Your name and photo appear on the leaderboard.</p>
        <div className="row-wrap" style={{ alignItems: 'center' }}>
          <input
            type="text"
            maxLength={30}
            placeholder="Enter your name"
            value={name}
            onChange={e => { setName(e.target.value); setNameSaved(false) }}
            className="input"
            style={{ flex: 1, minWidth: 180, margin: 0 }}
          />
          <Button onClick={saveName} disabled={!name.trim()}>Save name</Button>
        </div>
        {nameSaved ? <p style={{ color: 'var(--primary-dark)', marginTop: 8 }}>Name saved.</p> : null}

        <div style={{ marginTop: 14 }}>
          <label className="muted" style={{ display: 'block', marginBottom: 6 }}>Profile photo (optional, under 2 MB)</label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            disabled={photoBusy}
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadPhoto(f) }}
          />
          {photoBusy ? <p className="muted" style={{ marginTop: 6 }}>Uploading your photo...</p> : null}
        </div>
      </Card>

      <BadgeShelf stars={stars} />

      <Card>
        <p className="muted" style={{ marginBottom: 10 }}>
          {visible ? 'Your name, photo, and rank are public on the leaderboard.' : 'You are not on the leaderboard. Turn on a public profile to appear.'}
        </p>
        <Button variant="secondary" onClick={toggleVisible} disabled={saving}>
          {saving ? 'Saving...' : visible ? 'Hide my profile' : 'Show my profile on leaderboard'}
        </Button>
      </Card>

      <Card title="Thinking profile summary">
        {method || strength ? (
          <div className="feedback">
            <p><strong>Primary strategy:</strong> {method || 'Not enough data yet'}</p>
            <p><strong>Strength:</strong> {strength || 'Not enough data yet'}</p>
          </div>
        ) : (
          <p className="muted">Not enough data yet. Complete a challenge or a test to build your thinking profile.</p>
        )}
      </Card>

      <ThemeStudio />

      <Card title="Account">
        <div className="row-wrap">
          <Link to="/permissions" style={{ textDecoration: 'none' }}><Button variant="secondary">Permissions &amp; privacy</Button></Link>
          <Link to="/leaderboard" style={{ textDecoration: 'none' }}><Button variant="secondary">View leaderboard</Button></Link>
          <Link to="/achievements" style={{ textDecoration: 'none' }}><Button variant="secondary">Achievements &amp; badges</Button></Link>
          <Button variant="ghost" onClick={logout}>Sign out</Button>
        </div>
      </Card>

      {error ? <p className="error-text">{error}</p> : null}
    </div>
  )
}