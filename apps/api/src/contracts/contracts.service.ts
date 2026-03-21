import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.module'

@Injectable()
export class ContractsService {
  constructor(private readonly prisma: PrismaService) {}

  async getLatestSnapshot() {
    const snapshot = await this.prisma.contractSnapshot.findFirst({
      where: { isLatest: true },
      orderBy: { createdAt: 'desc' },
    })

    if (!snapshot) {
      return {
        data: [],
        source: 'error' as const,
        atualizadoEm: new Date().toISOString(),
      }
    }

    return {
      data: snapshot.contratos,
      source: 'cached' as const,
      atualizadoEm: snapshot.createdAt.toISOString(),
    }
  }
}
