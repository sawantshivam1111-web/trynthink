import { useEffect, useState } from 'react'
import { Card, Button, Input } from '../components/ui'
import { getUser } from '../lib/db'
import { loadPosts, createPost, upvotePost, Post } from '../lib/data'

export default function Community() {
  const [posts, setPosts] = useState<Post[]>([])
  const [newPost, setNewPost] = useState('')
  const [signedIn, setSignedIn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')
  const [voted, setVoted] = useState<Set<string>>(new Set())

  const refresh = async () => setPosts(await loadPosts())

  useEffect(() => {
    (async () => {
      try {
        const user = await getUser()
        setSignedIn(!!user)
        await refresh()
      } catch (e: any) {
        setError(e.message || 'Could not load posts')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const handlePost = async () => {
    const text = newPost.trim()
    if (!text) return
    setError('')
    setPosting(true)
    try {
      await createPost(text)
      setNewPost('')
      await refresh()
    } catch (e: any) {
      setError(e.message || 'Could not post')
    } finally {
      setPosting(false)
    }
  }

  const upvote = async (id: string) => {
    setError('')
    if (!signedIn) {
      setError('Sign in to upvote posts.')
      return
    }
    if (voted.has(id)) return
    try {
      const newVotes = await upvotePost(id)
      setPosts(prev => prev.map(p => (p.id === id ? { ...p, votes: newVotes } : p)))
      setVoted(prev => new Set(prev).add(id))
    } catch (e: any) {
      setError(
        e.message?.includes('duplicate')
          ? 'You have already upvoted this post.'
          : e.message || 'Could not upvote'
      )
    }
  }

  return (
    <div>
      <div className="hero">
        <span className="tag">Anonymous community</span>
        <h1 style={{ marginTop: 12 }}>Share how you think</h1>
        <p className="muted">Strategies from students who think before they ask AI.</p>
      </div>

      {signedIn ? (
        <Card title="Share your thinking strategy">
          <Input
            placeholder="Share an insight or study trick..."
            value={newPost}
            onChange={(e: any) => setNewPost(e.target.value)}
            onKeyDown={(e: any) => { if (e.key === 'Enter') handlePost() }}
          />
          <div style={{ marginTop: 8 }}>
            <Button onClick={handlePost} disabled={posting || !newPost.trim()}>
              {posting ? 'Posting...' : 'Post anonymously'}
            </Button>
          </div>
        </Card>
      ) : (
        <p className="muted" style={{ marginBottom: 12 }}>Sign in to share a post.</p>
      )}

      {error ? <p className="error-text">{error}</p> : null}

      {loading ? (
        <p className="muted">Loading posts…</p>
      ) : posts.length === 0 ? (
        <p className="muted">No posts yet. Be the first to share a strategy.</p>
      ) : (
        posts.map(p => (
          <Card key={p.id}>
            <p className="post-body">“{p.body}”</p>
            <div className="row" style={{ justifyContent: 'space-between', marginTop: 12 }}>
              <span className="tag">
                👍 {p.votes} upvotes{p.mine ? ' · Your post' : ''}
              </span>
              <Button
                variant="ghost"
                onClick={() => upvote(p.id)}
                disabled={voted.has(p.id) || p.mine}
              >
                {voted.has(p.id) ? 'Upvoted' : 'Upvote'}
              </Button>
            </div>
          </Card>
        ))
      )}
    </div>
  )
}