import type { DespesaPorOrgao } from '@/lib/api/types'

export interface AggregatedOrgao {
  readonly orgaoSuperior: string
  readonly shortName: string
  readonly pago: number
  readonly empenhado: number
  readonly percentOfTotal: number
}

function shortenOrgaoName(name: string): string {
  return name
    .split(' - ')[0]
    .replace(/^MINISTERIO D[AOEU]S?\s+/i, '')
    .replace(/^FUNDO\s+(NACIONAL\s+D[AOEU]S?\s+)?/i, '')
    .replace(/^COMANDO\s+D[AOEU]S?\s+/i, '')
    .replace(/^SECRETARIA\s+D[AOEU]S?\s+/i, '')
    .trim()
}

export function aggregateByOrgaoSuperior(
  orgaos: readonly DespesaPorOrgao[],
): readonly AggregatedOrgao[] {
  if (orgaos.length === 0) return []

  const grouped = new Map<string, { pago: number; empenhado: number }>()

  for (const o of orgaos) {
    const key = o.orgaoSuperior || o.orgao
    const existing = grouped.get(key) ?? { pago: 0, empenhado: 0 }
    grouped.set(key, {
      pago: existing.pago + o.pago,
      empenhado: existing.empenhado + o.empenhado,
    })
  }

  const totalPago = [...grouped.values()].reduce((s, v) => s + v.pago, 0) || 1

  return [...grouped.entries()]
    .map(([name, values]) => ({
      orgaoSuperior: name,
      shortName: shortenOrgaoName(name),
      pago: values.pago,
      empenhado: values.empenhado,
      percentOfTotal: (values.pago / totalPago) * 100,
    }))
    .sort((a, b) => b.pago - a.pago)
}
