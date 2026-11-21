export const LEVELS = [
  { level: 1, name: 'Curious Beginner', start: 0 },
  { level: 2, name: 'Active Learner', start: 50 },
  { level: 3, name: 'Focused Thinker', start: 100 },
  { level: 4, name: 'Independent Thinker', start: 200 },
  { level: 5, name: 'Deep Reasoner', start: 400 },
  { level: 6, name: 'Master Thinker', start: 800 },
]

export function levelInfo(stars: number) {
  let idx = 0
  for (let i = 0; i < LEVELS.length; i++) if (stars >= LEVELS[i].start) idx = i
  const cur = LEVELS[idx]
  const next = LEVELS[idx + 1]
  const percent = next
    ? Math.round(((stars - cur.start) / (next.start - cur.start)) * 100)
    : 100
  return {
    level: idx + 1,
    name: cur.name,
    progress: Math.max(0, Math.min(100, percent)),
    starsToNext: next ? next.start - stars : 0,
    nextName: next ? next.name : null,
  }
}

// Stars scale with the score: 25 base, up to 50 for a strong attempt
export function starsForScore(score: number, alreadyEarned: boolean) {
  if (alreadyEarned) return 0
  return Math.round(15 + (Math.max(0, Math.min(100, score)) / 100) * 35)
}