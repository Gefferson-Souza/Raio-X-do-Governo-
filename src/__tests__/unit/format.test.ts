import { describe, it, expect } from 'vitest'
import { formatBRL, humanizeNumber } from '@/lib/utils/format'

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
