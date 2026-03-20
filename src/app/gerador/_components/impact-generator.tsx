"use client"

import { useState, useCallback } from 'react'
import { MaterialIcon } from '@/components/icons/material-icon'
import { formatBRL } from '@/lib/utils/format'
import { convertToEquivalences, type Equivalences } from '@/lib/utils/equivalences'

const SPENDING_OPTIONS = [
  { value: 'moveis', label: 'Móveis de Luxo' },
  { value: 'viagem', label: 'Viagem Presidencial' },
  { value: 'cartao', label: 'Cartão Corporativo' },
  { value: 'propaganda', label: 'Propaganda Oficial' },
  { value: 'reforma', label: 'Reforma de Gabinete' },
] as const

type SpendingType = typeof SPENDING_OPTIONS[number]['value']

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
    label: 'Saúde Pública',
    icon: 'local_hospital',
    getLabel: (eq) =>
      `${eq.consultasSUS.toLocaleString('pt-BR')} consultas no SUS`,
  },
  {
    key: 'educacao',
    label: 'Educação',
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

const VIRAL_CARDS = [
  {
    item: 'Cartão Corporativo',
    valor: 'R$ 2.800.000',
    equivalencia: '11.200 consultas SUS',
    shares: '14.2K',
  },
  {
    item: 'Reforma de Gabinete',
    valor: 'R$ 850.000',
    equivalencia: '24 casas populares',
    shares: '8.7K',
  },
  {
    item: 'Viagem Presidencial',
    valor: 'R$ 4.200.000',
    equivalencia: '840.000 merendas',
    shares: '22.1K',
  },
] as const

function parseMoneyInput(raw: string): number {
  const cleaned = raw.replace(/[^\d,]/g, '').replace(',', '.')
  const parsed = parseFloat(cleaned)
  return Number.isNaN(parsed) ? 0 : parsed
}

export function ImpactGenerator() {
  const [item, setItem] = useState<SpendingType>('moveis')
  const [rawValue, setRawValue] = useState('1.500.000,00')
  const [comparison, setComparison] = useState<ComparisonKey>('saude')

  const [previewItem, setPreviewItem] = useState('Móveis de Luxo')
  const [previewValue, setPreviewValue] = useState(1_500_000)
  const [previewComparison, setPreviewComparison] = useState<ComparisonKey>('saude')

  const equivalences = convertToEquivalences(previewValue)
  const activeComparison = COMPARISON_OPTIONS.find((c) => c.key === previewComparison)
  const equivalenceText = activeComparison?.getLabel(equivalences) ?? ''

  const handleUpdate = useCallback(() => {
    const selectedOption = SPENDING_OPTIONS.find((o) => o.value === item)
    setPreviewItem(selectedOption?.label ?? 'Gasto Público')
    setPreviewValue(parseMoneyInput(rawValue))
    setPreviewComparison(comparison)
  }, [item, rawValue, comparison])

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
      <div className="xl:col-span-5 bg-surface-container-low p-8 hard-shadow">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1.5 h-10 bg-primary" />
          <h2 className="text-2xl font-black uppercase font-headline">
            Configure o Flagrante
          </h2>
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <label
              htmlFor="spending-item"
              className="block text-xs uppercase tracking-widest font-label text-on-surface-variant mb-2"
            >
              Item do Gasto
            </label>
            <select
              id="spending-item"
              value={item}
              onChange={(e) => setItem(e.target.value as SpendingType)}
              className="w-full bg-white border-2 border-outline-variant p-3 font-label text-sm uppercase focus:border-primary focus:outline-none"
            >
              {SPENDING_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="spending-value"
              className="block text-xs uppercase tracking-widest font-label text-on-surface-variant mb-2"
            >
              Valor Total (R$)
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

          <button
            type="button"
            onClick={handleUpdate}
            className="w-full bg-secondary-container text-on-secondary-container font-label font-bold uppercase tracking-wider py-4 hover:opacity-90 transition-opacity mt-2"
          >
            ATUALIZAR PREVIEW
          </button>
        </div>
      </div>

      <div className="xl:col-span-7 flex flex-col items-center gap-8">
        <div className="relative max-w-[600px] w-full aspect-square bg-white hard-shadow flex flex-col overflow-hidden">
          <div className="bg-emerald-800 px-6 py-4 flex items-center justify-between">
            <span className="font-headline font-black text-white text-lg uppercase tracking-wider">
              RAIO-X DO GOVERNO
            </span>
            <span className="font-label text-xs text-emerald-300 uppercase tracking-widest">
              ORIGEM: PORTAL DA TRANSPARÊNCIA
            </span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center px-8 py-6 text-center">
            <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant mb-2">
              {previewItem}
            </span>
            <span className="text-5xl md:text-6xl font-black font-headline text-error tracking-tighter">
              {formatBRL(previewValue)}
            </span>
            <div className="w-full border-t-8 border-yellow-400 mt-6 pt-6">
              <span className="block font-label text-xs uppercase tracking-widest text-on-surface-variant mb-1">
                O QUE ISSO REPRESENTA
              </span>
              <span className="block text-2xl md:text-3xl font-black font-headline uppercase text-primary">
                {equivalenceText}
              </span>
            </div>
          </div>

          <div className="bg-emerald-900 px-6 py-3 flex items-center justify-between">
            <span className="font-label text-xs text-emerald-400 uppercase tracking-widest">
              raioxdogoverno.com.br
            </span>
            <span className="font-headline font-black text-yellow-400 text-xs uppercase">
              A VERDADE QUE NÃO TE CONTAM
            </span>
          </div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 pointer-events-none select-none">
            <span className="block border-8 border-error text-error font-headline font-black text-4xl uppercase px-6 py-2 opacity-30">
              AUDITADO
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-[600px]">
          <button
            type="button"
            className="flex-1 w-full inline-flex items-center justify-center gap-2 bg-primary text-on-primary font-label font-bold uppercase tracking-wider py-4 hover:opacity-90 transition-opacity"
          >
            <MaterialIcon icon="download" size={20} />
            BAIXAR IMAGEM
          </button>
          <button
            type="button"
            className="flex-1 w-full inline-flex items-center justify-center gap-2 text-white font-label font-bold uppercase tracking-wider py-4 hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#25D366' }}
          >
            <MaterialIcon icon="share" size={20} />
            ZAPEAR VERDADE
          </button>
        </div>
      </div>

      <div className="xl:col-span-12 mt-12">
        <h3 className="text-xl font-black uppercase font-headline mb-6">
          Últimos Cards Viralizados
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {VIRAL_CARDS.map((card) => (
            <div
              key={card.item}
              className="bg-white border-t-4 border-primary hard-shadow p-6 flex flex-col gap-3"
            >
              <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant">
                {card.item}
              </span>
              <span className="text-2xl font-black font-headline text-error">
                {card.valor}
              </span>
              <span className="text-sm font-bold font-body text-primary">
                {card.equivalencia}
              </span>
              <div className="flex items-center gap-2 mt-auto pt-4 border-t border-outline-variant">
                <MaterialIcon icon="trending_up" size={16} className="text-primary" />
                <span className="font-label text-xs text-on-surface-variant">
                  {card.shares} compartilhamentos
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
