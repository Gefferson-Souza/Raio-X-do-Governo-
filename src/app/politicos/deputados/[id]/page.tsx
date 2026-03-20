'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import type { PoliticiansData } from '@/lib/api/camara-types'
import { humanizeNumber, formatBRL } from '@/lib/utils/format'
import { convertToEquivalences } from '@/lib/utils/equivalences'
import { REFERENCES } from '@/lib/utils/constants'
import { MaterialIcon } from '@/components/icons/material-icon'
import Link from 'next/link'

const EMPTY_DATA: PoliticiansData = {
  deputados: { ranking: [], totalGasto: 0 },
  senadores: { ranking: [], porPartido: [], totalGasto: 0 },
  emendas: { topAutores: [], totalPago: 0, totalEmpenhado: 0 },
  viagens: { recentes: [], totalGasto: 0 },
  cartoes: { topPortadores: [], totalGasto: 0 },
  remuneracoes: { topServidores: [] },
  atualizadoEm: '',
  status: 'error',
}

export default function DeputadoDetailPage() {
  const params = useParams<{ id: string }>()
  const numericId = parseInt(params.id, 10)

  const { data } = useQuery<PoliticiansData>({
    queryKey: ['politicians'],
    queryFn: async () => {
      const res = await fetch('/api/politicians')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
    initialData: EMPTY_DATA,
    initialDataUpdatedAt: 0,
    refetchInterval: 60 * 60 * 1000,
  })

  const deputado = data.deputados.ranking.find((d) => d.id === numericId)

  if (!data.atualizadoEm) {
    return (
      <div className="pb-12 lg:pl-8 px-4 md:px-8">
        <Link href="/politicos" className="inline-flex items-center gap-2 font-label text-sm text-primary uppercase tracking-wider mt-4 mb-6 hover:underline">
          <MaterialIcon icon="arrow_back" size={18} /> VOLTAR AO RANKING
        </Link>
        <div className="bg-surface-container border-2 border-outline-variant p-8 text-center">
          <MaterialIcon icon="hourglass_empty" size={48} className="text-on-surface-variant/30" />
          <h3 className="font-headline font-black uppercase text-xl mt-4">CARREGANDO DADOS...</h3>
        </div>
      </div>
    )
  }

  if (!deputado) {
    return (
      <div className="pb-12 lg:pl-8 px-4 md:px-8">
        <Link href="/politicos" className="inline-flex items-center gap-2 font-label text-sm text-primary uppercase tracking-wider mt-4 mb-6 hover:underline">
          <MaterialIcon icon="arrow_back" size={18} /> VOLTAR AO RANKING
        </Link>
        <div className="bg-surface-container border-2 border-outline-variant p-8 text-center">
          <MaterialIcon icon="error_outline" size={48} className="text-error/50" />
          <h3 className="font-headline font-black uppercase text-xl mt-4">DEPUTADO NAO ENCONTRADO</h3>
          <p className="font-body text-on-surface-variant mt-2">
            Este deputado nao esta no ranking atual. Apenas os 20 maiores gastadores sao exibidos.
          </p>
        </div>
      </div>
    )
  }

  const eq = convertToEquivalences(deputado.totalGasto)
  const salarios = Math.floor(deputado.totalGasto / REFERENCES.salarioMinimo)
  const maxDespesa = deputado.topDespesas[0]?.total ?? 1

  return (
    <div className="pb-12 lg:pl-8 px-4 md:px-8">
      <Link href="/politicos" className="inline-flex items-center gap-2 font-label text-sm text-primary uppercase tracking-wider mt-4 mb-6 hover:underline">
        <MaterialIcon icon="arrow_back" size={18} /> VOLTAR AO RANKING
      </Link>

      {/* HEADER */}
      <section className="bg-emerald-900 p-8 md:p-12 -mx-4 md:-mx-8 lg:mx-0 flex flex-col md:flex-row items-center md:items-start gap-6">
        {deputado.foto ? (
          <img
            src={deputado.foto}
            alt={deputado.nome}
            className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-yellow-400 bg-surface-container"
          />
        ) : (
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-emerald-800 flex items-center justify-center border-4 border-yellow-400">
            <MaterialIcon icon="person" size={48} className="text-white/40" />
          </div>
        )}
        <div className="text-center md:text-left">
          <span className="inline-block bg-yellow-400 text-emerald-950 px-3 py-1 font-label text-xs font-bold uppercase tracking-widest mb-3">
            DEPUTADO FEDERAL
          </span>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter font-headline text-white">
            {deputado.nome}
          </h1>
          <p className="mt-2 text-lg font-label text-white/70 uppercase tracking-wider">
            {deputado.partido}-{deputado.uf}
          </p>
        </div>
      </section>

      {/* TOTAL GASTO */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-0 -mx-4 md:-mx-8 lg:mx-0">
        <div className="p-6 bg-yellow-400">
          <span className="block text-xs uppercase tracking-widest font-label text-emerald-950">Gastou da cota parlamentar em {new Date().getFullYear()} ate agora</span>
          <span className="block text-3xl font-black tracking-tighter font-headline text-emerald-950">{humanizeNumber(deputado.totalGasto)}</span>
        </div>
        <div className="p-6 bg-surface-container-highest">
          <span className="block text-xs uppercase tracking-widest font-label text-on-surface-variant">Em salarios minimos</span>
          <span className="block text-3xl font-black tracking-tighter font-headline text-on-surface">{salarios.toLocaleString('pt-BR')}</span>
        </div>
        <div className="p-6 bg-emerald-900">
          <span className="block text-xs uppercase tracking-widest font-label text-emerald-300">Em cestas basicas</span>
          <span className="block text-3xl font-black tracking-tighter font-headline text-white">{eq.cestasBasicas.toLocaleString('pt-BR')}</span>
        </div>
      </section>

      {/* BREAKDOWN */}
      {deputado.topDespesas.length > 0 && (
        <section className="mt-10">
          <h2 className="font-headline font-black uppercase text-2xl tracking-tighter text-on-surface mb-2">GASTOU COM O QUE?</h2>
          <p className="font-body text-sm text-on-surface-variant mb-6">Onde esse deputado gastou a cota parlamentar em {new Date().getFullYear()} ate agora • Fonte: Camara dos Deputados</p>
          <div className="flex flex-col gap-4">
            {deputado.topDespesas.map((desp) => {
              const percent = (desp.total / maxDespesa) * 100
              return (
                <div key={desp.tipo} className="flex flex-col gap-1">
                  <div className="flex justify-between items-baseline gap-4">
                    <span className="font-label text-sm font-bold text-on-surface truncate">{desp.tipo}</span>
                    <span className="font-headline font-black text-base text-error whitespace-nowrap">{formatBRL(desp.total)}</span>
                  </div>
                  <div role="progressbar" aria-valuenow={Math.round(percent)} aria-valuemin={0} aria-valuemax={100} aria-label={`${desp.tipo}: ${Math.round(percent)}%`} className="h-3 bg-surface-container-highest rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* EQUIVALENCIAS */}
      <section className="mt-10">
        <h2 className="font-headline font-black uppercase text-2xl tracking-tighter text-on-surface mb-2">O QUE ESSE DINHEIRO COMPRA</h2>
        <p className="font-body text-sm text-on-surface-variant mb-6">Se esse dinheiro fosse usado de outra forma, compraria:</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: 'restaurant', value: eq.cestasBasicas, label: 'cestas basicas', color: 'text-error' },
            { icon: 'local_hospital', value: eq.consultasSUS, label: 'consultas SUS', color: 'text-primary' },
            { icon: 'school', value: eq.kitsEscolares, label: 'kits escolares', color: 'text-secondary' },
            { icon: 'payments', value: salarios, label: 'salarios minimos', color: 'text-tertiary' },
          ].map((item) => (
            <div key={item.label} className="bg-white border-2 border-outline-variant p-4">
              <MaterialIcon icon={item.icon} size={24} className={`${item.color} mb-2`} />
              <span className="block font-headline font-black text-xl text-on-surface">{item.value.toLocaleString('pt-BR')}</span>
              <span className="block font-label text-xs text-on-surface-variant uppercase">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* SOURCE */}
      <section className="mt-12 text-center">
        <p className="text-xs font-label text-on-surface-variant uppercase tracking-widest">Fonte: Dados Abertos da Camara dos Deputados — CEAP</p>
        <a
          href={`https://www.camara.leg.br/deputados/${deputado.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-4 bg-primary text-on-primary font-label font-bold uppercase tracking-wider px-6 py-3"
        >
          <MaterialIcon icon="open_in_new" size={18} /> VER NO SITE DA CAMARA
        </a>
      </section>
    </div>
  )
}
