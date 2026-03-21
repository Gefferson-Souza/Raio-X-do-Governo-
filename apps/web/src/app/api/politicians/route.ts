import { NextResponse } from 'next/server'
import { getCached, setCache } from '@/lib/api/cache'
import { fetchAllDeputados, fetchDespesasDeputado } from '@/lib/api/camara'
import { fetchSenadores, fetchResumoPartidos } from '@/lib/api/senado'
import type { DeputadoRanking, PoliticiansData } from '@/lib/api/camara-types'
import { EMPTY_POLITICIANS_DATA } from '@/lib/utils/empty-politicians-data'

export const maxDuration = 300

const CACHE_KEY = 'politicians-data'

const CDN_HEADERS = {
  'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
}

/**
 * Lightweight live fetch — grabs deputados + senadores + partidos
 * in ~30-60s. Skips slow Portal endpoints (emendas, viagens, cartoes)
 * which are populated by the cron when available.
 */
async function fetchLive(): Promise<PoliticiansData> {
  const year = new Date().getFullYear()

  const [depResult, senResult, partResult] = await Promise.allSettled([
    buildDeputadosLite(year),
    fetchSenadores(),
    fetchResumoPartidos(),
  ])

  const deputadosData = depResult.status === 'fulfilled'
    ? depResult.value
    : { ranking: [] as DeputadoRanking[], totalGasto: 0 }

  const senadoresRanking = senResult.status === 'fulfilled' ? senResult.value : []
  const partidosResumo = partResult.status === 'fulfilled' ? partResult.value : []

  const totalSenadores = senadoresRanking.reduce((s, sen) => s + sen.totalGasto, 0)
  const failures = [depResult, senResult, partResult].filter(r => r.status === 'rejected')
  const status: PoliticiansData['status'] =
    failures.length === 3 ? 'error' : failures.length > 0 ? 'partial' : 'ok'

  return {
    periodo: { anoAtual: year, anoAnterior: year - 1 },
    deputados: { ...deputadosData, totalGastoAnoAnterior: 0 },
    senadores: { ranking: senadoresRanking.slice(0, 20), porPartido: partidosResumo, totalGasto: totalSenadores, totalGastoAnoAnterior: 0 },
    emendas: { topAutores: [], totalPago: 0, totalEmpenhado: 0, totalPagoAnoAnterior: 0 },
    viagens: { recentes: [], totalGasto: 0 },
    cartoes: { topPortadores: [], totalGasto: 0 },
    remuneracoes: { topServidores: [] },
    atualizadoEm: new Date().toISOString(),
    status,
  }
}

async function buildDeputadosLite(year: number): Promise<{
  ranking: readonly DeputadoRanking[]
  totalGasto: number
}> {
  const deputados = await fetchAllDeputados()
  const rankings: DeputadoRanking[] = []
  const batchSize = 5
  const subset = deputados.slice(0, 25)

  for (let i = 0; i < subset.length; i += batchSize) {
    const batch = subset.slice(i, i + batchSize)
    const results = await Promise.allSettled(
      batch.map(async (dep) => {
        const despesas = await fetchDespesasDeputado(dep.id, year)
        const byType = new Map<string, number>()
        let total = 0

        for (const d of despesas) {
          const val = d.valorLiquido ?? d.valorDocumento ?? 0
          total += val
          byType.set(d.tipoDespesa, (byType.get(d.tipoDespesa) ?? 0) + val)
        }

        const topDespesas = [...byType.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([tipo, totalTipo]) => ({ tipo, total: totalTipo }))

        return {
          id: dep.id,
          nome: dep.nome,
          partido: dep.siglaPartido,
          uf: dep.siglaUf,
          foto: dep.urlFoto ?? '',
          totalGasto: total,
          topDespesas,
        } satisfies DeputadoRanking
      }),
    )

    for (const result of results) {
      if (result.status === 'fulfilled') rankings.push(result.value)
    }

    if (i + batchSize < subset.length) {
      await new Promise((r) => setTimeout(r, 1_000))
    }
  }

  const sorted = rankings.sort((a, b) => b.totalGasto - a.totalGasto)
  const totalGasto = sorted.reduce((s, d) => s + d.totalGasto, 0)
  return { ranking: sorted.slice(0, 20), totalGasto }
}

export async function GET() {
  // 1. Try cache (Redis or in-memory)
  const cached = await getCached<PoliticiansData>(CACHE_KEY)

  if (cached?.atualizadoEm) {
    return NextResponse.json(cached, { headers: CDN_HEADERS })
  }

  // 2. No cache — fetch live (deputados + senadores + partidos)
  console.log('[api/politicians] No cache, fetching live...')
  const data = await fetchLive()

  if (data.status === 'error') {
    return NextResponse.json(
      { ...EMPTY_POLITICIANS_DATA, error: 'Todas as APIs falharam. Tente novamente em alguns minutos.' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  // 3. Cache for next requests (if Redis is available, great. If not, CDN caches via headers)
  await setCache(CACHE_KEY, data, 3600)

  return NextResponse.json(data, { headers: CDN_HEADERS })
}
