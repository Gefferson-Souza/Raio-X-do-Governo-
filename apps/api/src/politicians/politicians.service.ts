import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma.module'

interface SearchParams {
  q?: string
  house: string
  parties: string[]
  states: string[]
  year: number
  sort: string
  page: number
  limit: number
}

@Injectable()
export class PoliticiansService {
  constructor(private readonly prisma: PrismaService) {}

  async search(params: SearchParams) {
    const where: Prisma.PoliticianWhereInput = {
      active: true,
      ...(params.q
        ? { nome: { contains: params.q, mode: 'insensitive' as const } }
        : {}),
      ...(params.house !== 'all' ? { house: params.house } : {}),
      ...(params.parties.length > 0
        ? { partido: { in: params.parties } }
        : {}),
      ...(params.states.length > 0 ? { uf: { in: params.states } } : {}),
    }

    const nameSort =
      params.sort === 'name_asc' || params.sort === 'name_desc'

    const [politicians, total] = await Promise.all([
      this.prisma.politician.findMany({
        where,
        include: {
          expenses: {
            where: { ano: params.year },
            select: { valor: true },
          },
        },
        ...(nameSort
          ? {
              orderBy: {
                nome: params.sort === 'name_asc' ? 'asc' : 'desc',
              },
            }
          : {}),
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.politician.count({ where }),
    ])

    const withTotals = politicians.map((p) => {
      const totalGasto = p.expenses.reduce(
        (sum, e) => sum + Number(e.valor),
        0,
      )
      const { expenses: _, ...politician } = p
      return { ...politician, totalGasto }
    })

    const sorted = !nameSort
      ? [...withTotals].sort((a, b) =>
          params.sort === 'spending_asc'
            ? a.totalGasto - b.totalGasto
            : b.totalGasto - a.totalGasto,
        )
      : withTotals

    return {
      data: sorted,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
      meta: {
        ano: params.year,
        fonte: 'Camara dos Deputados + Senado Federal',
      },
    }
  }

  async getDeputyDetails(externalId: number, year: number) {
    const politician = await this.prisma.politician.findUnique({
      where: {
        externalId_house: { externalId, house: 'camara' },
      },
    })

    if (!politician) return null

    const [byType, byMonth, byYear, partyAvg, stateAvg, overallAvg] =
      await Promise.all([
        this.prisma.politicianExpense.groupBy({
          by: ['tipoDespesa'],
          _sum: { valor: true },
          where: {
            politicianExtId: externalId,
            politicianHouse: 'camara',
            ano: year,
            tipoDespesa: { not: null },
          },
          orderBy: { _sum: { valor: 'desc' } },
        }),
        this.prisma.politicianExpense.groupBy({
          by: ['mes'],
          _sum: { valor: true },
          where: {
            politicianExtId: externalId,
            politicianHouse: 'camara',
            ano: year,
            mes: { not: null },
          },
          orderBy: { mes: 'asc' },
        }),
        this.prisma.politicianExpense.groupBy({
          by: ['ano'],
          _sum: { valor: true },
          where: {
            politicianExtId: externalId,
            politicianHouse: 'camara',
          },
          orderBy: { ano: 'asc' },
        }),
        this.getAverageByGroup('partido', politician.partido, year),
        this.getAverageByGroup('uf', politician.uf, year),
        this.getOverallAverage(year),
      ])

    const total = byType.reduce(
      (sum, t) => sum + Number(t._sum.valor ?? 0),
      0,
    )

    return {
      profile: {
        externalId: politician.externalId,
        nome: politician.nome,
        partido: politician.partido,
        uf: politician.uf,
        foto: politician.foto,
        email: politician.email,
        house: politician.house,
      },
      spending: {
        total,
        byType: byType.map((t) => ({
          tipo: t.tipoDespesa ?? 'Outros',
          total: Number(t._sum.valor ?? 0),
        })),
        byMonth: byMonth.map((m) => ({
          mes: m.mes!,
          total: Number(m._sum.valor ?? 0),
        })),
        byYear: byYear.map((y) => ({
          ano: y.ano,
          total: Number(y._sum.valor ?? 0),
        })),
      },
      comparisons: {
        partyAverage: partyAvg,
        stateAverage: stateAvg,
        overallAverage: overallAvg,
      },
      periodo: { ano: year },
      atualizadoEm: politician.updatedAt.toISOString(),
    }
  }

  async getSenatorDetails(externalId: number, year: number) {
    const politician = await this.prisma.politician.findUnique({
      where: {
        externalId_house: { externalId, house: 'senado' },
      },
    })

    if (!politician) return null

    const [byType, byYear, partyAvg, stateAvg, overallAvg] =
      await Promise.all([
        this.prisma.politicianExpense.groupBy({
          by: ['tipoDespesa'],
          _sum: { valor: true },
          where: {
            politicianExtId: externalId,
            politicianHouse: 'senado',
            ano: year,
            tipoDespesa: { not: null },
          },
          orderBy: { _sum: { valor: 'desc' } },
        }),
        this.prisma.politicianExpense.groupBy({
          by: ['ano'],
          _sum: { valor: true },
          where: {
            politicianExtId: externalId,
            politicianHouse: 'senado',
          },
          orderBy: { ano: 'asc' },
        }),
        this.getAverageByGroup('partido', politician.partido, year),
        this.getAverageByGroup('uf', politician.uf, year),
        this.getOverallAverage(year),
      ])

    const total = byType.reduce(
      (sum, t) => sum + Number(t._sum.valor ?? 0),
      0,
    )

    return {
      profile: {
        externalId: politician.externalId,
        nome: politician.nome,
        partido: politician.partido,
        uf: politician.uf,
        foto: politician.foto,
        email: politician.email,
        house: politician.house,
      },
      spending: {
        total,
        byType: byType.map((t) => ({
          tipo: t.tipoDespesa ?? 'Outros',
          total: Number(t._sum.valor ?? 0),
        })),
        byYear: byYear.map((y) => ({
          ano: y.ano,
          total: Number(y._sum.valor ?? 0),
        })),
      },
      comparisons: {
        partyAverage: partyAvg,
        stateAverage: stateAvg,
        overallAverage: overallAvg,
      },
      periodo: { ano: year },
      atualizadoEm: politician.updatedAt.toISOString(),
    }
  }

  async getFilters() {
    const [parties, states, years, houses] = await Promise.all([
      this.prisma.politician.groupBy({
        by: ['partido'],
        _count: true,
        where: { active: true },
        orderBy: { _count: { partido: 'desc' } },
      }),
      this.prisma.politician.groupBy({
        by: ['uf'],
        _count: true,
        where: { active: true },
        orderBy: { _count: { uf: 'desc' } },
      }),
      this.prisma.politicianExpense.findMany({
        select: { ano: true },
        distinct: ['ano'],
        orderBy: { ano: 'desc' },
      }),
      this.prisma.politician.groupBy({
        by: ['house'],
        _count: true,
        where: { active: true },
      }),
    ])

    return {
      parties: parties.map((p) => ({ sigla: p.partido, count: p._count })),
      states: states.map((s) => ({ uf: s.uf, count: s._count })),
      years: years.map((y) => y.ano),
      houses: houses.map((h) => ({ house: h.house, count: h._count })),
    }
  }

  async getLatestSnapshot() {
    const snapshot = await this.prisma.politiciansSnapshot.findFirst({
      where: { isLatest: true },
      orderBy: { createdAt: 'desc' },
    })

    if (!snapshot) {
      return {
        periodo: {
          anoAtual: new Date().getFullYear(),
          anoAnterior: new Date().getFullYear() - 1,
        },
        deputados: {
          ranking: [],
          totalGasto: 0,
          totalGastoAnoAnterior: 0,
        },
        senadores: {
          ranking: [],
          porPartido: [],
          totalGasto: 0,
          totalGastoAnoAnterior: 0,
        },
        emendas: {
          topAutores: [],
          totalPago: 0,
          totalEmpenhado: 0,
          totalPagoAnoAnterior: 0,
        },
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

  private async getAverageByGroup(
    field: 'partido' | 'uf',
    value: string,
    year: number,
  ): Promise<number> {
    const result = await this.prisma.politicianExpense.aggregate({
      _avg: { valor: true },
      where: {
        ano: year,
        politician: { [field]: value, active: true },
      },
    })
    return Number(result._avg.valor ?? 0)
  }

  private async getOverallAverage(year: number): Promise<number> {
    const result = await this.prisma.politicianExpense.aggregate({
      _avg: { valor: true },
      where: { ano: year, politician: { active: true } },
    })
    return Number(result._avg.valor ?? 0)
  }
}
