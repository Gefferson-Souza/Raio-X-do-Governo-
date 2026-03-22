import type { SpendingSummary } from '@/lib/api/types'

const API_URL = process.env.API_URL ?? 'http://localhost:3001'

export async function getSpendingData(year: number): Promise<SpendingSummary> {
  try {
    const res = await fetch(`${API_URL}/api/v1/spending/summary?year=${year}`, {
      next: { revalidate: 300 },
    })

    if (!res.ok) {
      throw new Error(`NestJS API returned ${res.status}`)
    }

    return await res.json() as SpendingSummary
  } catch (error) {
    console.error('[spending-service] Failed to fetch from NestJS:', error)
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
