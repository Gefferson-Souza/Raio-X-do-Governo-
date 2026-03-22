'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { SpendingSummary } from '@/lib/api/types'
import { humanizeNumber } from '@/lib/utils/format'
import { pickRandomComparisons } from '@/lib/utils/comparisons'
import { aggregateByOrgaoSuperior } from '@/lib/utils/aggregate-orgaos'
import { ExecutionBar } from './execution-bar'
import { LastUpdated } from './last-updated'
import { MaterialIcon } from '@/components/icons/material-icon'
import Link from 'next/link'

interface SpendingPollerProps {
  readonly initialData: SpendingSummary
}

export function SpendingPoller({ initialData }: SpendingPollerProps) {
  const currentYear = new Date().getFullYear()

  const { data, isError } = useQuery<SpendingSummary>({
    queryKey: ['spending'],
    queryFn: async () => {
      const res = await fetch('/api/spending')
      if (!res.ok) throw new Error('Failed to fetch spending data')
      return res.json()
    },
    initialData,
    initialDataUpdatedAt: new Date(initialData.atualizadoEm).getTime(),
    refetchInterval: 5 * 60 * 1000,
  })

  const executionPercent =
    data.totalEmpenhado > 0
      ? (data.totalPago / data.totalEmpenhado) * 100
      : 0

  const sidebarComparisons = useMemo(
    () => pickRandomComparisons(data.totalPago, 2),
    [data.totalPago],
  )

  const topOrgaos = useMemo(
    () => aggregateByOrgaoSuperior(data.porOrgao).slice(0, 6),
    [data.porOrgao],
  )

  const maxOrgaoValue = topOrgaos[0]?.pago ?? 1

  return (
    <>
      {/* HERO: Total + Execution Bar (shown ONCE) */}
      <div className="bg-emerald-900 p-6 md:p-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <span className="block text-xs uppercase tracking-widest font-label text-emerald-300 mb-1">
              TOTAL GASTO PELO GOVERNO EM {currentYear}
            </span>
            <span className="block text-4xl md:text-6xl font-black tracking-tighter font-headline text-yellow-400">
              {humanizeNumber(data.totalPago)}
            </span>
          </div>
          <ExecutionBar percent={executionPercent} />
        </div>
      </div>

      {isError && (
        <div className="mx-4 lg:mx-12 mt-4 bg-yellow-50 border-2 border-yellow-400 p-4 flex items-center gap-3">
          <MaterialIcon icon="warning" className="text-yellow-700 text-xl" />
          <p className="font-body text-sm text-yellow-800">
            Nao foi possivel atualizar os dados. Os valores exibidos podem estar desatualizados.
          </p>
        </div>
      )}

      {/* BREAKDOWN: Pra onde foi + Comparisons */}
      <section className="mx-4 lg:mx-12 my-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 border-4 border-emerald-950 bg-white hard-shadow">
          {/* LEFT: Ministry Breakdown */}
          <div className="lg:col-span-8 p-6 lg:p-8">
            <span className="inline-block bg-primary text-on-primary px-3 py-1 font-label text-xs font-bold uppercase tracking-widest mb-3">
              PRA ONDE FOI?
            </span>
            <h2 className="font-headline font-black uppercase text-2xl md:text-3xl tracking-tighter text-on-surface mb-2">
              GASTOU COM O QUE?
            </h2>
            <p className="font-body text-sm text-on-surface-variant mb-6">
              Os orgaos que mais receberam dinheiro publico em {currentYear}
            </p>

            {topOrgaos.length > 0 ? (
              <div className="flex flex-col gap-4">
                {topOrgaos.map((orgao) => (
                  <div key={orgao.orgaoSuperior} className="flex flex-col gap-1">
                    <div className="flex justify-between items-baseline gap-4">
                      <span className="font-label text-sm font-bold uppercase text-on-surface truncate">
                        {orgao.shortName}
                      </span>
                      <span className="font-headline font-black text-base text-on-surface whitespace-nowrap">
                        {humanizeNumber(orgao.pago)}
                      </span>
                    </div>
                    <div
                      role="progressbar"
                      aria-valuenow={Math.round(orgao.percentOfTotal)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${orgao.shortName}: ${Math.round(orgao.percentOfTotal)}% do total`}
                      className="h-2.5 bg-surface-container-highest rounded-full overflow-hidden"
                    >
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(orgao.pago / maxOrgaoValue) * 100}%` }}
                      />
                    </div>
                    <span className="font-body text-xs text-on-surface-variant">
                      {Math.round(orgao.percentOfTotal)}% do total
                      {orgao.shortName.toUpperCase().includes('FAZENDA') && orgao.percentOfTotal > 50 && (
                        <span className="text-on-surface-variant/60 italic text-red-500 font-bold">
                          {' '}— inclui juros e refinanciamento da divida publica
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="font-body text-sm text-on-surface-variant">
                Dados por orgao nao disponiveis no momento.
              </p>
            )}

            <Link
              href="/ranking"
              className="inline-flex items-center gap-2 mt-6 text-primary font-label font-bold text-sm uppercase tracking-wider hover:underline"
            >
              VER RANKING COMPLETO
              <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden="true">
                arrow_forward
              </span>
            </Link>
          </div>

          {/* RIGHT: Sidebar Comparisons */}
          <div className="lg:col-span-4 bg-white p-6 lg:p-8 flex flex-row lg:flex-col justify-center gap-4 lg:gap-8 border-t lg:border-t-0 lg:border-l border-outline-variant">
            {sidebarComparisons.map((comp, idx) => (
              <div key={comp.icon}>
                <div className={`flex-1 border-l-4 ${comp.borderColor} pl-4 lg:border-l-0 lg:pl-0`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 ${comp.bgColor} flex items-center justify-center shrink-0`}>
                      <span
                        className={`material-symbols-outlined ${comp.iconTextColor}`}
                        style={{ fontSize: 22 }}
                        aria-hidden="true"
                      >
                        {comp.icon}
                      </span>
                    </div>
                    <span className="text-xs font-bold uppercase font-label text-on-surface-variant tracking-widest">
                      {comp.label}
                    </span>
                  </div>
                  <span className="text-3xl font-black font-headline tracking-tighter text-on-surface">
                    {comp.value}
                  </span>
                  <p className="text-xs font-body text-on-surface-variant mt-1">
                    {comp.desc}
                  </p>
                </div>
                {idx < sidebarComparisons.length - 1 && (
                  <div className="hidden lg:block border-t border-outline-variant mt-4" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 flex justify-end">
          <LastUpdated updatedAt={data.atualizadoEm} />
        </div>
      </section>
    </>
  )
}
