import { NextResponse } from 'next/server'
import { getCached, setCache } from '@/lib/api/cache'
import { fetchAllDeputados, fetchDespesasDeputado } from '@/lib/api/camara'
import { fetchSenadores, fetchResumoPartidos } from '@/lib/api/senado'
import { fetchEmendas, fetchViagens, fetchCartoes } from '@/lib/api/transparency'
import type {
  DeputadoRanking,
  EmendaResumo,
  ViagemResumo,
  CartaoResumo,
  PoliticiansData,
} from '@/lib/api/camara-types'

export const maxDuration = 300
export const dynamic = 'force-dynamic'

const CACHE_KEY = 'politicians-data'
const CACHE_KEY_ANO_ANTERIOR = 'politicians-ano-anterior'
const CACHE_TTL = 86_400
const CACHE_TTL_ANO_ANTERIOR = 30 * 86_400

function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return true
  return authHeader === `Bearer ${cronSecret}`
}

function formatDatePT(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${d}/${m}/${date.getFullYear()}`
}

function parseBRNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return value
  if (typeof value !== 'string' || value === '-' || value === '') return 0
  const cleaned = value.replace(/\./g, '').replace(',', '.')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

async function buildDeputadosRanking(year: number): Promise<{
  ranking: readonly DeputadoRanking[]
  totalGasto: number
}> {
  const deputados = await fetchAllDeputados()
  const rankings: DeputadoRanking[] = []
  const batchSize = 5
  const delayMs = 1_500
  const subset = deputados.slice(0, 40)

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
      if (result.status === 'fulfilled') {
        rankings.push(result.value)
      }
    }

    if (i + batchSize < subset.length) {
      await new Promise((r) => setTimeout(r, delayMs))
    }
  }

  const sorted = rankings.sort((a, b) => b.totalGasto - a.totalGasto)
  const totalGasto = sorted.reduce((s, d) => s + d.totalGasto, 0)
  return { ranking: sorted.slice(0, 20), totalGasto }
}

async function buildEmendasData(year: number): Promise<{
  topAutores: readonly EmendaResumo[]
  totalPago: number
  totalEmpenhado: number
}> {
  const allEmendas = []

  for (let page = 1; page <= 3; page++) {
    try {
      const batch = await fetchEmendas(year, page)
      allEmendas.push(...batch)
      if (batch.length < 15) break
      await new Promise((r) => setTimeout(r, 500))
    } catch {
      break
    }
  }

  const byAutor = new Map<string, { pago: number; empenhado: number; count: number }>()
  let totalPago = 0
  let totalEmpenhado = 0

  for (const e of allEmendas) {
    const pago = parseBRNumber(e.valorPago)
    const empenhado = parseBRNumber(e.valorEmpenhado)
    totalPago += pago
    totalEmpenhado += empenhado

    const autorNome = e.nomeAutor || e.autor || 'Desconhecido'
    const existing = byAutor.get(autorNome) ?? { pago: 0, empenhado: 0, count: 0 }
    byAutor.set(autorNome, {
      pago: existing.pago + pago,
      empenhado: existing.empenhado + empenhado,
      count: existing.count + 1,
    })
  }

  const topAutores: EmendaResumo[] = [...byAutor.entries()]
    .map(([autor, vals]) => ({
      autor,
      totalPago: vals.pago,
      totalEmpenhado: vals.empenhado,
      quantidade: vals.count,
    }))
    .sort((a, b) => b.totalPago - a.totalPago)
    .slice(0, 10)

  return { topAutores, totalPago, totalEmpenhado }
}

async function buildViagensData(): Promise<{
  recentes: readonly ViagemResumo[]
  totalGasto: number
}> {
  const today = new Date()
  const past = new Date(today)
  past.setDate(today.getDate() - 30)

  try {
    const raw = await fetchViagens(formatDatePT(past), formatDatePT(today), 1)

    const recentes: ViagemResumo[] = raw
      .slice(0, 15)
      .map((v) => ({
        viajante: v.beneficiario?.nome ?? 'N/A',
        cargo: v.cargo?.descricao ?? '',
        orgao: v.orgao?.orgaoMaximo?.nome ?? '',
        destino: '',
        motivo: v.viagem?.motivo ?? '',
        valorTotal: (v.valorTotalPassagem ?? 0) + (v.valorTotalDiarias ?? 0),
        dataInicio: v.dataInicioAfastamento ?? '',
      }))
      .sort((a, b) => b.valorTotal - a.valorTotal)

    const totalGasto = recentes.reduce((s, v) => s + v.valorTotal, 0)
    return { recentes, totalGasto }
  } catch {
    return { recentes: [], totalGasto: 0 }
  }
}

async function buildCartoesData(): Promise<{
  topPortadores: readonly CartaoResumo[]
  totalGasto: number
}> {
  const today = new Date()
  const past = new Date(today)
  past.setMonth(today.getMonth() - 3)

  try {
    const raw = await fetchCartoes(formatDatePT(past), formatDatePT(today), 1)

    const byPortador = new Map<string, { orgao: string; total: number; count: number }>()
    let totalGasto = 0

    for (const c of raw) {
      const val = parseBRNumber(c.valorTransacao)
      totalGasto += val
      const nome = c.portador?.nome ?? 'N/A'
      const orgao = c.unidadeGestora?.orgaoMaximo?.nome ?? ''
      const existing = byPortador.get(nome) ?? { orgao: '', total: 0, count: 0 }
      byPortador.set(nome, {
        orgao: existing.orgao || orgao,
        total: existing.total + val,
        count: existing.count + 1,
      })
    }

    const topPortadores: CartaoResumo[] = [...byPortador.entries()]
      .map(([portador, vals]) => ({
        portador,
        orgao: vals.orgao,
        totalGasto: vals.total,
        transacoes: vals.count,
      }))
      .sort((a, b) => b.totalGasto - a.totalGasto)
      .slice(0, 10)

    return { topPortadores, totalGasto }
  } catch {
    return { topPortadores: [], totalGasto: 0 }
  }
}

interface AnoAnteriorData {
  deputadosTotalGasto: number
  senadoresotalGasto: number
  emendasTotalPago: number
}

async function fetchOrCacheAnoAnterior(anoAnterior: number): Promise<AnoAnteriorData> {
  const cached = await getCached<AnoAnteriorData>(CACHE_KEY_ANO_ANTERIOR)
  if (cached) return cached

  console.log(`[cron/politicians] Fetching previous year (${anoAnterior}) data...`)

  const [depResult, senResult, emResult] = await Promise.allSettled([
    buildDeputadosRanking(anoAnterior),
    fetchSenadores(),
    buildEmendasData(anoAnterior),
  ])

  const data: AnoAnteriorData = {
    deputadosTotalGasto:
      depResult.status === 'fulfilled' ? depResult.value.totalGasto : 0,
    senadoresotalGasto:
      senResult.status === 'fulfilled'
        ? senResult.value.reduce((s, sen) => s + sen.totalGasto, 0)
        : 0,
    emendasTotalPago:
      emResult.status === 'fulfilled' ? emResult.value.totalPago : 0,
  }

  await setCache(CACHE_KEY_ANO_ANTERIOR, data, CACHE_TTL_ANO_ANTERIOR)
  return data
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const anoAtual = new Date().getFullYear()
  const anoAnterior = anoAtual - 1

  console.log(`[cron/politicians] Starting (${anoAtual} + ${anoAnterior})...`)
  const startTime = Date.now()

  const [depResult, senResult, partResult, emendasResult, viagensResult, cartoesResult, anoAntResult] =
    await Promise.allSettled([
      buildDeputadosRanking(anoAtual),
      fetchSenadores(),
      fetchResumoPartidos(),
      buildEmendasData(anoAtual),
      buildViagensData(),
      buildCartoesData(),
      fetchOrCacheAnoAnterior(anoAnterior),
    ])

  const deputadosData =
    depResult.status === 'fulfilled'
      ? depResult.value
      : { ranking: [] as DeputadoRanking[], totalGasto: 0 }

  const senadoresRanking =
    senResult.status === 'fulfilled' ? senResult.value : []

  const partidosResumo =
    partResult.status === 'fulfilled' ? partResult.value : []

  const emendasData =
    emendasResult.status === 'fulfilled'
      ? emendasResult.value
      : { topAutores: [] as EmendaResumo[], totalPago: 0, totalEmpenhado: 0 }

  const viagensData =
    viagensResult.status === 'fulfilled'
      ? viagensResult.value
      : { recentes: [] as ViagemResumo[], totalGasto: 0 }

  const cartoesData =
    cartoesResult.status === 'fulfilled'
      ? cartoesResult.value
      : { topPortadores: [] as CartaoResumo[], totalGasto: 0 }

  const anoAntData =
    anoAntResult.status === 'fulfilled'
      ? anoAntResult.value
      : { deputadosTotalGasto: 0, senadoresotalGasto: 0, emendasTotalPago: 0 }

  const coreResults = [depResult, senResult, partResult, emendasResult, viagensResult, cartoesResult]
  const failures = coreResults.filter((r) => r.status === 'rejected')

  const status: 'ok' | 'partial' | 'error' =
    failures.length === coreResults.length ? 'error' : failures.length > 0 ? 'partial' : 'ok'

  const totalSenadores = senadoresRanking.reduce((s, sen) => s + sen.totalGasto, 0)

  const data: PoliticiansData = {
    periodo: { anoAtual, anoAnterior },
    deputados: {
      ...deputadosData,
      totalGastoAnoAnterior: anoAntData.deputadosTotalGasto,
    },
    senadores: {
      ranking: senadoresRanking.slice(0, 20),
      porPartido: partidosResumo,
      totalGasto: totalSenadores,
      totalGastoAnoAnterior: anoAntData.senadoresotalGasto,
    },
    emendas: {
      ...emendasData,
      totalPagoAnoAnterior: anoAntData.emendasTotalPago,
    },
    viagens: viagensData,
    cartoes: cartoesData,
    remuneracoes: { topServidores: [] },
    atualizadoEm: new Date().toISOString(),
    status,
  }

  await setCache(CACHE_KEY, data, CACHE_TTL)

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`[cron/politicians] Done in ${elapsed}s. Status: ${status}`)

  return NextResponse.json({
    success: true,
    status,
    periodo: { anoAtual, anoAnterior },
    deputados: deputadosData.ranking.length,
    senadores: senadoresRanking.length,
    emendas: emendasData.topAutores.length,
    viagens: viagensData.recentes.length,
    cartoes: cartoesData.topPortadores.length,
    anoAnteriorCached: anoAntResult.status === 'fulfilled',
    elapsed: `${elapsed}s`,
  })
}
