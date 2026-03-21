import { getCached } from '@/lib/api/cache'
import type { PoliticiansData } from '@/lib/api/camara-types'

const CACHE_KEY = 'politicians-data'

const currentYear = new Date().getFullYear()

const EMPTY_DATA: PoliticiansData = {
  periodo: { anoAtual: currentYear, anoAnterior: currentYear - 1 },
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
  const cached = await getCached<PoliticiansData>(CACHE_KEY)
  return cached ?? EMPTY_DATA
}
