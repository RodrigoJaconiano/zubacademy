import { describe, expect, it } from 'vitest'
import { calculateProgress } from '@/lib/utils/progress'

describe('calculateProgress', () => {
  it('returns 0 when total is 0', () => {
    expect(calculateProgress(0, 0)).toBe(0)
  })

  it('calculates progress percentage correctly', () => {
    expect(calculateProgress(2, 4)).toBe(50)
  })

  it('rounds the result', () => {
    expect(calculateProgress(1, 3)).toBe(33)
  })
})

