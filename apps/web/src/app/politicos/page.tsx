import { Suspense } from 'react'
import { PoliticiansHub } from './_components/politicians-hub'
import { MaterialIcon } from '@/components/icons/material-icon'

export const revalidate = 3600

const API_URL = process.env.API_URL ?? 'http://localhost:3001'

interface FiltersResponse {
  readonly parties: ReadonlyArray<{ sigla: string; count: number }>
  readonly states: ReadonlyArray<{ uf: string; count: number }>
  readonly years: readonly number[]
  readonly houses: ReadonlyArray<{ house: string; count: number }>
}

async function getFilters(): Promise<FiltersResponse | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/politicians/filters`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    return await res.json() as FiltersResponse
  } catch {
    return null
  }
}

export default async function PoliticosPage() {
  const filters = await getFilters()

  const totalPoliticians = filters
    ? filters.houses.reduce((sum, h) => sum + h.count, 0)
    : 0

  return (
    <div className="pb-12 lg:pl-8 px-4 md:px-8">
      <section className="bg-emerald-900 p-8 md:p-12 -mx-4 md:-mx-8 lg:mx-0">
        <span className="inline-block bg-yellow-400 text-emerald-950 px-4 py-1 font-label text-xs font-bold uppercase tracking-widest mb-6">
          DADOS ABERTOS — CAMARA + SENADO + PORTAL DA TRANSPARENCIA
        </span>
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter font-headline text-white">
          RAIO-X DOS POLITICOS
        </h1>

        {filters && (
          <p className="mt-3 font-label text-xs text-white/50 uppercase tracking-widest">
            {totalPoliticians} politicos | {filters.parties.length} partidos | {filters.states.length} estados
          </p>
        )}
      </section>

      <Suspense fallback={
        <div className="mt-8 p-8 text-center">
          <MaterialIcon icon="progress_activity" size={48} className="text-primary animate-spin" />
          <p className="font-body text-on-surface-variant mt-4">Carregando politicos...</p>
        </div>
      }>
        <PoliticiansHub />
      </Suspense>

      <footer className="mt-8 text-center">
        <p className="font-label text-xs text-on-surface-variant uppercase tracking-widest">
          Fonte: Camara dos Deputados + Senado Federal | Dados atualizados diariamente
        </p>
      </footer>
    </div>
  )
}
