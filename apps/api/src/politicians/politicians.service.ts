import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.module'

@Injectable()
export class PoliticiansService {
  constructor(private readonly prisma: PrismaService) {}

  async getLatestSnapshot() {
    const snapshot = await this.prisma.politiciansSnapshot.findFirst({
      where: { isLatest: true },
      orderBy: { createdAt: 'desc' },
    })

    if (!snapshot) {
      return {
        periodo: { anoAtual: new Date().getFullYear(), anoAnterior: new Date().getFullYear() - 1 },
        deputados: { ranking: [], totalGasto: 0, totalGastoAnoAnterior: 0 },
        senadores: { ranking: [], porPartido: [], totalGasto: 0, totalGastoAnoAnterior: 0 },
        emendas: { topAutores: [], totalPago: 0, totalEmpenhado: 0, totalPagoAnoAnterior: 0 },
        viagens: { recentes: [], totalGasto: 0 },
        cartoes: { topPortadores: [], totalGasto: 0 },
        remuneracoes: { topServidores: [] },
        atualizadoEm: new Date().toISOString(),
        status: 'error' as const,
      }
    }

    return {
      periodo: snapshot.periodo,
      deputados: snapshot.deputados,
      senadores: snapshot.senadores,
      emendas: snapshot.emendas,
      viagens: snapshot.viagens,
      cartoes: snapshot.cartoes,
      remuneracoes: { topServidores: [] },
      atualizadoEm: snapshot.createdAt.toISOString(),
      status: snapshot.status,
    }
  }
}
