"use client"

import { useState, useCallback } from 'react'
import { MaterialIcon } from '@/components/icons/material-icon'
import { formatBRL } from '@/lib/utils/format'
import { convertToEquivalences, type Equivalences } from '@/lib/utils/equivalences'
import { shareOnWhatsApp, shareOnLinkedIn, downloadOgImage } from '@/lib/utils/share'

interface RealDataItem {
  readonly label: string
  readonly value: number
  readonly formatted: string
  readonly orgao?: string
}

interface ImpactGeneratorProps {
  readonly realOrgaos: readonly RealDataItem[]
  readonly realContracts: readonly RealDataItem[]
}

type ComparisonKey = 'saude' | 'educacao' | 'moradia'

interface ComparisonOption {
  readonly key: ComparisonKey
  readonly label: string
  readonly icon: string
  readonly getLabel: (eq: Equivalences) => string
}

const COMPARISON_OPTIONS: readonly ComparisonOption[] = [
  {
    key: 'saude',
    label: 'Saude Publica',
    icon: 'local_hospital',
    getLabel: (eq) =>
      `${eq.consultasSUS.toLocaleString('pt-BR')} consultas no SUS`,
  },
  {
    key: 'educacao',
    label: 'Educacao',
    icon: 'school',
    getLabel: (eq) =>
      `${eq.kitsEscolares.toLocaleString('pt-BR')} kits escolares`,
  },
  {
    key: 'moradia',
    label: 'Moradia Popular',
    icon: 'home',
    getLabel: (eq) =>
      `${eq.casasPopulares.toLocaleString('pt-BR')} casas populares`,
  },
] as const

const MAX_VALUE = 10_000_000_000_000

function parseMoneyInput(raw: string): number {
  const cleaned = raw.replace(/[^\d,]/g, '').replace(',', '.')
  const parsed = parseFloat(cleaned)
  if (Number.isNaN(parsed) || parsed < 0) return 0
  return Math.min(parsed, MAX_VALUE)
}

export function ImpactGenerator({ realOrgaos, realContracts }: ImpactGeneratorProps) {
  const [itemLabel, setItemLabel] = useState('Gasto Publico')
  const [rawValue, setRawValue] = useState('1.500.000,00')
  const [comparison, setComparison] = useState<ComparisonKey>('saude')
  const [isDownloading, setIsDownloading] = useState(false)

  const numericValue = parseMoneyInput(rawValue)
  const equivalences = convertToEquivalences(numericValue)
  const activeComparison = COMPARISON_OPTIONS.find((c) => c.key === comparison)
  const equivalenceText = activeComparison?.getLabel(equivalences) ?? ''
  const valorFormatted = formatBRL(numericValue)

  const selectRealData = useCallback((item: RealDataItem) => {
    setItemLabel(item.label)
    setRawValue(item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }))
  }, [])

  const handleDownload = useCallback(async () => {
    setIsDownloading(true)
    try {
      const params = new URLSearchParams({
        valor: valorFormatted,
        item: itemLabel,
        equivalencia: equivalenceText,
      })
      await downloadOgImage(`/api/og?${params.toString()}`)
    } catch {
      // Silently fail — user can screenshot instead
    } finally {
      setIsDownloading(false)
    }
  }, [valorFormatted, itemLabel, equivalenceText])

  const handleWhatsApp = useCallback(() => {
    const text = `Voce sabia? O governo gastou ${valorFormatted} com ${itemLabel}. Isso daria pra pagar ${equivalenceText}. Dados do Portal da Transparencia.`
    const origin = window.location.origin
    shareOnWhatsApp(text, `${origin}/gerador`)
  }, [valorFormatted, itemLabel, equivalenceText])

  const handleLinkedIn = useCallback(() => {
    const origin = window.location.origin
    shareOnLinkedIn(`${origin}/gerador`)
  }, [])

  const hasRealData = realOrgaos.length > 0 || realContracts.length > 0

  return (
    <div className="flex flex-col gap-8">
      {/* REAL DATA CARDS */}
      {hasRealData && (
        <section>
          <h2 className="font-headline font-black uppercase text-xl tracking-tighter text-on-surface mb-2">
            DADOS REAIS DO GOVERNO
          </h2>
          <p className="font-body text-sm text-on-surface-variant mb-4">
            Clique em um item para gerar o card automaticamente com dados oficiais.
          </p>

          {realOrgaos.length > 0 && (
            <div className="mb-4">
              <span className="block text-xs uppercase tracking-widest font-label text-on-surface-variant mb-2">
                Maiores orgaos por gasto
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {realOrgaos.map((orgao) => (
                  <button
                    key={`${orgao.label}-${orgao.value}`}
                    type="button"
                    onClick={() => selectRealData(orgao)}
                    className="bg-white border-2 border-outline-variant p-4 text-left hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <span className="block font-label text-xs uppercase tracking-wider text-on-surface-variant">
                      {orgao.label}
                    </span>
                    <span className="block font-headline font-black text-lg text-on-surface mt-1">
                      {orgao.formatted}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {realContracts.length > 0 && (
            <div>
              <span className="block text-xs uppercase tracking-widest font-label text-on-surface-variant mb-2">
                Maiores contratos recentes
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {realContracts.map((contract) => (
                  <button
                    key={`${contract.label}-${contract.value}`}
                    type="button"
                    onClick={() => selectRealData(contract)}
                    className="bg-white border-2 border-outline-variant p-4 text-left hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <span className="block font-label text-xs uppercase tracking-wider text-on-surface-variant line-clamp-1">
                      {contract.label}
                    </span>
                    <span className="block font-headline font-black text-lg text-error mt-1">
                      {contract.formatted}
                    </span>
                    {contract.orgao && (
                      <span className="block font-body text-xs text-on-surface-variant mt-1 line-clamp-1">
                        {contract.orgao}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* MANUAL FORM + PREVIEW */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* FORM */}
        <div className="xl:col-span-5 bg-surface-container-low p-8 hard-shadow order-last xl:order-first">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1.5 h-10 bg-primary" />
            <h2 className="text-2xl font-black uppercase font-headline">
              Monte seu card
            </h2>
          </div>

          <div className="flex flex-col gap-6">
            <div>
              <label
                htmlFor="item-label"
                className="block text-xs uppercase tracking-widest font-label text-on-surface-variant mb-2"
              >
                Nome do gasto
              </label>
              <input
                id="item-label"
                type="text"
                value={itemLabel}
                onChange={(e) => setItemLabel(e.target.value)}
                className="w-full bg-white border-2 border-outline-variant p-3 font-label text-sm focus:border-primary focus:outline-none"
                placeholder="Ex: Reforma de gabinete"
              />
            </div>

            <div>
              <label
                htmlFor="spending-value"
                className="block text-xs uppercase tracking-widest font-label text-on-surface-variant mb-2"
              >
                Valor (R$)
              </label>
              <input
                id="spending-value"
                type="text"
                value={rawValue}
                onChange={(e) => setRawValue(e.target.value)}
                className="w-full bg-white border-2 border-outline-variant p-3 font-label text-sm focus:border-primary focus:outline-none"
                placeholder="1.500.000,00"
              />
            </div>

            <div>
              <span className="block text-xs uppercase tracking-widest font-label text-on-surface-variant mb-3">
                Comparar com
              </span>
              <div className="flex flex-col gap-2">
                {COMPARISON_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setComparison(option.key)}
                    className={`flex items-center gap-3 p-3 border-l-4 text-left transition-colors ${
                      comparison === option.key
                        ? 'border-secondary bg-secondary-container/30'
                        : 'border-outline-variant bg-white hover:bg-surface-container'
                    }`}
                  >
                    <MaterialIcon icon={option.icon} size={20} />
                    <span className="font-label text-sm font-medium uppercase">
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* PREVIEW + ACTIONS */}
        <div className="xl:col-span-7 flex flex-col items-center gap-8 order-first xl:order-last">
          {/* Card Preview */}
          <div className="relative max-w-[600px] w-full aspect-[1200/630] bg-white hard-shadow flex flex-col overflow-hidden">
            <div className="bg-emerald-800 px-6 py-4 flex items-center justify-between">
              <span className="font-headline font-black text-white text-lg uppercase tracking-wider">
                RAIO-X DO GOVERNO
              </span>
              <span className="font-label text-xs text-emerald-300 uppercase tracking-widest">
                PORTAL DA TRANSPARENCIA
              </span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center px-8 py-6 text-center">
              <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant mb-2">
                {itemLabel}
              </span>
              <span className="text-4xl md:text-5xl font-black font-headline text-error tracking-tighter">
                {valorFormatted}
              </span>
              <div className="w-full border-t-8 border-yellow-400 mt-4 pt-4">
                <span className="block font-label text-xs uppercase tracking-widest text-on-surface-variant mb-1">
                  O QUE ISSO REPRESENTA
                </span>
                <span className="block text-xl md:text-2xl font-black font-headline uppercase text-primary">
                  {equivalenceText}
                </span>
              </div>
            </div>

            <div className="bg-emerald-900 px-6 py-3 flex items-center justify-between">
              <span className="font-label text-xs text-emerald-400 uppercase tracking-widest">
                raioxdogoverno.com.br
              </span>
              <span className="font-headline font-black text-yellow-400 text-xs uppercase">
                DADOS DO PORTAL DA TRANSPARENCIA
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-[600px]">
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex-1 w-full inline-flex items-center justify-center gap-2 bg-primary text-on-primary font-label font-bold uppercase tracking-wider py-4 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <MaterialIcon icon={isDownloading ? 'hourglass_empty' : 'download'} size={20} />
              {isDownloading ? 'GERANDO...' : 'BAIXAR IMAGEM'}
            </button>
            <button
              type="button"
              onClick={handleWhatsApp}
              className="flex-1 w-full inline-flex items-center justify-center gap-2 text-white font-label font-bold uppercase tracking-wider py-4 hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#25D366' }}
            >
              <MaterialIcon icon="share" size={20} />
              WHATSAPP
            </button>
            <button
              type="button"
              onClick={handleLinkedIn}
              className="flex-1 w-full inline-flex items-center justify-center gap-2 text-white font-label font-bold uppercase tracking-wider py-4 hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#0A66C2' }}
            >
              <MaterialIcon icon="work" size={20} />
              LINKEDIN
            </button>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div className="mt-12 bg-surface-container-low p-8 hard-shadow">
        <div className="flex items-center gap-3 mb-4">
          <MaterialIcon icon="info" size={24} className="text-primary" />
          <h3 className="text-xl font-black uppercase font-headline">
            Como funciona
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col gap-2">
            <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant">
              1. ESCOLHA UM GASTO
            </span>
            <p className="font-body text-sm text-on-surface-variant">
              Clique em um dado real do governo acima, ou digite um valor manualmente.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant">
              2. COMPARE
            </span>
            <p className="font-body text-sm text-on-surface-variant">
              Escolha com que area comparar: saude, educacao ou moradia popular.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant">
              3. COMPARTILHE
            </span>
            <p className="font-body text-sm text-on-surface-variant">
              Baixe a imagem ou mande direto pro WhatsApp dos seus amigos.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
