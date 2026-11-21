export const LEVELS = [
  { level: 1, name: 'Curious Beginner', start: 0 },
  { level: 2, name: 'Active Learner', start: 50 },
  { level: 3, name: 'Focused Thinker', start: 100 },
  { level: 4, name: 'Independent Thinker', start: 175 },
  { level: 5, name: 'Analytical Mind', start: 275 },
  { level: 6, name: 'Deep Reasoner', start: 400 },
  { level: 7, name: 'Strategic Thinker', start: 550 },
  { level: 8, name: 'Master Thinker', start: 750 },
  { level: 9, name: 'Visionary Mind', start: 1000 },
  { level: 10, name: 'Thought Leader', start: 1300 },
  { level: 11, name: 'Sage of Reason', start: 1700 },
  { level: 12, name: 'Legend of Logic', start: 2200 },
]

export function levelInfo(stars: number) {
  let idx = 0
  for (let i = 0; i < LEVELS.length; i++) if (stars >= LEVELS[i].start) idx = i
  const cur = LEVELS[idx]
  const next = LEVELS[idx + 1]
  const progress = next ? Math.round(((stars - cur.start) / (next.start - cur.start)) * 100) : 100
  return {
    level: cur.level,
    name: cur.name,
    total: LEVELS.length,
    progress: Math.max(0, Math.min(100, progress)),
    starsToNext: next ? next.start - stars : 0,
    nextName: next ? next.name : null,
  }
}

// Same as levelInfo, but `level` holds the name, for screens that display the name.
export function getLevel(stars: number) {
  const info = levelInfo(stars)
  return { ...info, level: info.name }
}

// Stars scale with the score: 15 minimum, up to 50 for a strong attempt.
export function starsForScore(score: number, alreadyEarned: boolean) {
  if (alreadyEarned) return 0
  return Math.round(15 + (Math.max(0, Math.min(100, score)) / 100) * 35)
}

export type BadgeStats = { stars: number; challenges: number; bestTest: number; focusMinutes: number }

export const BADGES: { id: string; icon: string; name: string; how: string; test: (s: BadgeStats) => boolean }[] = [
  { id: 'first', icon: '🌱', name: 'First Step', how: 'Complete your first challenge', test: s => s.challenges >= 1 },
  { id: 'explorer', icon: '🧭', name: 'Explorer', how: 'Complete 5 challenges', test: s => s.challenges >= 5 },
  { id: 'pass', icon: '✅', name: 'Quiz Passer', how: 'Score 60% or more on a test', test: s => s.bestTest >= 60 },
  { id: 'ace', icon: '🏆', name: 'Quiz Ace', how: 'Score 90% or more on a test', test: s => s.bestTest >= 90 },
  { id: 'focus', icon: '⏱️', name: 'Focus Hour', how: 'Accumulate 60 focus minutes', test: s => s.focusMinutes >= 60 },
  { id: 'rising', icon: '⭐', name: 'Rising Star', how: 'Reach 100 stars', test: s => s.stars >= 100 },
  { id: 'deep', icon: '💎', name: 'Deep Diver', how: 'Reach 400 stars', test: s => s.stars >= 400 },
  { id: 'visionary', icon: '🔭', name: 'Visionary', how: 'Reach 1000 stars', test: s => s.stars >= 1000 },
  { id: 'legend', icon: '👑', name: 'Legend of Logic', how: 'Reach 2200 stars', test: s => s.stars >= 2200 },
]