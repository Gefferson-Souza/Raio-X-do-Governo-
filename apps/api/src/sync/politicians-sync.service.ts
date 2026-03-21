import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../prisma.module'
import { AuditService } from '../audit/audit.service'

const CAMARA_BASE = 'https://dadosabertos.camara.leg.br/api/v2'
const CODANTE_BASE = 'https://apis.codante.io/senator-expenses'

function parseBRNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return value
  if (typeof value !== 'string' || value === '-' || value === '') return 0
  const cleaned = value.replace(/\./g, '').replace(',', '.')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

@Injectable()
export class PoliticiansSyncService {
  private readonly logger = new Logger(PoliticiansSyncService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async syncAll() {
    const job = await this.audit.createSyncJob('politicians')
    const year = new Date().getFullYear()
    let totalFetched = 0

    try {
      const [deputadosRanking, senadoresRanking, partidosResumo] = await Promise.allSettled([
        this.fetchDeputadosRanking(year, job.id),
        this.fetchSenadoresRanking(job.id),
        this.fetchPartidosResumo(job.id),
      ])

      const deputados = deputadosRanking.status === 'fulfilled'
        ? deputadosRanking.value
        : { ranking: [], totalGasto: 0 }

      const senadores = senadoresRanking.status === 'fulfilled'
        ? senadoresRanking.value
        : { ranking: [], totalGasto: 0 }

      const partidos = partidosResumo.status === 'fulfilled'
        ? partidosResumo.value
        : []

      totalFetched = deputados.ranking.length + senadores.ranking.length

      await this.prisma.politiciansSnapshot.updateMany({
        where: { isLatest: true },
        data: { isLatest: false },
      })

      const lastVersion = await this.prisma.politiciansSnapshot.findFirst({
        orderBy: { version: 'desc' },
        select: { version: true },
      })

      const status = [deputadosRanking, senadoresRanking, partidosResumo].every(r => r.status === 'fulfilled')
        ? 'ok'
        : [deputadosRanking, senadoresRanking, partidosResumo].every(r => r.status === 'rejected')
          ? 'error'
          : 'partial'

      await this.prisma.politiciansSnapshot.create({
        data: {
          version: (lastVersion?.version ?? 0) + 1,
          periodo: { anoAtual: year, anoAnterior: year - 1 },
          deputados: { ranking: deputados.ranking.slice(0, 20), totalGasto: deputados.totalGasto, totalGastoAnoAnterior: 0 },
          senadores: { ranking: senadores.ranking.slice(0, 20), porPartido: partidos, totalGasto: senadores.totalGasto, totalGastoAnoAnterior: 0 },
          emendas: { topAutores: [], totalPago: 0, totalEmpenhado: 0, totalPagoAnoAnterior: 0 },
          viagens: { recentes: [], totalGasto: 0 },
          cartoes: { topPortadores: [], totalGasto: 0 },
          status,
          syncJobId: job.id,
          isLatest: true,
        },
      })

      await this.audit.completeSyncJob(job.id, status, totalFetched)
      this.logger.log(`Politicians sync completed: ${deputados.ranking.length} deps, ${senadores.ranking.length} sens`)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      await this.audit.completeSyncJob(job.id, 'failed', totalFetched, message)
      this.logger.error(`Politicians sync failed: ${message}`)
    }
  }

  private async fetchDeputadosRanking(year: number, syncJobId: string) {
    const allDeps: Array<{ id: number; nome: string; siglaPartido: string; siglaUf: string; urlFoto: string }> = []
    let page = 1
    const maxPages = 10

    while (page <= maxPages) {
      const start = Date.now()
      const url = `${CAMARA_BASE}/deputados?idLegislatura=57&itens=100&pagina=${page}&ordenarPor=nome&ordem=ASC`
      const res = await fetch(url, { signal: AbortSignal.timeout(15_000) })
      const body = await res.json() as { dados?: Array<{ id: number; nome: string; siglaPartido: string; siglaUf: string; urlFoto: string }> }
      const duration = Date.now() - start

      await this.audit.saveRawResponse({
        source: 'camara', endpointUrl: url, httpStatus: res.status,
        responseBody: body, durationMs: duration, syncJobId,
      })

      const dados = body.dados ?? []
      allDeps.push(...dados)
      if (dados.length < 100) break
      page++
      await new Promise(r => setTimeout(r, 500))
    }

    this.logger.log(`Fetched ${allDeps.length} deputies, now fetching expenses...`)

    const rankings: Array<{ id: number; nome: string; partido: string; uf: string; foto: string; totalGasto: number; topDespesas: Array<{ tipo: string; total: number }> }> = []
    const batchSize = 10
    const delayMs = 2000

    for (let i = 0; i < allDeps.length; i += batchSize) {
      const batch = allDeps.slice(i, i + batchSize)
      const results = await Promise.allSettled(
        batch.map(async (dep) => {
          const expUrl = `${CAMARA_BASE}/deputados/${dep.id}/despesas?ano=${year}&itens=100&pagina=1`
          const start = Date.now()
          const res = await fetch(expUrl, { signal: AbortSignal.timeout(15_000) })
          const body = await res.json() as { dados?: Array<{ tipoDespesa: string; valorLiquido?: number; valorDocumento?: number }> }

          await this.audit.saveRawResponse({
            source: 'camara', endpointUrl: expUrl, httpStatus: res.status,
            responseBody: body, durationMs: Date.now() - start, syncJobId,
          })

          const despesas = body.dados ?? []
          const byType = new Map<string, number>()
          let total = 0
          for (const d of despesas) {
            const val = d.valorLiquido ?? d.valorDocumento ?? 0
            total += val
            byType.set(d.tipoDespesa, (byType.get(d.tipoDespesa) ?? 0) + val)
          }

          return {
            id: dep.id,
            nome: dep.nome,
            partido: dep.siglaPartido,
            uf: dep.siglaUf,
            foto: dep.urlFoto ?? '',
            totalGasto: total,
            topDespesas: [...byType.entries()]
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([tipo, totalTipo]) => ({ tipo, total: totalTipo })),
          }
        }),
      )

      for (const result of results) {
        if (result.status === 'fulfilled') rankings.push(result.value)
      }

      if (i + batchSize < allDeps.length) await new Promise(r => setTimeout(r, delayMs))
      this.logger.log(`Deputies progress: ${Math.min(i + batchSize, allDeps.length)}/${allDeps.length}`)
    }

    const sorted = rankings.sort((a, b) => b.totalGasto - a.totalGasto)
    return { ranking: sorted, totalGasto: sorted.reduce((s, d) => s + d.totalGasto, 0) }
  }

  private async fetchSenadoresRanking(syncJobId: string) {
    const start = Date.now()
    const url = `${CODANTE_BASE}/senators?active=true`
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) })
    const body = await res.json() as { data?: Array<{ id: number; name: string; party: string; UF?: string; avatar_url?: string }> }

    await this.audit.saveRawResponse({
      source: 'senado', endpointUrl: url, httpStatus: res.status,
      responseBody: body, durationMs: Date.now() - start, syncJobId,
    })

    const senators = body.data ?? []
    const year = new Date().getFullYear()
    const rankings: Array<{ id: number; nome: string; partido: string; uf: string; foto: string; totalGasto: number }> = []

    for (const senator of senators) {
      let totalGasto = 0
      for (const y of [year, year - 1]) {
        try {
          const expUrl = `${CODANTE_BASE}/senators/${senator.id}/expenses?year=${y}`
          const expRes = await fetch(expUrl, { signal: AbortSignal.timeout(10_000) })
          const expBody = await expRes.json() as { meta?: { expenses_sum?: string | null } }
          const sum = expBody.meta?.expenses_sum
          totalGasto = sum ? parseFloat(String(sum)) : 0
          if (isNaN(totalGasto)) totalGasto = 0
          if (totalGasto > 0) break
        } catch { continue }
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

    const sorted = rankings.sort((a, b) => b.totalGasto - a.totalGasto)
    return { ranking: sorted, totalGasto: sorted.reduce((s, d) => s + d.totalGasto, 0) }
  }

  private async fetchPartidosResumo(syncJobId: string) {
    try {
      const start = Date.now()
      const url = `${CODANTE_BASE}/summary/by-party`
      const res = await fetch(url, { signal: AbortSignal.timeout(10_000) })
      const body = await res.json()

      await this.audit.saveRawResponse({
        source: 'senado', endpointUrl: url, httpStatus: res.status,
        responseBody: body, durationMs: Date.now() - start, syncJobId,
      })

      const sorted = [...(body as Array<{ year: string; data: Array<{ party: string; total_expenses: number; senator_ids: number[] }> }>)]
        .sort((a, b) => Number(b.year) - Number(a.year))
      const latest = sorted[0]
      if (!latest?.data) return []

      return latest.data.map(p => ({
        partido: p.party,
        totalGasto: p.total_expenses,
        quantidadeParlamentares: p.senator_ids?.length ?? 0,
      }))
    } catch {
      return []
    }
  }
}
