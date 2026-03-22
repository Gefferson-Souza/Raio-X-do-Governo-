import type { PoliticiansData } from '@/lib/api/camara-types'

const API_URL = process.env.API_URL ?? 'http://localhost:3001'

const EMPTY_DATA: PoliticiansData = {
  periodo: { anoAtual: new Date().getFullYear(), anoAnterior: new Date().getFullYear() - 1 },
  deputados: { ranking: [], totalGasto: 0, totalGastoAnoAnterior: 0 },
  senadores: { ranking: [], porPartido: [], totalGasto: 0, totalGastoAnoAnterior: 0 },
  emendas: { topAutores: [], totalPago: 0, totalEmpenhado: 0, totalPagoAnoAnterior: 0 },
  viagens: { recentes: [], totalGasto: 0 },
  cartoes: { topPortadores: [], totalGasto: 0 },
  remuneracoes: { topServidores: [] },
  atualizadoEm: '',
  status: 'error',
}

export async function getPoliticiansData(): Promise<PoliticiansData> {
  try {
    const res = await fetch(`${API_URL}/api/v1/politicians`, {
      next: { revalidate: 3600 },
    })

    if (!res.ok) {
      throw new Error(`NestJS API returned ${res.status}`)
    }

    return await res.json() as PoliticiansData
  } catch (error) {
    console.error('[politicians-service] Failed to fetch from NestJS:', error)
    return EMPTY_DATA
  }
}
