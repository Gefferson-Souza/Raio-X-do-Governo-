import { getCached } from '@/lib/api/cache'
import type { PoliticiansData } from '@/lib/api/camara-types'

const CACHE_KEY = 'politicians-data'

const EMPTY_DATA: PoliticiansData = {
  deputados: { ranking: [], totalGasto: 0 },
  senadores: { ranking: [], porPartido: [], totalGasto: 0 },
  emendas: { topAutores: [], totalPago: 0, totalEmpenhado: 0 },
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
