import { useEffect, useState } from 'react'
import { Card, Button, TextArea } from '../components/ui'
import { getUser, supabase } from '../lib/db'
import { checkText, BLOCKED_NOTICE } from '../lib/moderation'

type Post = {
  id: string
  body: string
  votes: number
  user_id: string
  created_at: string
}

export default function Community() {
  const [posts, setPosts] = useState<Post[]>([])
  const [newPost, setNewPost] = useState('')
  const [signedIn, setSignedIn] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [voted, setVoted] = useState<Set<string>>(new Set())

  const load = async () => {
    const { data, error: qErr } = await supabase
      .from('community_posts')
      .select('id, body, votes, user_id, created_at')
      .order('created_at', { ascending: false })
      .limit(50)
    if (qErr) throw qErr
    setPosts((data as Post[]) || [])
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const user = await getUser()
        if (!cancelled) {
          setSignedIn(!!user)
          setUserId(user?.id ?? null)
        }
        await load()
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Could not load posts.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const post = async () => {
    setError('')
    setNotice('')
    const text = newPost.trim()
    if (!text) return

    const check = checkText(text)
    if (!check.ok) {
      setNotice(BLOCKED_NOTICE)
      return
    }

    if (!signedIn || !userId) {
      setError('Sign in to post in the community.')
      return
    }

    setPosting(true)
    try {
      const { error: iErr } = await supabase
        .from('community_posts')
        .insert({ body: text, user_id: userId, votes: 0 })
      if (iErr) throw iErr
      setNewPost('')
      await load()
    } catch (e: any) {
      setError(e?.message || 'Could not post. Please try again.')
    } finally {
      setPosting(false)
    }
  }

  const reportPost = async (id: string) => {
    setError('')
    const user = await getUser()
    if (!user) {
      setError('Sign in to report a post.')
      return
    }
    const { error: rErr } = await supabase
      .from('community_reports')
      .insert({ post_id: id, user_id: user.id })
    setNotice(rErr ? `Could not send the report: ${rErr.message}` : 'Thanks. The post has been reported for review.')
  }

  const vote = async (id: string) => {
    if (voted.has(id)) return
    if (!signedIn) {
      setError('Sign in to vote.')
      return
    }
    const next = new Set(voted)
    next.add(id)
    setVoted(next)
    const current = posts.find(p => p.id === id)
    if (!current) return
    await supabase.from('community_posts').update({ votes: (current.votes || 0) + 1 }).eq('id', id)
    await load()
  }

  return (
    <div>
      <div className="hero">
        <span className="tag">Community</span>
        <h1 style={{ marginTop: 12 }}>Share a thought</h1>
        <p className="muted">Keep it respectful. Posts with abusive language are blocked.</p>
      </div>

      <Card title="New post">
        <TextArea
          rows={3}
          value={newPost}
          onChange={(e: any) => setNewPost(e.target.value)}
          placeholder={signedIn ? 'Write your thought...' : 'Sign in to post'}
          disabled={!signedIn}
        />
        <div style={{ marginTop: 8 }}>
          <Button onClick={post} disabled={posting || !newPost.trim() || !signedIn}>
            {posting ? 'Posting...' : 'Post'}
          </Button>
        </div>
        {notice ? <p style={{ marginTop: 10, color: '#b45309' }}>{notice}</p> : null}
        {error ? <p className="error-text" style={{ marginTop: 10 }}>{error}</p> : null}
      </Card>

      <Card title="Latest">
        {loading ? (
          <p className="muted"><span className="skeleton skeleton-line" aria-label="Loading" /></p>
        ) : posts.length === 0 ? (
          <p className="muted">No posts yet. Be the first to share a thought.</p>
        ) : (
          posts.map(p => (
            <div key={p.id} style={{ borderBottom: '1px solid #eef2f7', padding: '12px 0' }}>
              <p style={{ whiteSpace: 'pre-wrap' }}>{p.body}</p>
              <div className="row-wrap" style={{ marginTop: 8, alignItems: 'center' }}>
                <Button
                  variant="secondary"
                  onClick={() => vote(p.id)}
                  disabled={voted.has(p.id)}
                >
                  {voted.has(p.id) ? 'Voted' : 'Vote'} · {p.votes}
                </Button>
                <Button variant="ghost" onClick={() => reportPost(p.id)}>Report</Button>
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  )
}