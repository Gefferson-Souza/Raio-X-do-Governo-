import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../prisma.module'
import { AuditService } from '../audit/audit.service'

const CONTRACT_ORGAOS = ['20000', '26000', '30000', '36000', '25000', '24000', '52000', '53000']

@Injectable()
export class ContractsSyncService {
  private readonly logger = new Logger(ContractsSyncService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
  ) {}

  async syncAll() {
    const job = await this.audit.createSyncJob('contracts')
    let totalFetched = 0

    try {
      const apiKey = this.config.get<string>('TRANSPARENCY_API_KEY')
      if (!apiKey) throw new Error('TRANSPARENCY_API_KEY not configured')

      const now = new Date()
      const past = new Date(now)
      past.setDate(now.getDate() - 30)

      const formatDate = (d: Date) => {
        const dd = String(d.getDate()).padStart(2, '0')
        const mm = String(d.getMonth() + 1).padStart(2, '0')
        return `${dd}/${mm}/${d.getFullYear()}`
      }

      const allContracts: Record<string, unknown>[] = []

      for (const orgao of CONTRACT_ORGAOS) {
        try {
          const start = Date.now()
          const url = `https://api.portaldatransparencia.gov.br/api-de-dados/contratos?dataInicial=${formatDate(past)}&dataFinal=${formatDate(now)}&codigoOrgao=${orgao}&pagina=1`
          const res = await fetch(url, {
            headers: { 'chave-api-dados': apiKey },
            signal: AbortSignal.timeout(15_000),
          })

          const body = await res.json()

          await this.audit.saveRawResponse({
            source: 'transparencia',
            endpointUrl: url,
            httpStatus: res.status,
            responseBody: body,
            durationMs: Date.now() - start,
            syncJobId: job.id,
          })

          if (Array.isArray(body)) {
            allContracts.push(...body)
            totalFetched += body.length
          }

          await new Promise(r => setTimeout(r, 300))
        } catch (err) {
          this.logger.warn(`Failed to fetch contracts for orgao ${orgao}: ${err}`)
        }
      }

      await this.prisma.contractSnapshot.updateMany({
        where: { isLatest: true },
        data: { isLatest: false },
      })

      const lastVersion = await this.prisma.contractSnapshot.findFirst({
        orderBy: { version: 'desc' },
        select: { version: true },
      })

      await this.prisma.contractSnapshot.create({
        data: {
          version: (lastVersion?.version ?? 0) + 1,
          contratos: allContracts as unknown as object,
          periodoInicio: past,
          periodoFim: now,
          syncJobId: job.id,
          isLatest: true,
        },
      })

      await this.audit.completeSyncJob(job.id, 'completed', totalFetched)
      this.logger.log(`Contracts sync completed: ${totalFetched} contracts`)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      await this.audit.completeSyncJob(job.id, 'failed', totalFetched, message)
      this.logger.error(`Contracts sync failed: ${message}`)
    }
  }
}
