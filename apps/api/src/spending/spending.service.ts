import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.module'

@Injectable()
export class SpendingService {
  constructor(private readonly prisma: PrismaService) {}

  async getLatestSnapshot(year: number) {
    const snapshot = await this.prisma.spendingSnapshot.findFirst({
      where: { ano: year, isLatest: true },
      orderBy: { createdAt: 'desc' },
    })

    if (!snapshot) {
      return {
        totalPago: 0,
        totalEmpenhado: 0,
        totalLiquidado: 0,
        porOrgao: [],
        atualizadoEm: new Date().toISOString(),
        source: 'error' as const,
      }
    }

    return {
      totalPago: Number(snapshot.totalPago),
      totalEmpenhado: Number(snapshot.totalEmpenhado),
      totalLiquidado: Number(snapshot.totalLiquidado),
      porOrgao: snapshot.porOrgao,
      atualizadoEm: snapshot.createdAt.toISOString(),
      source: 'cached' as const,
    }
  }
}
