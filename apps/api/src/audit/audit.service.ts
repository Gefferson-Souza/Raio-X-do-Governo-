import { Injectable } from '@nestjs/common'
import { createHash } from 'crypto'
import { PrismaService } from '../prisma.module'

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async saveRawResponse(params: {
    source: string
    endpointUrl: string
    httpStatus: number
    responseBody: unknown
    durationMs: number
    syncJobId?: string
  }) {
    const body = JSON.stringify(params.responseBody)
    const hash = createHash('sha256').update(body).digest('hex')

    return this.prisma.rawResponse.create({
      data: {
        source: params.source,
        endpointUrl: params.endpointUrl,
        httpMethod: 'GET',
        httpStatus: params.httpStatus,
        responseHash: hash,
        responseBody: params.responseBody as object,
        responseSizeBytes: Buffer.byteLength(body, 'utf8'),
        durationMs: params.durationMs,
        syncJobId: params.syncJobId,
      },
    })
  }

  async createSyncJob(jobType: string) {
    return this.prisma.syncJob.create({
      data: { jobType, status: 'running' },
    })
  }

  async completeSyncJob(id: string, status: string, recordsFetched: number, errorMessage?: string) {
    const job = await this.prisma.syncJob.findUnique({ where: { id } })
    const durationMs = job ? Date.now() - job.startedAt.getTime() : 0

    return this.prisma.syncJob.update({
      where: { id },
      data: {
        status,
        completedAt: new Date(),
        durationMs,
        recordsFetched,
        errorMessage,
      },
    })
  }
}
