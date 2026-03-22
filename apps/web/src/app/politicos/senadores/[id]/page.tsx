import type { Metadata } from 'next'
import Link from 'next/link'
import { MaterialIcon } from '@/components/icons/material-icon'
import { humanizeNumber, formatBRL } from '@/lib/utils/format'
import { convertToEquivalences } from '@/lib/utils/equivalences'
import { REFERENCES } from '@/lib/utils/constants'
import { ExpenseBreakdown } from '@/components/ui/expense-breakdown'
import { ShareButtons } from './_share-buttons'

const API_URL = process.env.API_URL ?? 'http://localhost:3001'

interface SenatorProfile {
  readonly id: number
  readonly nome: string
  readonly partido: string
  readonly uf: string
  readonly foto: string
}

interface SpendingByType {
  readonly tipo: string
  readonly total: number
}

interface SpendingByYear {
  readonly ano: number
  readonly total: number
}

interface SenatorComparison {
  readonly label: string
  readonly value: number
}

interface SenatorData {
  readonly profile: SenatorProfile
  readonly spending: {
    readonly total: number
    readonly byType: readonly SpendingByType[]
    readonly byYear: readonly SpendingByYear[]
  }
  readonly comparisons: readonly SenatorComparison[]
}

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ year?: string }>
}

async function getSenatorData(id: string, year?: string): Promise<SenatorData | null> {
  try {
    const yearParam = year ? `?year=${year}` : ''
    const res = await fetch(`${API_URL}/api/v1/politicians/senators/${id}${yearParam}`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    return await res.json() as SenatorData
  } catch {
    return null
  }
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { id } = await params
  const { year } = await searchParams
  const data = await getSenatorData(id, year)

  if (!data) {
    return { title: 'Senador nao encontrado — Raio-X do Governo' }
  }

  const { profile } = data
  return {
    title: `Gastos de ${profile.nome} (${profile.partido}-${profile.uf}) — Raio-X do Governo`,
    description: `Veja quanto o senador ${profile.nome} (${profile.partido}-${profile.uf}) gastou da cota parlamentar. Dados abertos do Senado Federal.`,
  }
}

export default async function SenadorDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { year } = await searchParams
  const data = await getSenatorData(id, year)
  const displayYear = year ?? new Date().getFullYear().toString()

  if (!data) {
    return (
      <div className="pb-12 lg:pl-8 px-4 md:px-8">
        <Link
          href="/politicos"
          className="inline-flex items-center gap-2 font-label text-sm text-primary uppercase tracking-wider mt-4 mb-6 hover:underline"
        >
          <MaterialIcon icon="arrow_back" size={18} /> VOLTAR AO RANKING
        </Link>
        <div className="bg-surface-container border-2 border-outline-variant p-8 text-center">
          <MaterialIcon icon="error_outline" size={48} className="text-error/50" />
          <h3 className="font-headline font-black uppercase text-xl mt-4">
            SENADOR NAO ENCONTRADO
          </h3>
          <p className="font-body text-on-surface-variant mt-2">
            Nao foi possivel carregar os dados deste senador.
          </p>
        </div>
      </div>
    )
  }

  const { profile, spending, comparisons } = data
  const eq = convertToEquivalences(spending.total)
  const salarios = Math.floor(spending.total / REFERENCES.salarioMinimo)

  return (
    <div className="pb-12 lg:pl-8 px-4 md:px-8">
      <Link
        href="/politicos"
        className="inline-flex items-center gap-2 font-label text-sm text-primary uppercase tracking-wider mt-4 mb-6 hover:underline"
      >
        <MaterialIcon icon="arrow_back" size={18} /> VOLTAR AO RANKING
      </Link>

      {/* HEADER */}
      <section className="bg-emerald-900 p-8 md:p-12 -mx-4 md:-mx-8 lg:mx-0 flex flex-col md:flex-row items-center md:items-start gap-6">
        {profile.foto ? (
          <img
            src={profile.foto}
            alt={profile.nome}
            className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-yellow-400 bg-surface-container"
          />
        ) : (
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-emerald-800 flex items-center justify-center border-4 border-yellow-400">
            <MaterialIcon icon="person" size={48} className="text-white/40" />
          </div>
        )}
        <div className="text-center md:text-left">
          <span className="inline-block bg-yellow-400 text-emerald-950 px-3 py-1 font-label text-xs font-bold uppercase tracking-widest mb-3">
            SENADOR
          </span>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter font-headline text-white">
            {profile.nome}
          </h1>
          <p className="mt-2 text-lg font-label text-white/70 uppercase tracking-wider">
            {profile.partido}-{profile.uf}
          </p>
        </div>
      </section>

      {/* TOTAL GASTO */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-0 -mx-4 md:-mx-8 lg:mx-0">
        <div className="p-6 bg-yellow-400">
          <span className="block text-xs uppercase tracking-widest font-label text-emerald-950">
            Gastou da cota parlamentar em {displayYear}
          </span>
          <span className="block text-3xl font-black tracking-tighter font-headline text-emerald-950">
            {humanizeNumber(spending.total)}
          </span>
        </div>
        <div className="p-6 bg-surface-container-highest">
          <span className="block text-xs uppercase tracking-widest font-label text-on-surface-variant">
            Em salarios minimos
          </span>
          <span className="block text-3xl font-black tracking-tighter font-headline text-on-surface">
            {salarios.toLocaleString('pt-BR')}
          </span>
        </div>
        <div className="p-6 bg-emerald-900">
          <span className="block text-xs uppercase tracking-widest font-label text-emerald-300">
            Em cestas basicas
          </span>
          <span className="block text-3xl font-black tracking-tighter font-headline text-white">
            {eq.cestasBasicas.toLocaleString('pt-BR')}
          </span>
        </div>
      </section>

      {/* SPENDING BY TYPE */}
      {spending.byType.length > 0 && (
        <div className="mt-10">
          <ExpenseBreakdown
            data={spending.byType}
            title="GASTOU COM O QUE?"
            subtitle={`Onde esse senador gastou a cota parlamentar em ${displayYear} -- Fonte: Senado Federal`}
          />
        </div>
      )}

      {/* SPENDING BY YEAR */}
      {spending.byYear.length > 0 && (
        <section className="mt-10">
          <h2 className="font-headline font-black uppercase text-2xl tracking-tighter text-on-surface mb-2">
            HISTORICO POR ANO
          </h2>
          <p className="font-body text-sm text-on-surface-variant mb-6">
            Evolucao do gasto da cota parlamentar -- Fonte: Senado Federal
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {spending.byYear.map((yearData) => (
              <div
                key={yearData.ano}
                className="bg-white border-2 border-outline-variant p-4"
              >
                <span className="block font-label text-xs text-on-surface-variant uppercase">
                  {yearData.ano}
                </span>
                <span className="block font-headline font-black text-xl text-on-surface mt-1">
                  {humanizeNumber(yearData.total)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* COMPARISONS */}
      {comparisons.length > 0 && (
        <section className="mt-10">
          <h2 className="font-headline font-black uppercase text-2xl tracking-tighter text-on-surface mb-2">
            COMPARACOES
          </h2>
          <p className="font-body text-sm text-on-surface-variant mb-6">
            Como o gasto desse senador se compara -- Fonte: Senado Federal
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {comparisons.map((comparison) => (
              <div
                key={comparison.label}
                className="bg-white border-2 border-outline-variant p-4 flex justify-between items-baseline"
              >
                <span className="font-label text-sm font-bold text-on-surface">
                  {comparison.label}
                </span>
                <span className="font-headline font-black text-lg text-error">
                  {humanizeNumber(comparison.value)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* EQUIVALENCIAS */}
      <section className="mt-10">
        <h2 className="font-headline font-black uppercase text-2xl tracking-tighter text-on-surface mb-2">
          O QUE ESSE DINHEIRO COMPRA
        </h2>
        <p className="font-body text-sm text-on-surface-variant mb-6">
          Se esse dinheiro fosse usado de outra forma, compraria:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: 'restaurant', value: eq.cestasBasicas, label: 'cestas basicas', color: 'text-error' },
            { icon: 'local_hospital', value: eq.consultasSUS, label: 'consultas SUS', color: 'text-primary' },
            { icon: 'school', value: eq.kitsEscolares, label: 'kits escolares', color: 'text-secondary' },
            { icon: 'payments', value: salarios, label: 'salarios minimos', color: 'text-tertiary' },
          ].map((item) => (
            <div key={item.label} className="bg-white border-2 border-outline-variant p-4">
              <MaterialIcon icon={item.icon} size={24} className={`${item.color} mb-2`} />
              <span className="block font-headline font-black text-xl text-on-surface">
                {item.value.toLocaleString('pt-BR')}
              </span>
              <span className="block font-label text-xs text-on-surface-variant uppercase">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* SHARE + SOURCE */}
      <section className="mt-12 text-center">
        <ShareButtons
          nome={profile.nome}
          partido={profile.partido}
          uf={profile.uf}
          totalGasto={spending.total}
          senatorId={profile.id}
        />
        <p className="text-xs font-label text-on-surface-variant uppercase tracking-widest mt-6">
          Fonte: Dados Abertos do Senado Federal — CEAPS | Periodo: {displayYear}
        </p>
        <a
          href={`https://www25.senado.leg.br/web/senadores/senador/-/${profile.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-4 bg-primary text-on-primary font-label font-bold uppercase tracking-wider px-6 py-3"
        >
          <MaterialIcon icon="open_in_new" size={18} /> VER NO SITE DO SENADO
        </a>
      </section>
    </div>
  )
}
