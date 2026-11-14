import { describe, it, expect } from 'vitest'
import { calcDependency } from '../src/lib/dependency'
describe('dependency', ()=>{
  it('empty = 100% independent', ()=> expect(calcDependency([]).independent).toBe(100))
  it('mix', ()=> expect(calcDependency([{type:'break',aiUsed:false},{type:'challenge',aiUsed:true}]).dependent).toBe(50))
})