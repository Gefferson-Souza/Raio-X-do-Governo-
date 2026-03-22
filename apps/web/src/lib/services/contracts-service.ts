import type { Contrato } from '@/lib/api/types'

const API_URL = process.env.API_URL ?? 'http://localhost:3001'

export async function getRecentContracts(_days: number = 30): Promise<{
  readonly data: Contrato[]
  readonly source: 'live' | 'cached' | 'error'
}> {
  try {
    const res = await fetch(`${API_URL}/api/v1/spending/contracts`, {
      next: { revalidate: 600 },
    })

    if (!res.ok) {
      throw new Error(`NestJS API returned ${res.status}`)
    }

    const result = await res.json() as { data: Contrato[]; source: 'cached' | 'error'; atualizadoEm: string }
    return { data: result.data ?? [], source: result.source === 'error' ? 'error' : 'cached' }
  } catch (error) {
    console.error('[contracts-service] Failed to fetch from NestJS:', error)
    return { data: [], source: 'error' }
  }
}
