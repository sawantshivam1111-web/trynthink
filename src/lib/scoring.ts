export const LEVELS = [
  'Curious Beginner',
  'Active Learner',
  'Independent Thinker',
  'Creative Explorer',
  'Critical Thinker',
  'Master Thinker',
]

export const LEVEL_THRESHOLDS = [0, 30, 75, 130, 200, 300]

export function getLevel(stars: number) {
  let idx = 0
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (stars >= LEVEL_THRESHOLDS[i]) {
      idx = i
      break
    }
  }
  const curr = LEVEL_THRESHOLDS[idx]
  const isMax = idx === LEVEL_THRESHOLDS.length - 1
  const next = isMax ? curr : LEVEL_THRESHOLDS[idx + 1]
  const progress = isMax
    ? 100
    : Math.min(100, Math.round(((stars - curr) / (next - curr)) * 100))
  return { level: LEVELS[idx], index: idx, progress, next }
}

export function calculateThinkingScore(wordCount: number, triedFirst: boolean) {
  if (!triedFirst) return 20
  if (wordCount < 10) return 40
  if (wordCount < 50) return 70
  return 95
}