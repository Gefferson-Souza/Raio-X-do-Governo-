import { NextResponse } from 'next/server'
import { getCached, setCache } from '@/lib/api/cache'
import type { SpendingSummary } from '@/lib/api/types'

const CACHE_KEY = 'spending-summary-2025'
const CACHE_TTL_SECONDS = 300

const MOCK_SUMMARY: SpendingSummary = {
  totalPago: 1_892_400_000_000,
  totalEmpenhado: 2_145_700_000_000,
  totalLiquidado: 1_998_300_000_000,
  porOrgao: [
    {
      ano: 2025,
      codigoOrgaoSuperior: '26000',
      nomeOrgaoSuperior: 'Ministério da Educação',
      codigoOrgao: '26101',
      nomeOrgao: 'Secretaria Executiva - MEC',
      valorEmpenhado: 158_200_000_000,
      valorLiquidado: 142_800_000_000,
      valorPago: 135_600_000_000,
      valorRestoInscrito: 12_400_000_000,
      valorRestoPago: 8_200_000_000,
    },
    {
      ano: 2025,
      codigoOrgaoSuperior: '36000',
      nomeOrgaoSuperior: 'Ministério da Saúde',
      codigoOrgao: '36101',
      nomeOrgao: 'Secretaria Executiva - MS',
      valorEmpenhado: 198_500_000_000,
      valorLiquidado: 182_300_000_000,
      valorPago: 174_900_000_000,
      valorRestoInscrito: 15_200_000_000,
      valorRestoPago: 10_800_000_000,
    },
    {
      ano: 2025,
      codigoOrgaoSuperior: '52000',
      nomeOrgaoSuperior: 'Ministério da Defesa',
      codigoOrgao: '52101',
      nomeOrgao: 'Secretaria Executiva - MD',
      valorEmpenhado: 125_800_000_000,
      valorLiquidado: 118_400_000_000,
      valorPago: 112_300_000_000,
      valorRestoInscrito: 8_500_000_000,
      valorRestoPago: 5_400_000_000,
    },
  ],
  atualizadoEm: new Date().toISOString(),
}

export async function GET() {
  const cached = await getCached<SpendingSummary>(CACHE_KEY)

  if (cached) {
    return NextResponse.json(cached, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  }

  const apiKey = process.env.TRANSPARENCY_API_KEY

  if (!apiKey) {
    await setCache(CACHE_KEY, MOCK_SUMMARY, CACHE_TTL_SECONDS)
    return NextResponse.json(MOCK_SUMMARY, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Data-Source': 'mock',
      },
    })
  }

  try {
    const { fetchSpendingSummary } = await import('@/lib/api/transparency')
    const summary = await fetchSpendingSummary(2025)
    await setCache(CACHE_KEY, summary, CACHE_TTL_SECONDS)

    return NextResponse.json(summary, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Data-Source': 'api',
      },
    })
  } catch {
    await setCache(CACHE_KEY, MOCK_SUMMARY, CACHE_TTL_SECONDS)
    return NextResponse.json(MOCK_SUMMARY, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Data-Source': 'mock-fallback',
      },
    })
  }
}
