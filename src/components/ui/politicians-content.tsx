'use client'

import { useQuery } from '@tanstack/react-query'
import type { PoliticiansData } from '@/lib/api/camara-types'
import { humanizeNumber, formatBRL, formatDateBR } from '@/lib/utils/format'
import { convertToEquivalences } from '@/lib/utils/equivalences'
import { REFERENCES } from '@/lib/utils/constants'
import { MaterialIcon } from '@/components/icons/material-icon'
import Link from 'next/link'

interface PoliticiansContentProps {
  readonly initialData: PoliticiansData
}

export function PoliticiansContent({ initialData }: PoliticiansContentProps) {
  const { data, isFetching, isError } = useQuery<PoliticiansData>({
    queryKey: ['politicians'],
    queryFn: async () => {
      const res = await fetch('/api/politicians')
      if (!res.ok) throw new Error('Failed to fetch politicians data')
      return res.json()
    },
    initialData,
    initialDataUpdatedAt: initialData.atualizadoEm
      ? new Date(initialData.atualizadoEm).getTime()
      : 0,
    refetchInterval: 60 * 60 * 1000,
    retry: 2,
    retryDelay: 5000,
  })

  const hasData = data.atualizadoEm !== ''

  const custoTotal = data.deputados.totalGasto + data.senadores.totalGasto
  const perCapita = custoTotal > 0 ? custoTotal / REFERENCES.populacaoBR : 0
  const perDay = custoTotal > 0 ? custoTotal / 365 : 0

  if (!hasData && isFetching) {
    return (
      <section className="mt-8">
        <div className="bg-surface-container border-2 border-outline-variant p-8 text-center">
          <div className="inline-block animate-spin mb-4">
            <MaterialIcon icon="progress_activity" size={48} className="text-primary" />
          </div>
          <h3 className="font-headline font-black uppercase text-xl">
            BUSCANDO DADOS DOS POLITICOS...
          </h3>
          <p className="font-body text-on-surface-variant mt-2 max-w-md mx-auto">
            Estamos consultando a Camara dos Deputados e o Senado Federal.
            Isso pode levar ate 1 minuto na primeira vez.
          </p>
        </div>
      </section>
    )
  }

  if (!hasData && isError) {
    return (
      <section className="mt-8">
        <div className="bg-surface-container border-2 border-error/30 p-8 text-center">
          <MaterialIcon icon="cloud_off" size={48} className="text-error/50" />
          <h3 className="font-headline font-black uppercase text-xl mt-4">
            APIS DO GOVERNO FORA DO AR
          </h3>
          <p className="font-body text-on-surface-variant mt-2 max-w-md mx-auto">
            Nao foi possivel consultar os dados da Camara e do Senado neste momento.
            Tente novamente em alguns minutos.
          </p>
        </div>
      </section>
    )
  }

  if (!hasData) {
    return null
  }

  return (
    <>
      {/* ═══ HERO CUSTO TOTAL ═══ */}
      {custoTotal > 0 && (
        <div className="mt-6">
          <p className="font-label text-xs text-white/50 uppercase tracking-widest mb-1">
            QUANTO DEPUTADOS E SENADORES GASTARAM DA COTA PARLAMENTAR EM {new Date().getFullYear()} ATE AGORA
          </p>
          <p className="text-5xl md:text-7xl font-black tracking-tighter font-headline text-yellow-400">
            {humanizeNumber(custoTotal)}
          </p>
          <p className="mt-2 text-lg font-body text-white/60">
            Isso da {formatBRL(perCapita)} por brasileiro, ou {humanizeNumber(perDay)} por dia
          </p>
        </div>
      )}
      <p className="mt-4 text-xs font-label text-white/40 uppercase tracking-widest">
        Atualizado em {formatDateBR(data.atualizadoEm)}
        {data.status === 'partial' && ' (dados parciais)'}
      </p>

      {/* Closing hero section — rest rendered outside the dark bg in parent */}
    </>
  )
}

export function PoliticiansBody({ initialData }: PoliticiansContentProps) {
  const { data } = useQuery<PoliticiansData>({
    queryKey: ['politicians'],
    queryFn: async () => {
      const res = await fetch('/api/politicians')
      if (!res.ok) throw new Error('Failed to fetch politicians data')
      return res.json()
    },
    initialData,
    initialDataUpdatedAt: initialData.atualizadoEm
      ? new Date(initialData.atualizadoEm).getTime()
      : 0,
    refetchInterval: 60 * 60 * 1000,
  })

  const hasData = data.atualizadoEm !== ''
  if (!hasData) return null

  const custoTotal = data.deputados.totalGasto + data.senadores.totalGasto

  return (
    <>
      {/* ═══ STATS BAR ═══ */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-0 -mx-4 md:-mx-8 lg:mx-0">
        <div className="p-4 md:p-6 bg-yellow-400">
          <span className="block text-xs uppercase tracking-widest font-label text-emerald-950">
            Deputados — acumulado {new Date().getFullYear()}
          </span>
          <span className="block text-2xl md:text-3xl font-black tracking-tighter font-headline text-emerald-950">
            {humanizeNumber(data.deputados.totalGasto)}
          </span>
        </div>
        <div className="p-4 md:p-6 bg-surface-container-highest">
          <span className="block text-xs uppercase tracking-widest font-label text-on-surface-variant">
            Senadores — ultimo ano disponivel
          </span>
          <span className="block text-2xl md:text-3xl font-black tracking-tighter font-headline text-error">
            {humanizeNumber(data.senadores.totalGasto)}
          </span>
        </div>
        {data.viagens.totalGasto > 0 && (
          <div className="p-4 md:p-6 bg-emerald-900">
            <span className="block text-xs uppercase tracking-widest font-label text-emerald-300">
              Viagens oficiais (30 dias)
            </span>
            <span className="block text-2xl md:text-3xl font-black tracking-tighter font-headline text-white">
              {humanizeNumber(data.viagens.totalGasto)}
            </span>
          </div>
        )}
        {data.cartoes.totalGasto > 0 && (
          <div className="p-4 md:p-6 bg-surface-container">
            <span className="block text-xs uppercase tracking-widest font-label text-on-surface-variant">
              Cartao corporativo (3 meses)
            </span>
            <span className="block text-2xl md:text-3xl font-black tracking-tighter font-headline text-error">
              {humanizeNumber(data.cartoes.totalGasto)}
            </span>
          </div>
        )}
      </section>

      {/* ═══ NAV LINKS ═══ */}
      <section className="flex flex-wrap gap-3 mt-8">
        <Link href="/politicos/congresso" className="inline-flex items-center gap-2 bg-primary text-on-primary font-label font-bold uppercase tracking-wider px-5 py-3 text-sm hover:opacity-90 transition-opacity">
          <MaterialIcon icon="account_balance" size={18} />
          CUSTO DO CONGRESSO
        </Link>
        <Link href="/politicos/partidos" className="inline-flex items-center gap-2 bg-secondary-container text-on-secondary-container font-label font-bold uppercase tracking-wider px-5 py-3 text-sm hover:opacity-90 transition-opacity">
          <MaterialIcon icon="groups" size={18} />
          POR PARTIDO
        </Link>
      </section>

      {/* ═══ DEPUTADOS ═══ */}
      {data.deputados.ranking.length > 0 && (
        <section className="mt-12">
          <SectionHeader icon="how_to_reg" bgColor="bg-primary" iconColor="text-on-primary" title="DEPUTADOS QUE MAIS GASTAM" subtitle={`Quanto cada deputado gastou da cota parlamentar (CEAP) em ${new Date().getFullYear()} ate agora • Fonte: Camara dos Deputados`} />
          <div className="flex flex-col gap-0 border-2 border-outline-variant bg-white">
            {data.deputados.ranking.map((dep, i) => {
              const eq = convertToEquivalences(dep.totalGasto)
              return (
                <Link key={dep.id} href={`/politicos/deputados/${dep.id}`} className="border-b border-outline-variant last:border-b-0 p-4 md:p-6 flex items-center gap-4 hover:bg-surface-container-low transition-colors">
                  <RankBadge rank={i + 1} />
                  <Avatar src={dep.foto} alt={dep.nome} />
                  <div className="flex-1 min-w-0">
                    <span className="font-headline font-black text-base text-on-surface block truncate">{dep.nome}</span>
                    <span className="font-label text-xs text-on-surface-variant uppercase">{dep.partido}-{dep.uf}</span>
                    {dep.topDespesas.length > 0 && (
                      <span className="block font-body text-xs text-on-surface-variant/60 mt-1 truncate">Maior gasto: {dep.topDespesas[0].tipo}</span>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="block font-headline font-black text-lg text-error">{humanizeNumber(dep.totalGasto)}</span>
                    <span className="block font-label text-xs text-on-surface-variant uppercase">{eq.cestasBasicas.toLocaleString('pt-BR')} cestas basicas</span>
                  </div>
                  <MaterialIcon icon="chevron_right" size={20} className="text-on-surface-variant/30 hidden md:block" />
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* ═══ SENADORES ═══ */}
      {data.senadores.ranking.length > 0 && (
        <section className="mt-12">
          <SectionHeader icon="account_balance" bgColor="bg-secondary-container" iconColor="text-on-secondary-container" title="SENADORES QUE MAIS GASTAM" subtitle="Quanto cada senador gastou da cota parlamentar (CEAPS) no ultimo ano com dados disponiveis • Fonte: Senado Federal" />
          <div className="flex flex-col gap-0 border-2 border-outline-variant bg-white">
            {data.senadores.ranking.map((sen, i) => {
              const eq = convertToEquivalences(sen.totalGasto)
              return (
                <div key={sen.id} className="border-b border-outline-variant last:border-b-0 p-4 md:p-6 flex items-center gap-4">
                  <RankBadge rank={i + 1} />
                  <Avatar src={sen.foto} alt={sen.nome} />
                  <div className="flex-1 min-w-0">
                    <span className="font-headline font-black text-base text-on-surface block truncate">{sen.nome}</span>
                    <span className="font-label text-xs text-on-surface-variant uppercase">{sen.partido}{sen.uf ? `-${sen.uf}` : ''}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="block font-headline font-black text-lg text-error">{humanizeNumber(sen.totalGasto)}</span>
                    <span className="block font-label text-xs text-on-surface-variant uppercase">{eq.salariosMinimos.toLocaleString('pt-BR')} salarios minimos</span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ═══ CARTAO CORPORATIVO ═══ */}
      {data.cartoes.topPortadores.length > 0 && (
        <section className="mt-12">
          <SectionHeader icon="credit_card" bgColor="bg-error" iconColor="text-on-error" title="CARTAO CORPORATIVO DO GOVERNO" subtitle="Quem mais gastou com o cartao corporativo nos ultimos 3 meses • Fonte: Portal da Transparencia" />
          <div className="flex flex-col gap-0 border-2 border-outline-variant bg-white">
            {data.cartoes.topPortadores.map((portador, i) => (
              <div key={`${portador.portador}-${i}`} className="border-b border-outline-variant last:border-b-0 p-4 md:p-6 flex items-center gap-4">
                <RankBadge rank={i + 1} />
                <div className="flex-1 min-w-0">
                  <span className="font-headline font-black text-base text-on-surface block truncate">{portador.portador}</span>
                  <span className="font-label text-xs text-on-surface-variant block truncate">{portador.orgao}</span>
                  <span className="font-body text-xs text-on-surface-variant/60">{portador.transacoes} transacao{portador.transacoes !== 1 ? 'es' : ''}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="block font-headline font-black text-lg text-error">{humanizeNumber(portador.totalGasto)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══ TOP SALARIOS ═══ */}
      {data.remuneracoes.topServidores.length > 0 && (
        <section className="mt-12">
          <SectionHeader icon="payments" bgColor="bg-tertiary-container" iconColor="text-on-tertiary-container" title="MAIORES SALARIOS DO GOVERNO" subtitle="Servidores federais com maior remuneracao bruta no ultimo mes disponivel • Fonte: Portal da Transparencia" />
          <div className="flex flex-col gap-0 border-2 border-outline-variant bg-white">
            {data.remuneracoes.topServidores.map((servidor, i) => {
              const salarios = Math.floor(servidor.remuneracaoBruta / REFERENCES.salarioMinimo)
              return (
                <div key={`${servidor.nome}-${i}`} className="border-b border-outline-variant last:border-b-0 p-4 md:p-6 flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  <span className="font-headline font-black text-2xl text-on-surface-variant/30 w-8 text-right shrink-0 hidden md:block">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <span className="font-headline font-black text-base text-on-surface block truncate">{servidor.nome}</span>
                    <span className="font-label text-xs text-on-surface-variant block truncate">{servidor.cargo}</span>
                    <span className="font-body text-xs text-on-surface-variant/60 block truncate">{servidor.orgao}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="block font-headline font-black text-lg text-error">{formatBRL(servidor.remuneracaoBruta)}</span>
                    <span className="block font-label text-xs text-on-surface-variant">Liquido: {formatBRL(servidor.remuneracaoLiquida)}</span>
                    <span className="block font-label text-xs text-on-surface-variant/60">= {salarios} salarios minimos</span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ═══ EMENDAS ═══ */}
      {data.emendas.topAutores.length > 0 && (
        <section className="mt-12">
          <SectionHeader icon="request_quote" bgColor="bg-tertiary-container" iconColor="text-on-tertiary-container" title="EMENDAS PARLAMENTARES" subtitle={`Quem mais direcionou dinheiro publico via emendas em ${new Date().getFullYear()} • Fonte: Portal da Transparencia`} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 mb-4 -mx-4 md:mx-0">
            <div className="p-4 bg-emerald-900">
              <span className="block text-xs uppercase tracking-widest font-label text-emerald-300">Total pago</span>
              <span className="block text-2xl font-black tracking-tighter font-headline text-white">{humanizeNumber(data.emendas.totalPago)}</span>
            </div>
            <div className="p-4 bg-surface-container-highest">
              <span className="block text-xs uppercase tracking-widest font-label text-on-surface-variant">Total empenhado</span>
              <span className="block text-2xl font-black tracking-tighter font-headline text-on-surface">{humanizeNumber(data.emendas.totalEmpenhado)}</span>
            </div>
          </div>
          <div className="flex flex-col gap-0 border-2 border-outline-variant bg-white">
            {data.emendas.topAutores.map((emenda, i) => (
              <div key={emenda.autor} className="border-b border-outline-variant last:border-b-0 p-4 md:p-6 flex items-center gap-4">
                <RankBadge rank={i + 1} />
                <div className="flex-1 min-w-0">
                  <span className="font-headline font-black text-base text-on-surface block truncate">{emenda.autor}</span>
                  <span className="font-label text-xs text-on-surface-variant">{emenda.quantidade} emenda{emenda.quantidade !== 1 ? 's' : ''}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="block font-headline font-black text-lg text-error">{humanizeNumber(emenda.totalPago)}</span>
                  <span className="block font-label text-xs text-on-surface-variant uppercase">pago</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══ VIAGENS ═══ */}
      {data.viagens.recentes.length > 0 && (
        <section className="mt-12">
          <SectionHeader icon="flight" bgColor="bg-error" iconColor="text-on-error" title="VIAGENS OFICIAIS MAIS CARAS" subtitle="Viagens a servico pagas com dinheiro publico nos ultimos 30 dias • Fonte: Portal da Transparencia" />
          <div className="flex flex-col gap-0 border-2 border-outline-variant bg-white">
            {data.viagens.recentes.slice(0, 10).map((viagem, i) => (
              <div key={`${viagem.viajante}-${viagem.dataInicio}-${i}`} className="border-b border-outline-variant last:border-b-0 p-4 md:p-6 flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                <div className="flex-1 min-w-0">
                  <span className="font-headline font-black text-base text-on-surface block truncate">{viagem.viajante}</span>
                  <span className="font-label text-xs text-on-surface-variant block">{viagem.cargo} — {viagem.orgao}</span>
                  <span className="font-body text-xs text-on-surface-variant/60 block mt-1">{viagem.destino} • {viagem.motivo}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="block font-headline font-black text-lg text-error">{humanizeNumber(viagem.valorTotal)}</span>
                  <span className="block font-label text-xs text-on-surface-variant">passagens + diarias</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══ PARTIDOS (preview) ═══ */}
      {data.senadores.porPartido.length > 0 && (
        <section className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-headline font-black uppercase text-xl tracking-tighter text-on-surface">GASTOS POR PARTIDO (SENADO)</h2>
            <Link href="/politicos/partidos" className="font-label text-xs text-primary uppercase tracking-wider hover:underline">VER COMPLETO →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[...data.senadores.porPartido].sort((a, b) => b.totalGasto - a.totalGasto).slice(0, 8).map((p) => (
              <div key={p.partido} className="bg-white border-2 border-outline-variant p-4">
                <span className="block font-headline font-black text-lg text-on-surface">{p.partido}</span>
                <span className="block font-headline font-black text-base text-error mt-1">{humanizeNumber(p.totalGasto)}</span>
                <span className="block font-label text-xs text-on-surface-variant mt-1">{p.quantidadeParlamentares} senador{p.quantidadeParlamentares !== 1 ? 'es' : ''}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══ FONTES ═══ */}
      <section className="mt-12 text-center">
        <p className="text-xs font-label text-on-surface-variant uppercase tracking-widest">Fontes: Camara dos Deputados + Senado Federal + Portal da Transparencia</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-4">
          <a href="https://dadosabertos.camara.leg.br" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-primary text-on-primary font-label font-bold uppercase tracking-wider px-6 py-3">
            <MaterialIcon icon="open_in_new" size={18} /> CAMARA
          </a>
          <a href="https://www12.senado.leg.br/transparencia" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-secondary-container text-on-secondary-container font-label font-bold uppercase tracking-wider px-6 py-3">
            <MaterialIcon icon="open_in_new" size={18} /> SENADO
          </a>
          <a href="https://portaldatransparencia.gov.br" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-tertiary-container text-on-tertiary-container font-label font-bold uppercase tracking-wider px-6 py-3">
            <MaterialIcon icon="open_in_new" size={18} /> PORTAL DA TRANSPARENCIA
          </a>
        </div>
      </section>
    </>
  )
}

// ─── Shared sub-components ──────────────────────────────────────

function SectionHeader({ icon, bgColor, iconColor, title, subtitle }: {
  readonly icon: string; readonly bgColor: string; readonly iconColor: string
  readonly title: string; readonly subtitle: string
}) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className={`w-10 h-10 ${bgColor} flex items-center justify-center`}>
        <MaterialIcon icon={icon} size={22} className={iconColor} />
      </div>
      <div>
        <h2 className="font-headline font-black uppercase text-2xl tracking-tighter text-on-surface">{title}</h2>
        <p className="font-body text-sm text-on-surface-variant">{subtitle}</p>
      </div>
    </div>
  )
}

function RankBadge({ rank }: { readonly rank: number }) {
  return (
    <span className="font-headline font-black text-2xl text-on-surface-variant/30 w-8 text-right shrink-0">
      {rank}
    </span>
  )
}

function Avatar({ src, alt }: { readonly src: string; readonly alt: string }) {
  return src ? (
    <img src={src} alt={alt} className="w-12 h-12 rounded-full object-cover shrink-0 bg-surface-container" loading="lazy" />
  ) : (
    <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center shrink-0">
      <MaterialIcon icon="person" size={24} className="text-on-surface-variant/40" />
    </div>
  )
}
