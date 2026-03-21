import { getCached, setCache } from '@/lib/api/cache'
import { fetchSpendingSummary } from '@/lib/api/transparency'
import type { SpendingSummary } from '@/lib/api/types'

const CACHE_TTL = 300

export async function getSpendingData(year: number): Promise<SpendingSummary> {
  const cacheKey = `spending-${year}`

  const cached = await getCached<SpendingSummary>(cacheKey)
  if (cached) {
    return { ...cached, source: 'cached' as const }
  }

  try {
    const data = await fetchSpendingSummary(year)
    const result: SpendingSummary = { ...data, source: 'live' as const }
    await setCache(cacheKey, result, CACHE_TTL)
    return result
  } catch (error) {
    console.error('[spending-service] Failed to fetch spending data:', error)
    return {
      totalPago: 0,
      totalEmpenhado: 0,
      totalLiquidado: 0,
      porOrgao: [],
      atualizadoEm: new Date().toISOString(),
      source: 'error' as const,
    }
  }
}
