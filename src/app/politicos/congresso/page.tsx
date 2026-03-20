'use client'

import { useQuery } from '@tanstack/react-query'
import type { PoliticiansData } from '@/lib/api/camara-types'
import { humanizeNumber, formatBRL, formatDateBR } from '@/lib/utils/format'
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

export default function CongressoPage() {
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

  const hasData = data.atualizadoEm !== ''
  const custoDeputados = data.deputados.totalGasto
  const custoSenadores = data.senadores.totalGasto
  const custoTotal = custoDeputados + custoSenadores
  const perCapita = custoTotal > 0 ? custoTotal / REFERENCES.populacaoBR : 0
  const perDay = custoTotal > 0 ? custoTotal / 365 : 0
  const perMinute = custoTotal > 0 ? custoTotal / (365 * 24 * 60) : 0
  const numDeputados = data.deputados.ranking.length
  const numSenadores = data.senadores.ranking.length
  const mediaDeputado = numDeputados > 0 ? custoDeputados / numDeputados : 0
  const mediaSenador = numSenadores > 0 ? custoSenadores / numSenadores : 0
  const eq = convertToEquivalences(custoTotal)

  return (
    <div className="pb-12 lg:pl-8 px-4 md:px-8">
      <Link href="/politicos" className="inline-flex items-center gap-2 font-label text-sm text-primary uppercase tracking-wider mt-4 mb-6 hover:underline">
        <MaterialIcon icon="arrow_back" size={18} /> VOLTAR
      </Link>

      <section className="bg-emerald-900 p-8 md:p-12 -mx-4 md:-mx-8 lg:mx-0">
        <span className="inline-block bg-yellow-400 text-emerald-950 px-4 py-1 font-label text-xs font-bold uppercase tracking-widest mb-6">
          CUSTO DO CONGRESSO NACIONAL — {new Date().getFullYear()}
        </span>
        {hasData && custoTotal > 0 ? (
          <>
            <p className="text-6xl md:text-8xl font-black tracking-tighter font-headline text-white">{humanizeNumber(custoTotal)}</p>
            <p className="mt-4 text-lg md:text-xl font-body text-white/60">Quanto deputados e senadores gastaram da cota parlamentar em {new Date().getFullYear()} ate agora</p>
            <p className="mt-4 text-xs font-label text-white/40 uppercase tracking-widest">Fonte: Camara dos Deputados + Senado Federal • Atualizado em {formatDateBR(data.atualizadoEm)}</p>
          </>
        ) : (
          <p className="text-2xl font-headline font-black text-white/50">Dados sendo coletados...</p>
        )}
      </section>

      {hasData && custoTotal > 0 && (
        <>
          {/* PER CAPITA */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-0 -mx-4 md:-mx-8 lg:mx-0">
            <div className="p-6 bg-yellow-400">
              <span className="block text-xs uppercase tracking-widest font-label text-emerald-950">Por brasileiro</span>
              <span className="block text-3xl font-black tracking-tighter font-headline text-emerald-950">{formatBRL(perCapita)}</span>
              <span className="block text-xs font-body text-emerald-950/60 mt-1">por ano</span>
            </div>
            <div className="p-6 bg-surface-container-highest">
              <span className="block text-xs uppercase tracking-widest font-label text-on-surface-variant">Por dia</span>
              <span className="block text-3xl font-black tracking-tighter font-headline text-error">{humanizeNumber(perDay)}</span>
              <span className="block text-xs font-body text-on-surface-variant mt-1">todos os dias do ano</span>
            </div>
            <div className="p-6 bg-emerald-900">
              <span className="block text-xs uppercase tracking-widest font-label text-emerald-300">Por minuto</span>
              <span className="block text-3xl font-black tracking-tighter font-headline text-white">{formatBRL(perMinute)}</span>
              <span className="block text-xs font-body text-white/60 mt-1">sim, por minuto</span>
            </div>
            <div className="p-6 bg-surface-container">
              <span className="block text-xs uppercase tracking-widest font-label text-on-surface-variant">Em salarios minimos</span>
              <span className="block text-3xl font-black tracking-tighter font-headline text-on-surface">{eq.salariosMinimos.toLocaleString('pt-BR')}</span>
              <span className="block text-xs font-body text-on-surface-variant mt-1">de R$ {REFERENCES.salarioMinimo.toLocaleString('pt-BR')}</span>
            </div>
          </section>

          {/* CAMARA vs SENADO */}
          <section className="mt-12">
            <h2 className="font-headline font-black uppercase text-2xl tracking-tighter text-on-surface mb-6">CAMARA vs SENADO</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ComparisonCard title="CAMARA DOS DEPUTADOS" icon="how_to_reg" count={numDeputados} label={`deputados com dados em ${new Date().getFullYear()}`} total={custoDeputados} media={mediaDeputado} />
              <ComparisonCard title="SENADO FEDERAL" icon="account_balance" count={numSenadores} label="senadores (ultimo ano disponivel)" total={custoSenadores} media={mediaSenador} />
            </div>
          </section>

          {/* EQUIVALENCIAS */}
          <section className="mt-12">
            <h2 className="font-headline font-black uppercase text-2xl tracking-tighter text-on-surface mb-2">COM ESSE DINHEIRO DAVA PRA...</h2>
            <p className="font-body text-sm text-on-surface-variant mb-6">O que a cota parlamentar do Congresso compraria</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { icon: 'school', value: eq.escolasFNDE, label: 'escolas FNDE', desc: 'com 6 salas e quadra' },
                { icon: 'restaurant', value: eq.cestasBasicas, label: 'cestas basicas', desc: 'DIEESE' },
                { icon: 'local_hospital', value: eq.consultasSUS, label: 'consultas SUS', desc: 'tabela SUS' },
                { icon: 'home', value: eq.casasPopulares, label: 'casas MCMV', desc: 'Minha Casa Minha Vida' },
                { icon: 'ambulance', value: eq.ambulanciasUTI, label: 'ambulancias UTI', desc: 'equipadas' },
                { icon: 'payments', value: eq.salariosMinimos, label: 'salarios minimos', desc: `de R$ ${REFERENCES.salarioMinimo.toLocaleString('pt-BR')}` },
              ].filter(item => item.value > 0).map((item) => (
                <div key={item.label} className="bg-white border-2 border-outline-variant p-4 md:p-6">
                  <MaterialIcon icon={item.icon} size={28} className="text-error mb-2" />
                  <span className="block text-2xl md:text-3xl font-black tracking-tighter font-headline text-on-surface">{item.value.toLocaleString('pt-BR')}</span>
                  <span className="block font-label text-sm font-bold text-on-surface uppercase mt-1">{item.label}</span>
                  <span className="block font-body text-xs text-on-surface-variant mt-1">{item.desc}</span>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="mt-12 text-center">
            <p className="font-headline font-black uppercase text-xl text-on-surface mb-4">QUER SABER QUANTO SEU DEPUTADO GASTA?</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/politicos" className="inline-flex items-center gap-2 bg-primary text-on-primary font-label font-bold uppercase tracking-wider px-6 py-4">
                <MaterialIcon icon="leaderboard" size={18} /> VER RANKING DE POLITICOS
              </Link>
              <Link href="/politicos/partidos" className="inline-flex items-center gap-2 bg-secondary-container text-on-secondary-container font-label font-bold uppercase tracking-wider px-6 py-4">
                <MaterialIcon icon="groups" size={18} /> COMPARAR PARTIDOS
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function ComparisonCard({ title, icon, count, label, total, media }: {
  readonly title: string; readonly icon: string; readonly count: number
  readonly label: string; readonly total: number; readonly media: number
}) {
  return (
    <div className="bg-white border-2 border-outline-variant p-6 md:p-8">
      <div className="flex items-center gap-3 mb-4">
        <MaterialIcon icon={icon} size={28} className="text-primary" />
        <h3 className="font-headline font-black uppercase text-xl text-on-surface">{title}</h3>
      </div>
      <div className="space-y-3">
        <div>
          <span className="block text-xs uppercase tracking-widest font-label text-on-surface-variant">{count} {label}</span>
          <span className="block text-3xl font-black tracking-tighter font-headline text-error mt-1">{humanizeNumber(total)}</span>
        </div>
        {count > 0 && (
          <div className="pt-3 border-t border-outline-variant">
            <span className="block text-xs uppercase tracking-widest font-label text-on-surface-variant">Media por parlamentar (no ranking)</span>
            <span className="block text-xl font-black tracking-tighter font-headline text-on-surface mt-1">{humanizeNumber(media)}/ano</span>
          </div>
        )}
      </div>
    </div>
  )
}
