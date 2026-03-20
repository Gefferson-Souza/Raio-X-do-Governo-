import { getSpendingData } from '@/lib/services/spending-service'
import { getRecentContracts } from '@/lib/services/contracts-service'
import { humanizeNumber } from '@/lib/utils/format'
import { convertToEquivalences } from '@/lib/utils/equivalences'
import { PodiumCard } from '@/components/ui/podium-card'
import { TimelineRow } from '@/components/ui/timeline-row'
import { Badge } from '@/components/ui/badge'
import { MaterialIcon } from '@/components/icons/material-icon'
import Link from 'next/link'

export const revalidate = 300

const ORGAO_ICONS: Record<string, string> = {
  'DEFESA': 'shield',
  'SAUDE': 'local_hospital',
  'EDUCACAO': 'school',
  'PRESIDENCIA': 'account_balance',
  'FAZENDA': 'payments',
  'INFRAESTRUTURA': 'engineering',
  'TURISMO': 'travel_explore',
  'JUSTICA': 'gavel',
} as const

function pickOrgaoIcon(nomeOrgao: string): string {
  const upper = nomeOrgao.toUpperCase()
  for (const [keyword, icon] of Object.entries(ORGAO_ICONS)) {
    if (upper.includes(keyword)) {
      return icon
    }
  }
  return 'account_balance'
}

function pickOrgaoCategory(nomeOrgao: string): string {
  const upper = nomeOrgao.toUpperCase()
  if (upper.includes('DEFESA')) return 'SEGURANCA E DEFESA'
  if (upper.includes('SAUDE')) return 'SAUDE PUBLICA'
  if (upper.includes('EDUCACAO')) return 'EDUCACAO'
  if (upper.includes('PRESIDENCIA')) return 'GESTAO EXECUTIVA'
  if (upper.includes('FAZENDA')) return 'ECONOMIA E FINANCAS'
  if (upper.includes('INFRAESTRUTURA')) return 'OBRAS E INFRAESTRUTURA'
  if (upper.includes('TURISMO')) return 'TURISMO E CULTURA'
  if (upper.includes('JUSTICA')) return 'JUSTICA E SEGURANCA'
  return 'ADMINISTRACAO FEDERAL'
}

function computePercentual(valorPago: number, valorEmpenhado: number): number {
  if (valorEmpenhado <= 0) {
    return 0
  }
  return Math.round((valorPago / valorEmpenhado) * 100)
}

function formatDateBR(isoDate: string): string {
  try {
    const date = new Date(isoDate)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return isoDate
  }
}

function formatTimeBR(isoDate: string): string {
  try {
    const date = new Date(isoDate)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    })
  } catch {
    return isoDate
  }
}

const TIMELINE_STATUSES = ['pago', 'auditado', 'pendente', 'suspeito'] as const

export default async function RankingPage() {
  const [spendingSummary, contractsResult] = await Promise.all([
    getSpendingData(2025),
    getRecentContracts(30),
  ])

  const isSpendingError = spendingSummary.source === 'error'
  const isContractsError = contractsResult.source === 'error'
  const contratos = contractsResult.data

  const sortedOrgaos = [...spendingSummary.porOrgao]
    .sort((a, b) => b.pago - a.pago)

  const topThree = sortedOrgaos.slice(0, 3)
  const remainingOrgaos = sortedOrgaos.slice(3, 7)

  const recentContracts = [...contratos]
    .sort((a, b) => b.dataAssinatura.localeCompare(a.dataAssinatura))
    .slice(0, 4)

  return (
    <div className="flex flex-col gap-0">
      {/* HERO HEADER */}
      <section className="bg-gradient-to-br from-emerald-900 to-primary-dim px-6 lg:px-12 pt-10 pb-12">
        <span className="inline-flex items-center gap-2 bg-secondary-container text-on-secondary-container px-4 py-1 font-label text-xs font-bold uppercase tracking-widest mb-6">
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 14 }}
            aria-hidden="true"
          >
            schedule
          </span>
          {spendingSummary.source === 'cached' ? 'DADOS EM CACHE' : 'DADOS EM TEMPO REAL'}
        </span>

        <h2 className="font-headline font-black italic uppercase text-6xl md:text-8xl leading-none tracking-tighter text-white">
          RANKING<br />
          DA <span className="text-secondary-container">FARRA</span>
        </h2>

        <p className="mt-4 font-body italic text-lg text-white/70 max-w-2xl">
          Os orgaos que mais gastam o seu dinheiro. Transparencia nao e opcional.
          Cada real esta registrado. Cada ministerio no holofote.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-4 text-white/50 font-label text-xs uppercase tracking-widest">
          <span>FONTE: PORTAL DA TRANSPARENCIA</span>
          <span className="w-1 h-1 bg-white/30" />
          <span>DADOS DE 2025</span>
          <span className="w-1 h-1 bg-white/30" />
          <span>ATUALIZADO EM {formatDateBR(spendingSummary.atualizadoEm)}</span>
        </div>
      </section>

      {/* ERROR STATE */}
      {isSpendingError && (
        <section className="px-6 lg:px-12 py-10 bg-surface">
          <div className="bg-error-container border-2 border-error p-8">
            <div className="flex items-center gap-4">
              <MaterialIcon icon="error" className="text-error text-3xl" />
              <div>
                <h3 className="font-headline font-black uppercase text-2xl text-on-error-container">
                  DADOS INDISPONIVEIS
                </h3>
                <p className="font-body text-sm text-on-error-container/80 mt-2">
                  Nao foi possivel carregar os dados de gastos por orgao do Portal da Transparencia.
                  Verifique se a chave de API esta configurada e tente novamente.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* PODIUM GRID */}
      {!isSpendingError && topThree.length > 0 && (
        <section className="px-6 lg:px-12 py-10 bg-surface">
          <h3 className="font-headline font-black uppercase text-3xl tracking-tighter text-on-surface mb-8">
            OS CAMPEOES DO GASTO
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Position 2 - Left */}
            {topThree[1] && (
              <PodiumCard
                position={2}
                orgao={topThree[1].orgao}
                category={pickOrgaoCategory(topThree[1].orgao)}
                value={humanizeNumber(topThree[1].pago)}
                equivalence={`${convertToEquivalences(topThree[1].pago).salariosMinimos.toLocaleString('pt-BR')} salarios minimos`}
                icon={pickOrgaoIcon(topThree[1].orgao)}
              />
            )}

            {/* Position 1 - Center (highest spender) */}
            {topThree[0] && (
              <PodiumCard
                position={1}
                orgao={topThree[0].orgao}
                category={pickOrgaoCategory(topThree[0].orgao)}
                value={humanizeNumber(topThree[0].pago)}
                equivalence={`${convertToEquivalences(topThree[0].pago).salariosMinimos.toLocaleString('pt-BR')} salarios minimos`}
                icon={pickOrgaoIcon(topThree[0].orgao)}
              />
            )}

            {/* Position 3 - Right */}
            {topThree[2] && (
              <PodiumCard
                position={3}
                orgao={topThree[2].orgao}
                category={pickOrgaoCategory(topThree[2].orgao)}
                value={humanizeNumber(topThree[2].pago)}
                equivalence={`${convertToEquivalences(topThree[2].pago).salariosMinimos.toLocaleString('pt-BR')} salarios minimos`}
                icon={pickOrgaoIcon(topThree[2].orgao)}
              />
            )}
          </div>
        </section>
      )}

      {/* EMPTY STATE FOR PODIUM */}
      {!isSpendingError && topThree.length === 0 && (
        <section className="px-6 lg:px-12 py-10 bg-surface">
          <div className="bg-surface-container p-8 text-center">
            <MaterialIcon icon="info" className="text-on-surface-variant text-3xl mb-4" />
            <p className="font-body text-sm text-on-surface-variant">
              Nenhum dado de orgao disponivel para o periodo selecionado.
            </p>
          </div>
        </section>
      )}

      {/* MENCOES DESONROSAS */}
      {!isSpendingError && remainingOrgaos.length > 0 && (
        <section className="px-6 lg:px-12 py-10 bg-surface-container-low">
          <span className="inline-block bg-error text-on-error px-3 py-1 font-label text-xs font-bold uppercase tracking-widest mb-4">
            VERGONHA NACIONAL
          </span>
          <h3 className="font-headline font-black uppercase text-3xl tracking-tighter text-on-surface mb-8">
            MENCOES DESONROSAS
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* 2-col featured card */}
            {remainingOrgaos[0] && (
              <div className="md:col-span-2 bg-white border-l-8 border-error hard-shadow p-8 flex flex-col gap-4">
                <Badge variant="suspeito" />
                <span className="inline-block bg-error-container text-white px-3 py-1 font-label text-xs font-bold uppercase tracking-widest w-fit">
                  ALERTA DE DESVIO
                </span>
                <h4 className="font-headline font-black uppercase text-2xl tracking-tighter text-on-surface">
                  {remainingOrgaos[0].orgao}
                </h4>
                <p className="font-body text-sm text-on-surface-variant italic">
                  Gasto de {humanizeNumber(remainingOrgaos[0].pago)} com apenas{' '}
                  {computePercentual(remainingOrgaos[0].pago, remainingOrgaos[0].empenhado)}% de execucao
                  orcamentaria. Valores que precisam de explicacao.
                </p>
                <div className="mt-auto pt-4 border-t border-outline-variant flex items-center justify-between">
                  <span className="text-3xl font-black font-headline tracking-tighter text-error">
                    {humanizeNumber(remainingOrgaos[0].pago)}
                  </span>
                  <span className="text-xs font-bold uppercase font-label text-on-surface-variant">
                    EMPENHADO: {humanizeNumber(remainingOrgaos[0].empenhado)}
                  </span>
                </div>
              </div>
            )}

            {/* 2 small 1-col cards */}
            {remainingOrgaos.slice(1, 3).map((orgao, index) => (
              <div
                key={orgao.codigoOrgao}
                className="bg-white border-t-4 border-secondary hard-shadow p-6 flex flex-col gap-3"
              >
                <span className="text-xs font-bold uppercase font-label text-on-surface-variant tracking-widest">
                  #{index + 5}o LUGAR
                </span>
                <h4 className="font-headline font-black uppercase text-base tracking-tight text-on-surface">
                  {orgao.orgao}
                </h4>
                <span className="text-2xl font-black font-headline tracking-tighter text-on-surface">
                  {humanizeNumber(orgao.pago)}
                </span>
                <div className="mt-auto pt-3 border-t border-outline-variant">
                  <span className="text-xs font-bold uppercase font-label text-on-surface-variant">
                    EXECUCAO: {computePercentual(orgao.pago, orgao.empenhado)}%
                  </span>
                </div>
              </div>
            ))}

            {/* Full-width CTA card */}
            <div className="md:col-span-4 bg-emerald-900 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex flex-col gap-2">
                <h4 className="font-headline font-black uppercase text-2xl tracking-tighter text-white">
                  QUER MAIS DETALHES?
                </h4>
                <p className="font-body text-sm text-white/70 italic">
                  Acesse os dossies completos de cada ministerio. Contratos, pagamentos, fornecedores.
                </p>
              </div>
              <Link
                href="/dossies"
                className="inline-flex items-center gap-2 bg-secondary-container text-on-secondary-container px-8 py-4 font-label text-sm font-black uppercase tracking-wider hover:bg-yellow-300 transition-colors shrink-0"
              >
                ACESSAR DOSSIES COMPLETOS
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* LINHA DO TEMPO DA FARRA */}
      <section className="px-6 lg:px-12 py-10 bg-surface-container-low">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <span className="inline-block bg-emerald-900 text-white px-3 py-1 font-label text-xs font-bold uppercase tracking-widest mb-3">
              TEMPO REAL
            </span>
            <h3 className="font-headline font-black uppercase text-3xl tracking-tighter text-on-surface">
              LINHA DO TEMPO DA FARRA
            </h3>
            <p className="mt-2 font-body text-sm text-on-surface-variant italic">
              Ultimos contratos e pagamentos registrados no Portal da Transparencia.
            </p>
          </div>
        </div>

        {isContractsError && (
          <div className="bg-error-container border-2 border-error p-6">
            <div className="flex items-center gap-3">
              <MaterialIcon icon="error" className="text-error text-2xl" />
              <p className="font-body text-sm text-on-error-container">
                Nao foi possivel carregar os contratos recentes.
              </p>
            </div>
          </div>
        )}

        {!isContractsError && recentContracts.length === 0 && (
          <div className="bg-surface-container p-6 text-center">
            <p className="font-body text-sm text-on-surface-variant">
              Nenhum contrato recente encontrado.
            </p>
          </div>
        )}

        {!isContractsError && recentContracts.length > 0 && (
          <div className="flex flex-col gap-0 bg-white border-2 border-outline-variant">
            {recentContracts.map((contrato, index) => {
              const status = TIMELINE_STATUSES[index % TIMELINE_STATUSES.length]
              return (
                <TimelineRow
                  key={contrato.id}
                  time={formatTimeBR(contrato.dataAssinatura)}
                  orgao={contrato.unidadeGestora.orgaoVinculado.nome}
                  description={contrato.compra.objeto}
                  value={humanizeNumber(contrato.valorFinalCompra)}
                  status={status}
                  isSuspect={status === 'suspeito'}
                />
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
