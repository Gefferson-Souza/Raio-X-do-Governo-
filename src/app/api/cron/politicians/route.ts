import { NextResponse } from 'next/server'
import { setCache } from '@/lib/api/cache'
import { fetchAllDeputados, fetchDespesasDeputado } from '@/lib/api/camara'
import { fetchSenadores, fetchResumoPartidos } from '@/lib/api/senado'
import { fetchEmendas, fetchViagens, fetchCartoes, fetchRemuneracao } from '@/lib/api/transparency'
import type {
  DeputadoRanking,
  EmendaResumo,
  ViagemResumo,
  CartaoResumo,
  ServidorTopRemuneracao,
  PoliticiansData,
} from '@/lib/api/camara-types'

export const maxDuration = 300
export const dynamic = 'force-dynamic'

const CACHE_KEY = 'politicians-data'
const CACHE_TTL = 86_400

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

async function buildDeputadosRanking(): Promise<{
  ranking: readonly DeputadoRanking[]
  totalGasto: number
}> {
  const deputados = await fetchAllDeputados()
  const year = new Date().getFullYear()
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

async function buildEmendasData(): Promise<{
  topAutores: readonly EmendaResumo[]
  totalPago: number
  totalEmpenhado: number
}> {
  const year = new Date().getFullYear()
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
    const pago = e.valorPago ?? 0
    const empenhado = e.valorEmpenhado ?? 0
    totalPago += pago
    totalEmpenhado += empenhado

    const existing = byAutor.get(e.autor) ?? { pago: 0, empenhado: 0, count: 0 }
    byAutor.set(e.autor, {
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
    const viagens = await fetchViagens(formatDatePT(past), formatDatePT(today), 1)

    const recentes: ViagemResumo[] = viagens
      .slice(0, 15)
      .map((v) => ({
        viajante: v.viajante ?? 'N/A',
        cargo: v.cargo ?? '',
        orgao: v.orgaoSuperior ?? '',
        destino: v.destinos ?? '',
        motivo: v.motivo ?? '',
        valorTotal: (v.valorPassagens ?? 0) + (v.valorDiarias ?? 0),
        dataInicio: v.dataInicio ?? '',
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
    const cartoes = await fetchCartoes(formatDatePT(past), formatDatePT(today), 1)

    const byPortador = new Map<string, { orgao: string; total: number; count: number }>()
    let totalGasto = 0

    for (const c of cartoes) {
      const val = c.valorTransacao ?? 0
      totalGasto += val
      const existing = byPortador.get(c.nomePortador) ?? { orgao: c.orgaoSuperior ?? '', total: 0, count: 0 }
      byPortador.set(c.nomePortador, {
        orgao: existing.orgao || (c.orgaoSuperior ?? ''),
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

async function buildRemuneracoesData(): Promise<{
  topServidores: readonly ServidorTopRemuneracao[]
}> {
  const now = new Date()
  const mesAno = `${now.getFullYear()}${String(now.getMonth()).padStart(2, '0')}`

  try {
    const servidores = await fetchRemuneracao(mesAno, 1)

    const topServidores: ServidorTopRemuneracao[] = servidores
      .map((s) => ({
        nome: s.nome ?? 'N/A',
        cargo: s.cargo ?? s.funcao ?? '',
        orgao: s.orgaoSuperiorServidorExercicio ?? '',
        remuneracaoBruta: s.remuneracaoBasicaBruta ?? 0,
        remuneracaoLiquida: s.remuneracaoAposDeducoes ?? 0,
      }))
      .sort((a, b) => b.remuneracaoBruta - a.remuneracaoBruta)
      .slice(0, 15)

    return { topServidores }
  } catch {
    return { topServidores: [] }
  }
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('[cron/politicians] Starting data collection...')
  const startTime = Date.now()

  const [depResult, senResult, partResult, emendasResult, viagensResult, cartoesResult, remResult] =
    await Promise.allSettled([
      buildDeputadosRanking(),
      fetchSenadores(),
      fetchResumoPartidos(),
      buildEmendasData(),
      buildViagensData(),
      buildCartoesData(),
      buildRemuneracoesData(),
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

  const remData =
    remResult.status === 'fulfilled'
      ? remResult.value
      : { topServidores: [] as ServidorTopRemuneracao[] }

  const allResults = [depResult, senResult, partResult, emendasResult, viagensResult, cartoesResult, remResult]
  const failures = allResults.filter((r) => r.status === 'rejected')

  const status: 'ok' | 'partial' | 'error' =
    failures.length === allResults.length ? 'error' : failures.length > 0 ? 'partial' : 'ok'

  const totalSenadores = senadoresRanking.reduce((s, sen) => s + sen.totalGasto, 0)

  const data: PoliticiansData = {
    deputados: deputadosData,
    senadores: {
      ranking: senadoresRanking.slice(0, 20),
      porPartido: partidosResumo,
      totalGasto: totalSenadores,
    },
    emendas: emendasData,
    viagens: viagensData,
    cartoes: cartoesData,
    remuneracoes: remData,
    atualizadoEm: new Date().toISOString(),
    status,
  }

  await setCache(CACHE_KEY, data, CACHE_TTL)

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`[cron/politicians] Done in ${elapsed}s. Status: ${status}. Failures: ${failures.length}/7`)

  return NextResponse.json({
    success: true,
    status,
    deputados: deputadosData.ranking.length,
    senadores: senadoresRanking.length,
    emendas: emendasData.topAutores.length,
    viagens: viagensData.recentes.length,
    cartoes: cartoesData.topPortadores.length,
    remuneracoes: remData.topServidores.length,
    elapsed: `${elapsed}s`,
  })
}
