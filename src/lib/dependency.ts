export type DependencyLog = { independent: number; assisted: number; dependent: number }

export function calcDependency(sessions: { type: string; aiUsed: boolean }[]): DependencyLog {
  // No data yet: an empty meter starts at 100% independent
  if (sessions.length === 0) return { independent: 100, assisted: 0, dependent: 0 }

  let ind = 0, dep = 0
  sessions.forEach(s => {
    if (s.type === 'break') ind++            // a thinking break counts as independent
    else if (s.aiUsed) dep++                  // AI used during the challenge: dependent
    else ind++                                // challenge solved without AI: independent
  })

  const total = sessions.length
  const independent = Math.round((ind / total) * 100)
  const dependent = Math.round((dep / total) * 100)
  return { independent, assisted: 0, dependent: 100 - independent }
}