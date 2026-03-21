import type { PoliticiansData } from '@/lib/api/camara-types'

export const EMPTY_POLITICIANS_DATA: PoliticiansData = {
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
