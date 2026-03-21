import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../prisma.module'
import { AuditService } from '../audit/audit.service'

const TOP_ORGAOS = [
  '20000', '26000', '30000', '36000', '39000',
  '24000', '25000', '32000', '35000', '22000',
  '44000', '52000', '53000', '54000', '55000', '56000',
]

function parseBRNumber(value: string | number | undefined | null): number {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return value
  if (typeof value !== 'string' || value === '-' || value === '') return 0
  const cleaned = value.replace(/\./g, '').replace(',', '.')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

@Injectable()
export class SpendingSyncService {
  private readonly logger = new Logger(SpendingSyncService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
  ) {}

  async syncAll() {
    const job = await this.audit.createSyncJob('spending')
    const year = new Date().getFullYear()
    let totalFetched = 0

    try {
      const apiKey = this.config.get<string>('TRANSPARENCY_API_KEY')
      if (!apiKey) throw new Error('TRANSPARENCY_API_KEY not configured')

      const orgaoResults = []

      for (const codigo of TOP_ORGAOS) {
        try {
          const start = Date.now()
          const url = `https://api.portaldatransparencia.gov.br/api-de-dados/despesas/por-orgao?ano=${year}&codigoOrgaoSuperior=${codigo}&pagina=1`
          const res = await fetch(url, {
            headers: { 'chave-api-dados': apiKey },
            signal: AbortSignal.timeout(15_000),
          })

          const body = await res.json()
          const duration = Date.now() - start

          await this.audit.saveRawResponse({
            source: 'transparencia',
            endpointUrl: url,
            httpStatus: res.status,
            responseBody: body,
            durationMs: duration,
            syncJobId: job.id,
          })

          if (Array.isArray(body)) {
            for (const raw of body) {
              orgaoResults.push({
                ano: year,
                orgao: raw.orgao ?? '',
                codigoOrgao: raw.codigoOrgao ?? codigo,
                orgaoSuperior: raw.orgaoSuperior ?? '',
                codigoOrgaoSuperior: raw.codigoOrgaoSuperior ?? codigo,
                empenhado: parseBRNumber(raw.empenhado),
                liquidado: parseBRNumber(raw.liquidado),
                pago: parseBRNumber(raw.pago),
              })
            }
          }

          totalFetched++
          await new Promise((r) => setTimeout(r, 300))
        } catch (err) {
          this.logger.warn(`Failed to fetch orgao ${codigo}: ${err}`)
        }
      }

      const totalPago = orgaoResults.reduce((s, o) => s + o.pago, 0)
      const totalEmpenhado = orgaoResults.reduce((s, o) => s + o.empenhado, 0)
      const totalLiquidado = orgaoResults.reduce((s, o) => s + o.liquidado, 0)

      await this.prisma.spendingSnapshot.updateMany({
        where: { ano: year, isLatest: true },
        data: { isLatest: false },
      })

      const lastVersion = await this.prisma.spendingSnapshot.findFirst({
        where: { ano: year },
        orderBy: { version: 'desc' },
        select: { version: true },
      })

      await this.prisma.spendingSnapshot.create({
        data: {
          version: (lastVersion?.version ?? 0) + 1,
          ano: year,
          totalPago,
          totalEmpenhado,
          totalLiquidado,
          porOrgao: orgaoResults,
          syncJobId: job.id,
          isLatest: true,
        },
      })

      await this.audit.completeSyncJob(job.id, 'completed', totalFetched)
      this.logger.log(`Spending sync completed: ${totalFetched} orgaos, R$ ${totalPago.toFixed(2)}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      await this.audit.completeSyncJob(job.id, 'failed', totalFetched, message)
      this.logger.error(`Spending sync failed: ${message}`)
    }
  }
}
