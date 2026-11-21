import { describe, it, expect } from 'vitest'
import { getLevel } from '../src/lib/levels'
import { calculateThinkingScore } from '../src/lib/scoring'

describe('scoring', () => {
  it('level thresholds', () => expect(getLevel(150).level).toBe('Focused Thinker'))
  it('thinking score without try', () => expect(calculateThinkingScore(100, false)).toBe(20))
})