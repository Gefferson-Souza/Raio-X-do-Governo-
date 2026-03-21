'use client'

import { useQuery } from '@tanstack/react-query'
import type { PoliticiansData } from '@/lib/api/camara-types'
import { humanizeNumber, formatDateBR } from '@/lib/utils/format'
import { REFERENCES } from '@/lib/utils/constants'
import { MaterialIcon } from '@/components/icons/material-icon'
import Link from 'next/link'
import { EMPTY_POLITICIANS_DATA } from '@/lib/utils/empty-politicians-data'

export default function PartidosPage() {
  const { data } = useQuery<PoliticiansData>({
    queryKey: ['politicians'],
    queryFn: async () => {
      const res = await fetch('/api/politicians')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
    initialData: EMPTY_POLITICIANS_DATA,
    initialDataUpdatedAt: 0,
    refetchInterval: 60 * 60 * 1000,
  })

  const hasData = data.atualizadoEm !== ''

  const partidos = [...data.senadores.porPartido]
    .filter((p) => p.quantidadeParlamentares > 0)
    .map((p) => ({ ...p, mediaPorParlamentar: p.totalGasto / p.quantidadeParlamentares }))
    .sort((a, b) => b.mediaPorParlamentar - a.mediaPorParlamentar)

  const maxMedia = partidos[0]?.mediaPorParlamentar ?? 1
  const totalGeralPartidos = partidos.reduce((sum, p) => sum + p.totalGasto, 0)
  const totalParlamentares = partidos.reduce((sum, p) => sum + p.quantidadeParlamentares, 0)
  const mediaGeral = totalParlamentares > 0 ? totalGeralPartidos / totalParlamentares : 0

  return (
    <div className="pb-12 lg:pl-8 px-4 md:px-8">
      <Link href="/politicos" className="inline-flex items-center gap-2 font-label text-sm text-primary uppercase tracking-wider mt-4 mb-6 hover:underline">
        <MaterialIcon icon="arrow_back" size={18} /> VOLTAR
      </Link>

      <section className="bg-emerald-900 p-8 md:p-12 -mx-4 md:-mx-8 lg:mx-0">
        <span className="inline-block bg-yellow-400 text-emerald-950 px-4 py-1 font-label text-xs font-bold uppercase tracking-widest mb-6">DADOS DO SENADO FEDERAL — CEAPS</span>
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter font-headline text-white">RAIO-X DOS PARTIDOS</h1>
        <p className="mt-4 text-lg font-body text-white/60">Quanto cada partido gastou da cota parlamentar no ultimo ano com dados disponiveis</p>
        {hasData && <p className="mt-4 text-xs font-label text-white/40 uppercase tracking-widest">Atualizado em {formatDateBR(data.atualizadoEm)}</p>}
      </section>

      {!hasData && (
        <section className="mt-8">
          <div className="bg-surface-container border-2 border-outline-variant p-8 text-center">
            <MaterialIcon icon="hourglass_empty" size={48} className="text-on-surface-variant/30" />
            <h3 className="font-headline font-black uppercase text-xl mt-4">DADOS SENDO COLETADOS</h3>
            <p className="font-body text-on-surface-variant mt-2">Volte em breve.</p>
          </div>
        </section>
      )}

      {hasData && partidos.length > 0 && (
        <>
          {/* STATS */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-0 -mx-4 md:-mx-8 lg:mx-0">
            <div className="p-6 bg-yellow-400">
              <span className="block text-xs uppercase tracking-widest font-label text-emerald-950">Total gasto</span>
              <span className="block text-3xl font-black tracking-tighter font-headline text-emerald-950">{humanizeNumber(totalGeralPartidos)}</span>
            </div>
            <div className="p-6 bg-surface-container-highest">
              <span className="block text-xs uppercase tracking-widest font-label text-on-surface-variant">Media por parlamentar</span>
              <span className="block text-3xl font-black tracking-tighter font-headline text-error">{humanizeNumber(mediaGeral)}</span>
            </div>
            <div className="p-6 bg-emerald-900">
              <span className="block text-xs uppercase tracking-widest font-label text-emerald-300">Partidos com dados</span>
              <span className="block text-3xl font-black tracking-tighter font-headline text-white">{partidos.length}</span>
            </div>
          </section>

          {/* PODIUM */}
          {partidos.length >= 3 && (
            <section className="mt-12">
              <h2 className="font-headline font-black uppercase text-2xl tracking-tighter text-on-surface mb-6">TOP 3 — MAIOR MEDIA POR PARLAMENTAR</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {partidos.slice(0, 3).map((p, i) => {
                  const colors = ['border-yellow-400 bg-yellow-400/10', 'border-slate-400 bg-slate-400/10', 'border-amber-700 bg-amber-700/10']
                  const badges = ['OURO', 'PRATA', 'BRONZE']
                  return (
                    <div key={p.partido} className={`border-2 ${colors[i]} p-6`}>
                      <span className="font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant">{badges[i]} — #{i + 1}</span>
                      <span className="block text-3xl font-black tracking-tighter font-headline text-on-surface mt-2">{p.partido}</span>
                      <span className="block text-2xl font-black tracking-tighter font-headline text-error mt-2">{humanizeNumber(p.mediaPorParlamentar)}</span>
                      <span className="block font-label text-xs text-on-surface-variant mt-1">media/parlamentar/ano</span>
                      <div className="mt-3 pt-3 border-t border-outline-variant">
                        <span className="block font-label text-xs text-on-surface-variant">{p.quantidadeParlamentares} parlamentar{p.quantidadeParlamentares !== 1 ? 'es' : ''}</span>
                        <span className="block font-label text-xs text-on-surface-variant">Total: {humanizeNumber(p.totalGasto)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* BAR CHART */}
          <section className="mt-12">
            <h2 className="font-headline font-black uppercase text-2xl tracking-tighter text-on-surface mb-2">GASTO MEDIO POR PARLAMENTAR</h2>
            <p className="font-body text-sm text-on-surface-variant mb-6">Ordenado pelo custo medio por senador no ultimo ano com dados • Linha tracejada = media geral • Fonte: Senado Federal</p>
            <div className="flex flex-col gap-3">
              {partidos.map((p) => {
                const percent = maxMedia > 0 ? (p.mediaPorParlamentar / maxMedia) * 100 : 0
                const avgPercent = maxMedia > 0 ? (mediaGeral / maxMedia) * 100 : 0
                return (
                  <div key={p.partido} className="flex items-center gap-4">
                    <span className="font-headline font-black text-base text-on-surface w-16 shrink-0">{p.partido}</span>
                    <div className="flex-1 relative">
                      <div className="h-8 bg-surface-container-highest rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full flex items-center justify-end pr-3" style={{ width: `${Math.max(percent, 2)}%` }}>
                          {percent > 30 && <span className="font-label text-xs font-bold text-on-primary whitespace-nowrap">{humanizeNumber(p.mediaPorParlamentar)}</span>}
                        </div>
                      </div>
                      <div className="absolute top-0 h-8 border-l-2 border-dashed border-error/50" style={{ left: `${avgPercent}%` }} />
                    </div>
                    {percent <= 30 && <span className="font-label text-xs font-bold text-on-surface whitespace-nowrap shrink-0">{humanizeNumber(p.mediaPorParlamentar)}</span>}
                    <span className="font-label text-xs text-on-surface-variant whitespace-nowrap shrink-0 w-20 text-right hidden md:block">({p.quantidadeParlamentares} sen.)</span>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center gap-2 mt-4">
              <div className="w-6 border-t-2 border-dashed border-error/50" />
              <span className="font-label text-xs text-on-surface-variant">Media geral: {humanizeNumber(mediaGeral)}/parlamentar</span>
            </div>
          </section>

          {/* TABELA */}
          <section className="mt-12">
            <h2 className="font-headline font-black uppercase text-xl tracking-tighter text-on-surface mb-4">TABELA COMPLETA</h2>
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <table className="w-full min-w-[640px] bg-white border-2 border-outline-variant">
                <thead>
                  <tr className="bg-surface-container-highest">
                    <th className="p-3 text-left font-label text-xs uppercase tracking-wider text-on-surface-variant">Partido</th>
                    <th className="p-3 text-right font-label text-xs uppercase tracking-wider text-on-surface-variant">Parlamentares</th>
                    <th className="p-3 text-right font-label text-xs uppercase tracking-wider text-on-surface-variant">Total gasto</th>
                    <th className="p-3 text-right font-label text-xs uppercase tracking-wider text-on-surface-variant">Media/parlamentar</th>
                    <th className="p-3 text-right font-label text-xs uppercase tracking-wider text-on-surface-variant">Em salarios minimos</th>
                  </tr>
                </thead>
                <tbody>
                  {partidos.map((p) => (
                    <tr key={p.partido} className="border-t border-outline-variant hover:bg-surface-container-low transition-colors">
                      <td className="p-3 font-headline font-black text-on-surface">{p.partido}</td>
                      <td className="p-3 text-right font-label text-sm text-on-surface-variant">{p.quantidadeParlamentares}</td>
                      <td className="p-3 text-right font-headline font-black text-error">{humanizeNumber(p.totalGasto)}</td>
                      <td className="p-3 text-right font-headline font-black text-on-surface">{humanizeNumber(p.mediaPorParlamentar)}</td>
                      <td className="p-3 text-right font-label text-sm text-on-surface-variant">{Math.floor(p.mediaPorParlamentar / REFERENCES.salarioMinimo).toLocaleString('pt-BR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* CTA */}
          <section className="mt-12 text-center">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/politicos" className="inline-flex items-center gap-2 bg-primary text-on-primary font-label font-bold uppercase tracking-wider px-6 py-4">
                <MaterialIcon icon="leaderboard" size={18} /> VER RANKING INDIVIDUAL
              </Link>
              <Link href="/politicos/congresso" className="inline-flex items-center gap-2 bg-secondary-container text-on-secondary-container font-label font-bold uppercase tracking-wider px-6 py-4">
                <MaterialIcon icon="account_balance" size={18} /> CUSTO DO CONGRESSO
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
