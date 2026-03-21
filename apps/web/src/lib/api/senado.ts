import type { SenadorRanking, PartidoResumo } from './camara-types'

const BASE_URL = 'https://apis.codante.io/senator-expenses'

async function codanteGet<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`)
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v))
  }

  const res = await fetch(url.toString(), {
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    throw new Error(`Codante API ${res.status}: ${res.statusText}`)
  }

  return res.json() as Promise<T>
}

interface CodanteSenator {
  readonly id: number
  readonly name: string
  readonly party: string
  readonly UF: string
  readonly avatar_url: string | null
}

interface CodanteSenatorExpense {
  readonly data: readonly {
    readonly amount: string
  }[]
  readonly meta: {
    readonly expenses_sum: string | null
    readonly expenses_count: number
  }
}

export async function fetchSenadores(): Promise<readonly SenadorRanking[]> {
  const response = await codanteGet<{ data: readonly CodanteSenator[] }>('/senators', { active: 'true' })

  const senators = response.data
  const rankings: SenadorRanking[] = []
  const currentYear = new Date().getFullYear()

  for (const senator of senators.slice(0, 30)) {
    let totalGasto = 0

    for (const year of [currentYear, currentYear - 1]) {
      try {
        const expenses = await codanteGet<CodanteSenatorExpense>(
          `/senators/${senator.id}/expenses`,
          { year },
        )
        const sum = expenses.meta?.expenses_sum
        totalGasto = sum ? parseFloat(String(sum)) : 0
        if (isNaN(totalGasto)) totalGasto = 0
        if (totalGasto > 0) break
      } catch {
        continue
      }
    }

    rankings.push({
      id: senator.id,
      nome: senator.name,
      partido: senator.party,
      uf: senator.UF ?? '',
      foto: senator.avatar_url ?? '',
      totalGasto,
    })
  }

  return rankings.sort((a, b) => b.totalGasto - a.totalGasto)
}

interface CodantePartySummaryYear {
  readonly year: string
  readonly data: readonly {
    readonly party: string
    readonly total_expenses: number
    readonly senator_ids: readonly number[]
  }[]
}

export async function fetchResumoPartidos(): Promise<readonly PartidoResumo[]> {
  try {
    const response = await codanteGet<readonly CodantePartySummaryYear[]>('/summary/by-party')

    const sorted = [...response].sort((a, b) => Number(b.year) - Number(a.year))
    const latest = sorted[0]
    if (!latest?.data) return []

    return latest.data.map((p) => ({
      partido: p.party,
      totalGasto: p.total_expenses,
      quantidadeParlamentares: p.senator_ids?.length ?? 0,
    }))
  } catch {
    return []
  }
}
