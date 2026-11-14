import { describe, it, expect } from 'vitest'
import { HINT_LADDER } from '../src/lib/ai'

describe('tutor', () => {
  it('asks before answering', () => expect(HINT_LADDER[0]).toContain('What do you think'))
})
