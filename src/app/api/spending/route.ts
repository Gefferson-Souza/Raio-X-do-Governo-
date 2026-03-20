import { NextResponse } from 'next/server'
import { getSpendingData } from '@/lib/services/spending-service'

export async function GET() {
  const summary = await getSpendingData(new Date().getFullYear())

  const headers: Record<string, string> = {
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    'X-Data-Source': summary.source,
  }

  if (summary.source === 'error') {
    return NextResponse.json(
      { error: 'Failed to fetch spending data from Portal da Transparencia', data: summary },
      { status: 502, headers },
    )
  }

  return NextResponse.json(summary, { headers })
}
