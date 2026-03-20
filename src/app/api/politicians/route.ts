import { NextResponse } from 'next/server'
import { getPoliticiansData } from '@/lib/services/politicians-service'

export async function GET() {
  const data = await getPoliticiansData()

  const headers: Record<string, string> = {
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
  }

  if (!data.atualizadoEm) {
    return NextResponse.json(
      { error: 'No data available. Run the cron job first.', data },
      { status: 503, headers },
    )
  }

  return NextResponse.json(data, { headers })
}
