import { describe, it, expect } from 'vitest'
import { aggregateByOrgaoSuperior } from '@/lib/utils/aggregate-orgaos'
import type { DespesaPorOrgao } from '@/lib/api/types'

function makeOrgao(overrides: Partial<DespesaPorOrgao>): DespesaPorOrgao {
  return {
    ano: 2026,
    orgao: 'Orgao Teste',
    codigoOrgao: '1',
    orgaoSuperior: 'Ministerio Teste',
    codigoOrgaoSuperior: '10000',
    empenhado: 100,
    liquidado: 80,
    pago: 50,
    ...overrides,
  }
}

describe('aggregateByOrgaoSuperior', () => {
  it('returns empty array for empty input', () => {
    expect(aggregateByOrgaoSuperior([])).toEqual([])
  })

  it('returns single item for single input', () => {
    const result = aggregateByOrgaoSuperior([
      makeOrgao({ orgaoSuperior: 'Ministerio da Saude', pago: 1000, empenhado: 2000 }),
    ])
    expect(result).toHaveLength(1)
    expect(result[0].pago).toBe(1000)
    expect(result[0].empenhado).toBe(2000)
    expect(result[0].percentOfTotal).toBe(100)
  })

  it('aggregates sub-organs by orgaoSuperior', () => {
    const result = aggregateByOrgaoSuperior([
      makeOrgao({ orgaoSuperior: 'Ministerio da Saude', orgao: 'Secretaria A', pago: 300, empenhado: 500 }),
      makeOrgao({ orgaoSuperior: 'Ministerio da Saude', orgao: 'Secretaria B', pago: 200, empenhado: 300 }),
      makeOrgao({ orgaoSuperior: 'Ministerio da Educacao', orgao: 'FNDE', pago: 600, empenhado: 800 }),
    ])
    expect(result).toHaveLength(2)
    expect(result[0].orgaoSuperior).toBe('Ministerio da Educacao')
    expect(result[0].pago).toBe(600)
    expect(result[1].orgaoSuperior).toBe('Ministerio da Saude')
    expect(result[1].pago).toBe(500)
  })

  it('sorts by pago descending', () => {
    const result = aggregateByOrgaoSuperior([
      makeOrgao({ orgaoSuperior: 'A', pago: 100 }),
      makeOrgao({ orgaoSuperior: 'B', pago: 300 }),
      makeOrgao({ orgaoSuperior: 'C', pago: 200 }),
    ])
    expect(result[0].orgaoSuperior).toBe('B')
    expect(result[1].orgaoSuperior).toBe('C')
    expect(result[2].orgaoSuperior).toBe('A')
  })

  it('calculates percentOfTotal correctly', () => {
    const result = aggregateByOrgaoSuperior([
      makeOrgao({ orgaoSuperior: 'A', pago: 750 }),
      makeOrgao({ orgaoSuperior: 'B', pago: 250 }),
    ])
    expect(result[0].percentOfTotal).toBe(75)
    expect(result[1].percentOfTotal).toBe(25)
  })

  it('shortens ministry names', () => {
    const result = aggregateByOrgaoSuperior([
      makeOrgao({ orgaoSuperior: 'Ministerio da Saude - Unidades com vinculo direto', pago: 100 }),
    ])
    expect(result[0].shortName).toBe('Saude')
  })

  it('falls back to orgao when orgaoSuperior is empty', () => {
    const result = aggregateByOrgaoSuperior([
      makeOrgao({ orgaoSuperior: '', orgao: 'Orgao Avulso', pago: 100 }),
    ])
    expect(result[0].orgaoSuperior).toBe('Orgao Avulso')
  })
})
