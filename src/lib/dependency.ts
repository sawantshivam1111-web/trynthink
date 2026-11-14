export type DependencyLog = { independent: number; assisted: number; dependent: number }

export function calcDependency(sessions: { type: string; aiUsed: boolean }[]): DependencyLog {
  // No data yet: the spec says an empty meter starts at 100% independent
  if (sessions.length === 0) return { independent: 100, assisted: 0, dependent: 0 }

  let ind = 0, ast = 0, dep = 0
  sessions.forEach(s => {
    if (s.type === 'break') ind++
    else if (s.aiUsed) dep++
    else if (s.type === 'challenge') ast++
    else ind++
  })

  const total = sessions.length
  return {
    independent: Math.round((ind / total) * 100),
    assisted: Math.round((ast / total) * 100),
    dependent: Math.round((dep / total) * 100),
  }
}
