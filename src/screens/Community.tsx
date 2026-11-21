import { useEffect, useState } from 'react'
import { Card, Button, TextArea } from '../components/ui'
import { getUser, supabase } from '../lib/db'
import { checkText, BLOCKED_NOTICE } from '../lib/moderation'

type Post = { id: string; body: string; user_id: string; created_at: string }

export default function Community() {
  const [posts, setPosts] = useState<Post[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [mine, setMine] = useState<Set<string>>(new Set())
  const [userId, setUserId] = useState<string | null>(null)
  const [newPost, setNewPost] = useState('')
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = async (uid: string | null) => {
    const { data: p, error: pErr } = await supabase
      .from('community_posts')
      .select('id, body, user_id, created_at')
      .order('created_at', { ascending: false })
      .limit(50)
    if (pErr) throw pErr
    setPosts((p as Post[]) || [])

    const ids = ((p as Post[]) || []).map(x => x.id)
    if (ids.length) {
      const { data: v } = await supabase.from('post_vote_counts').select('post_id, votes').in('post_id', ids)
      const map: Record<string, number> = {}
      ;(v || []).forEach((row: any) => { map[row.post_id] = row.votes })
      setCounts(map)
    }
    if (uid) {
      const { data: mv } = await supabase.from('post_votes').select('post_id').eq('user_id', uid)
      setMine(new Set((mv || []).map((x: any) => x.post_id)))
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const user = await getUser()
        setUserId(user?.id ?? null)
        await load(user?.id ?? null)
      } catch (e: any) {
        setError(e?.message || 'Could not load posts.')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const post = async () => {
    setError('')
    setNotice('')
    const text = newPost.trim()
    if (!text) return
    if (!checkText(text).ok) { setNotice(BLOCKED_NOTICE); return }
    if (!userId) { setError('Sign in to post.'); return }
    setPosting(true)
    const { error: iErr } = await supabase.from('community_posts').insert({ body: text, user_id: userId, votes: 0 })
    setPosting(false)
    if (iErr) { setError(iErr.message); return }
    setNewPost('')
    await load(userId)
  }

  const vote = async (postId: string) => {
    if (!userId) { setError('Sign in to vote.'); return }
    if (mine.has(postId)) return
    const { error: vErr } = await supabase.from('post_votes').insert({ user_id: userId, post_id: postId })
    if (vErr) { setError(vErr.message); return }
    await load(userId)
  }

  const report = async (postId: string) => {
    if (!userId) { setError('Sign in to report.'); return }
    const { error: rErr } = await supabase.from('community_reports').insert({ post_id: postId, user_id: userId })
    setNotice(rErr ? `Could not send the report: ${rErr.message}` : 'Thanks. The post has been reported for review.')
  }

  return (
    <div>
      <div className="hero">
        <span className="tag">Community</span>
        <h1 style={{ marginTop: 12 }}>Share a thought</h1>
        <p className="muted">Keep it respectful. Posts with abusive language are blocked. Everyone can vote once per post.</p>
      </div>

      <Card title="New post">
        <TextArea
          rows={3}
          value={newPost}
          onChange={(e: any) => setNewPost(e.target.value)}
          placeholder={userId ? 'Write your thought...' : 'Sign in to post'}
          disabled={!userId}
        />
        <div style={{ marginTop: 8 }}>
          <Button onClick={post} disabled={posting || !newPost.trim() || !userId}>
            {posting ? 'Posting...' : 'Post'}
          </Button>
        </div>
        {notice ? <p style={{ marginTop: 10, color: 'var(--primary-dark)' }}>{notice}</p> : null}
        {error ? <p className="error-text" style={{ marginTop: 10 }}>{error}</p> : null}
      </Card>

      <Card title="Latest">
        {loading ? (
          <p className="muted">Loading posts...</p>
        ) : posts.length === 0 ? (
          <p className="muted">No posts yet. Be the first to share a thought.</p>
        ) : (
          posts.map(p => {
            const voted = mine.has(p.id)
            return (
              <div key={p.id} style={{ borderBottom: '1px solid #eef2f7', padding: '12px 0' }}>
                <p style={{ whiteSpace: 'pre-wrap' }}>{p.body}</p>
                <div className="row-wrap" style={{ marginTop: 8, alignItems: 'center' }}>
                  <Button variant={voted ? 'ghost' : 'secondary'} onClick={() => vote(p.id)} disabled={voted}>
                    {voted ? 'Voted' : 'Vote'} · {counts[p.id] ?? 0}
                  </Button>
                  <Button variant="ghost" onClick={() => report(p.id)}>Report</Button>
                </div>
              </div>
            )
          })
        )}
      </Card>
    </div>
  )
}