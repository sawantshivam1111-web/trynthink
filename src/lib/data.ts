import { supabase, getUser } from './db'
import type { Badge, Permissions, Period } from '../types'

export const DEFAULT_PERMISSIONS: Permissions = {
  notifications: false,
  screenUsage: false,
  accessibility: false,
  internet: true,
  profileVisibility: false,
}

export type Stats = {
  breaks: number
  challenges: number
  independent: number
  distinctChallenges: number
  streakDays: number
  communityVotes: number
}

export const DEFAULT_STATS: Stats = {
  breaks: 0,
  challenges: 0,
  independent: 0,
  distinctChallenges: 0,
  streakDays: 0,
  communityVotes: 0,
}

export type LeaderRow = {
  user_id: string
  display_name: string
  total_stars: number
  is_me: boolean
}

export type Post = {
  id: string
  body: string
  votes: number
  mine: boolean
}

/* ---------- Permissions ---------- */

export async function loadPermissions(userId: string): Promise<Permissions> {
  const { data, error } = await supabase
    .from('permissions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  if (!data) return DEFAULT_PERMISSIONS
  return {
    notifications: !!data.notifications,
    screenUsage: !!data.usage_opt_in,
    accessibility: !!data.accessibility,
    internet: data.internet ?? true,
    profileVisibility: !!data.profile_visibility,
  }
}

export async function setProfileVisibility(userId: string, visible: boolean) {
  const [perm, prof] = await Promise.all([
    supabase.from('permissions').upsert({ user_id: userId, profile_visibility: visible }),
    supabase.from('profiles').update({ profile_visible: visible }).eq('id', userId),
  ])
  if (perm.error) throw perm.error
  if (prof.error) throw prof.error
}

export async function savePermissions(userId: string, p: Permissions) {
  const { error } = await supabase.from('permissions').upsert({
    user_id: userId,
    notifications: p.notifications,
    usage_opt_in: p.screenUsage,
    accessibility: p.accessibility,
    internet: p.internet,
    profile_visibility: p.profileVisibility,
  })
  if (error) throw error
  await setProfileVisibility(userId, p.profileVisibility)
}

/* ---------- Stats & badges ---------- */

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`

function countStreak(timestamps: string[]): number {
  const days = new Set(timestamps.map(t => dayKey(new Date(t))))
  const cursor = new Date()
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1)
  let streak = 0
  while (days.has(dayKey(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export async function loadStats(userId: string): Promise<Stats> {
  const [sessionsRes, responsesRes, postsRes] = await Promise.all([
    supabase.from('sessions').select('type, created_at').eq('user_id', userId),
    supabase
      .from('responses')
      .select('challenge_id, ai_assist_level')
      .eq('user_id', userId)
      .eq('submitted', true),
    supabase.from('community_posts').select('votes').eq('user_id', userId),
  ])
  for (const r of [sessionsRes, responsesRes, postsRes]) {
    if (r.error) throw r.error
  }

  const sessions = sessionsRes.data ?? []
  const responses = responsesRes.data ?? []
  const posts = postsRes.data ?? []

  return {
    breaks: sessions.filter((s: any) => s.type === 'break').length,
    challenges: responses.length,
    independent: responses.filter((r: any) => r.ai_assist_level === 'none').length,
    distinctChallenges: new Set(responses.map((r: any) => r.challenge_id)).size,
    streakDays: countStreak(sessions.map((s: any) => s.created_at)),
    communityVotes: posts.reduce((sum: number, p: any) => sum + (p.votes ?? 0), 0),
  }
}

export function buildBadges(s: Stats): Badge[] {
  return [
    {
      name: 'First Thinker',
      icon: '🧠',
      desc: 'Complete your first thinking break or challenge.',
      unlocked: s.breaks + s.challenges >= 1,
    },
    {
      name: 'Independent Mind',
      icon: '💡',
      desc: 'Submit 5 challenges without AI assistance.',
      unlocked: s.independent >= 5,
    },
    {
      name: 'Creative Explorer',
      icon: '🧭',
      desc: 'Try 3 different challenge topics.',
      unlocked: s.distinctChallenges >= 3,
    },
    {
      name: 'Consistent Learner',
      icon: '🔥',
      desc: 'Keep a 7-day thinking streak.',
      unlocked: s.streakDays >= 7,
    },
    {
      name: 'Community Contributor',
      icon: '🤝',
      desc: 'Get 10 upvotes on your posts.',
      unlocked: s.communityVotes >= 10,
    },
    {
      name: 'AI-Free Champion',
      icon: '🏆',
      desc: 'Complete 10 breaks with no AI use.',
      unlocked: s.breaks >= 10,
    },
  ]
}

/* ---------- Leaderboard ---------- */

export async function loadLeaderboard(period: Period): Promise<LeaderRow[]> {
  const days = period === 'Weekly' ? 7 : period === 'Monthly' ? 30 : null
  const { data, error } = await supabase.rpc('get_leaderboard', { p_days: days })
  if (error) throw error
  return (data ?? []) as LeaderRow[]
}

/* ---------- Community ---------- */

export async function loadPosts(): Promise<Post[]> {
  const user = await getUser()
  const { data, error } = await supabase
    .from('community_posts')
    .select('id, body, votes, user_id')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return (data ?? []).map((p: any) => ({
    id: p.id,
    body: p.body,
    votes: p.votes ?? 0,
    mine: !!user && p.user_id === user.id,
  }))
}

export async function createPost(body: string) {
  const user = await getUser()
  if (!user) throw new Error('Sign in to post')
  const { error } = await supabase
    .from('community_posts')
    .insert({ user_id: user.id, body })
  if (error) throw error
}

export async function upvotePost(postId: string): Promise<number> {
  const { data, error } = await supabase.rpc('upvote_post', { p_post: postId })
  if (error) throw error
  return Number(data)
}