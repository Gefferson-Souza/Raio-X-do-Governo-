import { describe, it, expect } from 'vitest'
import { formatBRL, humanizeNumber, humanizeCount } from '@/lib/utils/format'

describe('formatBRL', () => {
  it('formats large integers with thousand separators', () => {
    expect(formatBRL(1500000)).toBe('R$ 1.500.000,00')
  })

  it('formats zero', () => {
    expect(formatBRL(0)).toBe('R$ 0,00')
  })

  it('formats decimals correctly', () => {
    expect(formatBRL(1234.56)).toBe('R$ 1.234,56')
  })

  it('formats negative values', () => {
    expect(formatBRL(-500)).toBe('-R$ 500,00')
  })

  it('formats small decimal values', () => {
    expect(formatBRL(0.99)).toBe('R$ 0,99')
  })
})

describe('humanizeNumber', () => {
  it('humanizes trillions', () => {
    expect(humanizeNumber(1_200_000_000_000)).toBe('R$ 1,2 trilhoes')
  })

  it('humanizes exact trillion', () => {
    expect(humanizeNumber(1_000_000_000_000)).toBe('R$ 1,0 trilhoes')
  })

  it('humanizes billions', () => {
    expect(humanizeNumber(1_200_000_000)).toBe('R$ 1,2 bilhoes')
  })

  it('humanizes millions', () => {
    expect(humanizeNumber(45_000_000)).toBe('R$ 45,0 milhoes')
  })

  it('humanizes thousands', () => {
    expect(humanizeNumber(1_500)).toBe('R$ 1,5 mil')
  })

  it('formats values below 1000 as full BRL', () => {
    expect(humanizeNumber(500)).toBe('R$ 500,00')
  })

  it('humanizes exact billion', () => {
    expect(humanizeNumber(1_000_000_000)).toBe('R$ 1,0 bilhoes')
  })

  it('humanizes exact million', () => {
    expect(humanizeNumber(1_000_000)).toBe('R$ 1,0 milhoes')
  })

  it('humanizes exact thousand', () => {
    expect(humanizeNumber(1_000)).toBe('R$ 1,0 mil')
  })
})

describe('humanizeCount', () => {
  it('humanizes trillions without R$ prefix', () => {
    expect(humanizeCount(2_400_000_000_000)).toBe('2,4 trilhoes')
  })

  it('humanizes exact trillion without R$ prefix', () => {
    expect(humanizeCount(1_000_000_000_000)).toBe('1,0 trilhoes')
  })

  it('humanizes billions without R$ prefix', () => {
    expect(humanizeCount(3_500_000_000)).toBe('3,5 bilhoes')
  })

  it('humanizes millions without R$ prefix', () => {
    expect(humanizeCount(45_000_000)).toBe('45,0 milhoes')
  })

  it('humanizes thousands without R$ prefix', () => {
    expect(humanizeCount(1_500)).toBe('1,5 mil')
  })

  it('formats values below 1000 as locale number without R$', () => {
    expect(humanizeCount(500)).toBe('500')
  })

  it('formats zero', () => {
    expect(humanizeCount(0)).toBe('0')
  })

  it('formats single digit', () => {
    expect(humanizeCount(7)).toBe('7')
  })

  it('formats value with decimal locale separator', () => {
    expect(humanizeCount(999)).toBe('999')
  })

  it('never includes R$ symbol', () => {
    const values = [100, 1_500, 2_000_000, 3_000_000_000, 4_000_000_000_000]
    for (const v of values) {
      expect(humanizeCount(v)).not.toContain('R$')
    }
  })
})
