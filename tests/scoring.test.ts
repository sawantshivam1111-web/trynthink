import { describe, it, expect } from 'vitest'
import { getLevel, calculateThinkingScore } from '../src/lib/scoring'

describe('scoring', () => {
  it('level thresholds', () => expect(getLevel(150).level).toBe('Creative Explorer'))
  it('thinking score without try', () => expect(calculateThinkingScore(100, false)).toBe(20))
})
