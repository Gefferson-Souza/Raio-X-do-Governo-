import { getCached, setCache } from '@/lib/api/cache'
import { fetchRecentContracts } from '@/lib/api/transparency'
import type { Contrato } from '@/lib/api/types'

const CACHE_TTL = 600

export async function getRecentContracts(days: number = 30): Promise<{
  readonly data: Contrato[]
  readonly source: 'live' | 'cached' | 'error'
}> {
  const cacheKey = `contracts-recent-${days}`

  const cached = await getCached<Contrato[]>(cacheKey)
  if (cached) {
    return { data: cached, source: 'cached' }
  }

  try {
    const data = await fetchRecentContracts(days)
    await setCache(cacheKey, data, CACHE_TTL)
    return { data, source: 'live' }
  } catch (error) {
    console.error('[contracts-service] Failed to fetch contracts:', error)
    return { data: [], source: 'error' }
  }
}
