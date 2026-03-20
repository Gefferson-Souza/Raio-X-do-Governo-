import { getCached, setCache } from '@/lib/api/cache'
import type { SpendingSummary, Contrato } from '@/lib/api/types'
import { convertToEquivalences } from '@/lib/utils/equivalences'
import { humanizeNumber } from '@/lib/utils/format'
import { CounterHero } from '@/components/ui/counter-hero'
import { KpiEquivalence } from '@/components/ui/kpi-equivalence'
import { ContractCard } from '@/components/ui/contract-card'
import { CtaBanner } from '@/components/ui/cta-banner'
import { StatsBar } from '@/components/ui/stats-bar'
import { MaterialIcon } from '@/components/icons/material-icon'
import Link from 'next/link'

const CONTRACT_ICONS: Record<string, string> = {
  'TRANSPORTE': 'flight',
  'MOBILIARIO': 'chair',
  'BUFFET': 'restaurant',
  'ALIMENTACAO': 'restaurant',
  'VEICULOS': 'directions_car',
  'BLINDADOS': 'directions_car',
  'CONSULTORIA': 'campaign',
  'COMUNICACAO': 'campaign',
  'REFORMA': 'construction',
} as const

function pickContractIcon(objeto: string): string {
  const upperObjeto = objeto.toUpperCase()
  for (const [keyword, icon] of Object.entries(CONTRACT_ICONS)) {
    if (upperObjeto.includes(keyword)) {
      return icon
    }
  }
  return 'description'
}

function pickBorderColor(index: number): string {
  const colors = [
    'border-error',
    'border-secondary',
    'border-primary',
    'border-tertiary',
    'border-error',
    'border-secondary',
  ] as const
  return colors[index % colors.length]
}

function formatDateBR(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

const MOCK_SUMMARY: SpendingSummary = {
  totalPago: 1_892_400_000_000,
  totalEmpenhado: 2_145_700_000_000,
  totalLiquidado: 1_998_300_000_000,
  porOrgao: [],
  atualizadoEm: new Date().toISOString(),
}

const MOCK_CONTRATOS: Contrato[] = [
  {
    id: 88201,
    dataAssinatura: '2026-03-10',
    dataFimVigencia: '2026-12-31',
    dataInicioVigencia: '2026-03-15',
    dimCompra: {
      numero: '00012/2026',
      objeto: 'SERVICOS DE TRANSPORTE AEREO PARA COMITIVA PRESIDENCIAL',
    },
    fornecedor: { cnpjCpf: '12.345.678/0001-90', nome: 'AEROSERVICE TRANSPORTES EXECUTIVOS LTDA' },
    unidadeGestora: {
      codigo: '110001',
      nome: 'PRESIDENCIA DA REPUBLICA',
      orgaoVinculado: { codigo: '20000', nome: 'PRESIDENCIA DA REPUBLICA' },
    },
    valorFinal: 4_800_000,
    valorInicial: 3_200_000,
  },
]

async function getSpendingSummary(): Promise<SpendingSummary> {
  const CACHE_KEY = 'spending-summary-2025'
  const CACHE_TTL_SECONDS = 300

  const cached = await getCached<SpendingSummary>(CACHE_KEY)
  if (cached) return cached

  const apiKey = process.env.TRANSPARENCY_API_KEY
  if (!apiKey) {
    await setCache(CACHE_KEY, MOCK_SUMMARY, CACHE_TTL_SECONDS)
    return MOCK_SUMMARY
  }

  try {
    const { fetchSpendingSummary } = await import('@/lib/api/transparency')
    const summary = await fetchSpendingSummary(2025)
    await setCache(CACHE_KEY, summary, CACHE_TTL_SECONDS)
    return summary
  } catch {
    await setCache(CACHE_KEY, MOCK_SUMMARY, CACHE_TTL_SECONDS)
    return MOCK_SUMMARY
  }
}

async function getRecentContratos(): Promise<Contrato[]> {
  const CACHE_KEY = 'contratos-recent'
  const CACHE_TTL_SECONDS = 300

  const cached = await getCached<Contrato[]>(CACHE_KEY)
  if (cached) return cached

  const apiKey = process.env.TRANSPARENCY_API_KEY
  if (!apiKey) {
    await setCache(CACHE_KEY, MOCK_CONTRATOS, CACHE_TTL_SECONDS)
    return MOCK_CONTRATOS
  }

  try {
    const { fetchContratos } = await import('@/lib/api/transparency')
    const today = new Date()
    const dataFinal = today.toISOString().split('T')[0]
    const pastDate = new Date(today)
    pastDate.setDate(today.getDate() - 30)
    const dataInicial = pastDate.toISOString().split('T')[0]
    const contratos = await fetchContratos(dataInicial, dataFinal, 1)
    await setCache(CACHE_KEY, contratos, CACHE_TTL_SECONDS)
    return contratos
  } catch {
    await setCache(CACHE_KEY, MOCK_CONTRATOS, CACHE_TTL_SECONDS)
    return MOCK_CONTRATOS
  }
}

export default async function Home() {
  const [spendingSummary, contratos] = await Promise.all([
    getSpendingSummary(),
    getRecentContratos(),
  ])

  const { totalPago, totalEmpenhado, totalLiquidado } = spendingSummary
  const equivalences = convertToEquivalences(totalPago)

  const topContracts = [...contratos]
    .sort((a, b) => b.valorFinal - a.valorFinal)
    .slice(0, 3)

  const statsItems = [
    {
      label: 'TOTAL EMPENHADO',
      value: humanizeNumber(totalEmpenhado),
      bgClass: 'bg-emerald-900',
      textClass: 'text-white',
    },
    {
      label: 'TOTAL LIQUIDADO',
      value: humanizeNumber(totalLiquidado),
      bgClass: 'bg-secondary-container',
      textClass: 'text-on-secondary-container',
    },
    {
      label: 'TOTAL PAGO',
      value: humanizeNumber(totalPago),
      bgClass: 'bg-error-container',
      textClass: 'text-white',
    },
  ] as const

  return (
    <div className="flex flex-col gap-0">
      {/* HEADER SECTION */}
      <section className="px-4 sm:px-6 lg:px-12 pt-10 pb-6 bg-surface">
        <span className="inline-block bg-primary text-on-primary px-4 py-1 font-label text-xs font-bold uppercase tracking-widest mb-4">
          PAINEL DA VERDADE - ONDE O SEU IMPOSTO VAI PARAR
        </span>
        <h1 className="font-headline font-black uppercase text-6xl md:text-8xl leading-none tracking-tighter text-on-surface">
          O CONTADOR<br />
          DO <span className="text-error">SUMICO</span>
        </h1>
        <p className="mt-4 font-body italic text-lg text-on-surface-variant max-w-2xl">
          Acompanhe em tempo real quanto dinheiro publico esta sendo gasto pelo governo federal.
          Cada centavo rastreado. Cada contrato exposto. Sem filtro.
        </p>
      </section>

      {/* STATS BAR */}
      <StatsBar items={[...statsItems]} />

      {/* BIG COUNTER SECTION */}
      <section className="mx-4 lg:mx-12 my-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 border-4 border-emerald-950 bg-white hard-shadow">
          {/* LEFT: Counter Hero */}
          <div className="lg:col-span-8 min-h-[280px]">
            <CounterHero
              value={totalPago}
              label="TOTAL PAGO EM 2026"
              source="Portal da Transparencia - Dados Abertos"
            />
          </div>

          {/* RIGHT: KPI Equivalences */}
          <div className="lg:col-span-4 bg-white p-6 lg:p-8 flex flex-row lg:flex-col justify-center gap-4 lg:gap-8">
            <div className="flex-1 border-l-4 border-error pl-4 lg:border-l-0 lg:pl-0">
              <KpiEquivalence
                icon="school"
                label="ESCOLAS FNDE"
                value={equivalences.escolasFNDE.toLocaleString('pt-BR')}
                description="Escolas que poderiam ser construidas com esse valor"
                iconBgColor="bg-error"
                iconTextColor="text-on-error"
              />
            </div>
            <div className="hidden lg:block border-t border-outline-variant" />
            <div className="flex-1 border-l-4 border-secondary pl-4 lg:border-l-0 lg:pl-0">
              <KpiEquivalence
                icon="payments"
                label="SALARIOS MINIMOS"
                value={equivalences.salariosMinimos.toLocaleString('pt-BR')}
                description="Equivalente em salarios minimos de R$ 1.518"
                iconBgColor="bg-secondary-container"
                iconTextColor="text-on-secondary-container"
              />
            </div>
          </div>
        </div>
      </section>

      {/* MOBILE CTA BUTTON */}
      <div className="px-6 -mt-6 relative z-20 md:hidden">
        <button className="w-full bg-secondary-container text-on-secondary-container font-headline font-black py-5 text-lg shadow-2xl border-b-4 border-secondary-dim active:translate-y-1 active:border-b-0 uppercase">
          CALCULAR MEU PREJUÍZO
        </button>
      </div>

      {/* CONTRACT CARDS SECTION */}
      <section className="px-4 sm:px-6 lg:px-12 py-10 bg-surface-container-low">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <span className="inline-block bg-error text-on-error px-3 py-1 font-label text-xs font-bold uppercase tracking-widest mb-3">
              DADOS ABERTOS
            </span>
            <h2 className="font-headline font-black uppercase text-4xl tracking-tighter text-on-surface">
              CONTRATOS SUSPEITOS HOJE
            </h2>
            <p className="mt-2 font-body text-sm text-on-surface-variant italic">
              Os maiores contratos assinados recentemente. Valores que merecem a sua atencao.
            </p>
          </div>
          <Link
            href="/gastos"
            className="inline-flex items-center gap-2 bg-emerald-900 text-white px-6 py-3 font-label text-sm font-bold uppercase tracking-wider hover:bg-emerald-800 transition-colors"
          >
            VER TODOS OS CONTRATOS
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topContracts.map((contrato, index) => (
            <ContractCard
              key={contrato.id}
              icon={pickContractIcon(contrato.dimCompra.objeto)}
              title={contrato.dimCompra.objeto}
              description={`${contrato.fornecedor.nome} - CNPJ: ${contrato.fornecedor.cnpjCpf}`}
              value={humanizeNumber(contrato.valorFinal)}
              category={contrato.unidadeGestora.orgaoVinculado.nome}
              status={`CONTRATO ${contrato.dimCompra.numero} - VIGENCIA ATE ${formatDateBR(contrato.dataFimVigencia)}`}
              borderColor={pickBorderColor(index)}
            />
          ))}
        </div>
      </section>

      {/* EQUIVALENCES GRID */}
      <section className="px-4 sm:px-6 lg:px-12 py-10 bg-surface">
        <h2 className="font-headline font-black uppercase text-3xl tracking-tighter text-on-surface mb-2">
          O QUE ESSE DINHEIRO COMPRARIA
        </h2>
        <p className="font-body text-sm text-on-surface-variant italic mb-8">
          Traducao do gasto publico em coisas que voce entende.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <EquivalenceCard
            icon="local_hospital"
            label="CONSULTAS NO SUS"
            value={equivalences.consultasSUS.toLocaleString('pt-BR')}
            bgClass="bg-white"
          />
          <EquivalenceCard
            icon="home"
            label="CASAS POPULARES"
            value={equivalences.casasPopulares.toLocaleString('pt-BR')}
            bgClass="bg-white"
          />
          <EquivalenceCard
            icon="lunch_dining"
            label="MERENDAS ESCOLARES"
            value={equivalences.merendas.toLocaleString('pt-BR')}
            bgClass="bg-white"
          />
          <EquivalenceCard
            icon="favorite"
            label="CIRURGIAS CARDIACAS"
            value={equivalences.cirurgiasCardiacas.toLocaleString('pt-BR')}
            bgClass="bg-white"
          />
        </div>
      </section>

      {/* MOBILE VIRAL HASHTAG SECTION */}
      <section className="mt-12 bg-on-surface text-white p-8 mx-4 md:mx-0 md:hidden">
        <MaterialIcon icon="receipt_long" filled className="text-yellow-400 text-4xl mb-4" />
        <h2 className="font-headline font-black text-3xl uppercase leading-[0.9] tracking-tighter mb-4">
          Seu imposto está pagando o silêncio.
        </h2>
        <p className="font-body text-sm text-surface-variant mb-6 leading-relaxed">
          Nas últimas 24 horas, o montante gasto poderia ter erradicado a fila de cirurgias eletivas em 12 estados.
        </p>
        <div className="h-1 bg-yellow-400 w-16 mb-6" />
        <p className="font-label text-xs uppercase font-bold tracking-widest text-yellow-400">
          #OMeuDinheiroSumindo
        </p>
      </section>

      {/* CTA BANNER */}
      <CtaBanner
        title="FISCALIZE. COMPARTILHE. COBRE."
        subtitle="Nenhum centavo pode sumir quando milhoes de olhos estao vigiando. Acesse os dossies completos e ajude a manter o governo na linha."
        buttonText="EXPLORAR DOSSIES"
        buttonHref="/dossies"
      />
    </div>
  )
}

function EquivalenceCard({
  icon,
  label,
  value,
  bgClass,
}: {
  readonly icon: string
  readonly label: string
  readonly value: string
  readonly bgClass: string
}) {
  return (
    <div className={`${bgClass} border-2 border-outline-variant hard-shadow p-6 flex flex-col gap-3`}>
      <div className="flex items-center justify-center w-12 h-12 bg-primary text-on-primary">
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 28 }}
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>
      <span className="text-xs font-bold uppercase font-label text-on-surface-variant tracking-widest">
        {label}
      </span>
      <span className="text-3xl font-black font-headline tracking-tighter text-on-surface">
        {value}
      </span>
    </div>
  )
}
