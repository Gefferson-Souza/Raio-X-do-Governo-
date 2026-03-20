import { getSpendingData } from '@/lib/services/spending-service'
import { getRecentContracts } from '@/lib/services/contracts-service'
import { convertToEquivalences } from '@/lib/utils/equivalences'
import { humanizeNumber } from '@/lib/utils/format'
import { REFERENCES } from '@/lib/utils/constants'
import { CounterHero } from '@/components/ui/counter-hero'
import { ContractCard } from '@/components/ui/contract-card'
import { CtaBanner } from '@/components/ui/cta-banner'
import { StatsBar } from '@/components/ui/stats-bar'
import { MaterialIcon } from '@/components/icons/material-icon'
import Link from 'next/link'

export const revalidate = 300

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

function formatPerCapita(total: number): string {
  const perCapita = total / REFERENCES.populacaoBR
  return perCapita.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

function formatPerFamily(total: number): string {
  const perFamily = (total / REFERENCES.populacaoBR) * 4
  return perFamily.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

function formatPerDay(total: number, daysInYear: number): string {
  const perDay = total / daysInYear
  return humanizeNumber(perDay)
}

function formatSalariosPerCapita(total: number): string {
  const perCapita = total / REFERENCES.populacaoBR
  const salarios = perCapita / REFERENCES.salarioMinimo
  return salarios.toFixed(0)
}

export default async function Home() {
  const currentYear = new Date().getFullYear()
  const dayOfYear = Math.floor(
    (Date.now() - new Date(currentYear, 0, 1).getTime()) / (1000 * 60 * 60 * 24)
  ) || 1

  const [spendingSummary, contractsResult] = await Promise.all([
    getSpendingData(2026),
    getRecentContracts(30),
  ])

  const isSpendingError = spendingSummary.source === 'error'
  const isContractsError = contractsResult.source === 'error'

  const { totalPago, totalEmpenhado, totalLiquidado } = spendingSummary
  const equivalences = convertToEquivalences(totalPago)
  const contratos = contractsResult.data

  const topContracts = [...contratos]
    .sort((a, b) => b.valorFinalCompra - a.valorFinalCompra)
    .slice(0, 3)

  const perCapitaValue = formatPerCapita(totalPago)
  const perFamilyValue = formatPerFamily(totalPago)
  const perDayValue = formatPerDay(totalPago, dayOfYear)
  const salariosPerCapita = formatSalariosPerCapita(totalPago)

  const totalPagoTrilhoes = (totalPago / 1_000_000_000_000).toFixed(1).replace('.', ',')

  const anosAlimentacao = Math.floor(equivalences.merendas / 47_000_000 / 200)
  const anosBolsaFamilia = Math.floor(totalPago / (14_200_000_000 * 12))
  const consultasPerCapita = Math.floor((totalPago / REFERENCES.consultaSUS) / REFERENCES.populacaoBR)

  const statsItems = [
    {
      label: 'EMPENHADO',
      subtitle: 'Valor reservado no orcamento para gastar',
      value: isSpendingError ? 'INDISPONIVEL' : humanizeNumber(totalEmpenhado),
      bgClass: 'bg-emerald-900',
      textClass: 'text-white',
    },
    {
      label: 'LIQUIDADO',
      subtitle: 'Servico entregue, pronto para pagar',
      value: isSpendingError ? 'INDISPONIVEL' : humanizeNumber(totalLiquidado),
      bgClass: 'bg-secondary-container',
      textClass: 'text-on-secondary-container',
    },
    {
      label: 'PAGO',
      subtitle: 'Dinheiro que efetivamente saiu do cofre',
      value: isSpendingError ? 'INDISPONIVEL' : humanizeNumber(totalPago),
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

      {/* EXPLAINER BOX */}
      <div className="bg-surface-container-low px-4 sm:px-6 lg:px-12 py-4">
        <p className="font-body text-sm text-on-surface-variant leading-relaxed">
          <strong>O que voce esta vendo:</strong> Este painel mostra quanto dinheiro o governo federal
          brasileiro gastou em {currentYear}, segundo dados oficiais do{' '}
          <a
            href="https://portaldatransparencia.gov.br"
            className="text-primary underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Portal da Transparencia
          </a>
          . Os valores sao atualizados automaticamente a cada 5 minutos.
        </p>
      </div>

      {/* STATS BAR */}
      <StatsBar items={[...statsItems]} />

      {/* ERROR STATE FOR SPENDING */}
      {isSpendingError && (
        <section className="mx-4 lg:mx-12 my-4">
          <div className="bg-error-container border-2 border-error p-6">
            <div className="flex items-center gap-3">
              <MaterialIcon icon="error" className="text-error text-2xl" />
              <div>
                <h3 className="font-headline font-black uppercase text-lg text-on-error-container">
                  DADOS INDISPONIVEIS
                </h3>
                <p className="font-body text-sm text-on-error-container/80">
                  Nao foi possivel carregar os dados do Portal da Transparencia. Tente novamente em alguns minutos.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* BIG COUNTER SECTION */}
      {!isSpendingError && (
        <section className="mx-4 lg:mx-12 my-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 border-4 border-emerald-950 bg-white hard-shadow">
            {/* LEFT: Counter Hero */}
            <div className="lg:col-span-8 min-h-[280px]">
              <CounterHero
                value={totalPago}
                label="TOTAL PAGO EM 2025"
                source="Portal da Transparencia - Dados Abertos"
              />
            </div>

            {/* RIGHT: Per Capita Summary */}
            <div className="lg:col-span-4 bg-white p-6 lg:p-8 flex flex-row lg:flex-col justify-center gap-4 lg:gap-8">
              <div className="flex-1 border-l-4 border-error pl-4 lg:border-l-0 lg:pl-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-error flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-on-error" style={{ fontSize: 22 }} aria-hidden="true">
                      person
                    </span>
                  </div>
                  <span className="text-xs font-bold uppercase font-label text-on-surface-variant tracking-widest">
                    POR BRASILEIRO
                  </span>
                </div>
                <span className="text-3xl font-black font-headline tracking-tighter text-on-surface">
                  {perCapitaValue}
                </span>
                <p className="text-xs font-body text-on-surface-variant mt-1">
                  Se dividissemos igualmente entre todos os 213 milhoes de habitantes
                </p>
              </div>
              <div className="hidden lg:block border-t border-outline-variant" />
              <div className="flex-1 border-l-4 border-secondary pl-4 lg:border-l-0 lg:pl-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-secondary-container flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-on-secondary-container" style={{ fontSize: 22 }} aria-hidden="true">
                      family_restroom
                    </span>
                  </div>
                  <span className="text-xs font-bold uppercase font-label text-on-surface-variant tracking-widest">
                    POR FAMILIA DE 4
                  </span>
                </div>
                <span className="text-3xl font-black font-headline tracking-tighter text-on-surface">
                  {perFamilyValue}
                </span>
                <p className="text-xs font-body text-on-surface-variant mt-1">
                  O equivalente ao preco de um carro popular
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* MOBILE CTA BUTTON */}
      <div className="px-6 -mt-6 relative z-20 md:hidden">
        <Link
          href="/gerador"
          className="block w-full bg-secondary-container text-on-secondary-container text-center font-headline font-black py-5 text-lg shadow-2xl border-b-4 border-secondary-dim active:translate-y-1 active:border-b-0 uppercase"
        >
          CALCULAR MEU PREJUIZO
        </Link>
      </div>

      {/* CONTRACT CARDS SECTION */}
      <section className="px-4 sm:px-6 lg:px-12 py-10 bg-surface-container-low">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
          <div>
            <span className="inline-block bg-error text-on-error px-3 py-1 font-label text-xs font-bold uppercase tracking-widest mb-3">
              DADOS ABERTOS
            </span>
            <h2 className="font-headline font-black uppercase text-4xl tracking-tighter text-on-surface">
              CONTRATOS RECENTES
            </h2>
            <p className="mt-2 font-body text-sm text-on-surface-variant italic">
              Os maiores contratos assinados recentemente. Valores que merecem a sua atencao.
            </p>
          </div>
          <Link
            href="/carrinho"
            className="inline-flex items-center gap-2 bg-emerald-900 text-white px-6 py-3 font-label text-sm font-bold uppercase tracking-wider hover:bg-emerald-800 transition-colors"
          >
            VER TODOS OS CONTRATOS
          </Link>
        </div>

        <p className="font-body text-xs text-on-surface-variant mb-8 bg-surface-container p-3 border-l-4 border-primary">
          Estes sao contratos reais assinados pelo governo federal.
          Cada um pode ser verificado no{' '}
          <a
            href="https://portaldatransparencia.gov.br/contratos"
            className="text-primary underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Portal da Transparencia
          </a>.
        </p>

        {isContractsError && (
          <div className="bg-error-container border-2 border-error p-6">
            <div className="flex items-center gap-3">
              <MaterialIcon icon="error" className="text-error text-2xl" />
              <p className="font-body text-sm text-on-error-container">
                Nao foi possivel carregar os contratos recentes. Tente novamente em alguns minutos.
              </p>
            </div>
          </div>
        )}

        {!isContractsError && topContracts.length === 0 && (
          <div className="bg-surface-container p-6 text-center">
            <p className="font-body text-sm text-on-surface-variant">
              Nenhum contrato encontrado para o periodo selecionado.
            </p>
          </div>
        )}

        {!isContractsError && topContracts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topContracts.map((contrato, index) => (
              <ContractCard
                key={contrato.id}
                icon={pickContractIcon(contrato.compra.objeto)}
                title={contrato.compra.objeto}
                description={`${contrato.fornecedor.nome} - CNPJ: ${contrato.fornecedor.cnpjFormatado}`}
                value={humanizeNumber(contrato.valorFinalCompra)}
                category={contrato.unidadeGestora.orgaoVinculado.nome}
                status={`CONTRATO ${contrato.compra.numero} - VIGENCIA ATE ${formatDateBR(contrato.dataFimVigencia)}`}
                borderColor={pickBorderColor(index)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ISSO SIGNIFICA — RELATABLE EQUIVALENCES */}
      {!isSpendingError && (
        <section className="px-4 sm:px-6 lg:px-12 py-10 bg-surface">
          <div className="mb-3">
            <span className="inline-block bg-error text-on-error px-3 py-1 font-label text-xs font-bold uppercase tracking-widest mb-3">
              TRADUZINDO EM MIUDOS
            </span>
            <h2 className="font-headline font-black uppercase text-3xl md:text-4xl tracking-tighter text-on-surface">
              O GOVERNO JA GASTOU R$ {totalPagoTrilhoes} TRILHOES EM {currentYear}
            </h2>
            <p className="mt-2 font-body text-base text-on-surface-variant">
              Parece um numero impossivel de entender, ne? Entao veja o que isso significa na pratica:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
            {/* Card 1: Per capita */}
            <div className="bg-white border-2 border-outline-variant hard-shadow p-6 flex flex-col gap-3">
              <div className="flex items-center justify-center w-12 h-12 bg-error text-on-error">
                <span className="material-symbols-outlined" style={{ fontSize: 28 }} aria-hidden="true">
                  person
                </span>
              </div>
              <span className="text-3xl font-black font-headline tracking-tighter text-on-surface">
                {perCapitaValue}
              </span>
              <span className="text-sm font-bold uppercase font-label text-error tracking-wide">
                POR CADA BRASILEIRO
              </span>
              <p className="text-xs font-body text-on-surface-variant leading-relaxed">
                Se dividissemos igualmente entre todos os 213 milhoes de habitantes do Brasil
              </p>
            </div>

            {/* Card 2: Per family */}
            <div className="bg-white border-2 border-outline-variant hard-shadow p-6 flex flex-col gap-3">
              <div className="flex items-center justify-center w-12 h-12 bg-secondary-container text-on-secondary-container">
                <span className="material-symbols-outlined" style={{ fontSize: 28 }} aria-hidden="true">
                  family_restroom
                </span>
              </div>
              <span className="text-3xl font-black font-headline tracking-tighter text-on-surface">
                {perFamilyValue}
              </span>
              <span className="text-sm font-bold uppercase font-label text-secondary tracking-wide">
                POR FAMILIA DE 4 PESSOAS
              </span>
              <p className="text-xs font-body text-on-surface-variant leading-relaxed">
                Da para comprar um carro popular com o que o governo gastou da sua familia
              </p>
            </div>

            {/* Card 3: Per day */}
            <div className="bg-white border-2 border-outline-variant hard-shadow p-6 flex flex-col gap-3">
              <div className="flex items-center justify-center w-12 h-12 bg-primary text-on-primary">
                <span className="material-symbols-outlined" style={{ fontSize: 28 }} aria-hidden="true">
                  schedule
                </span>
              </div>
              <span className="text-3xl font-black font-headline tracking-tighter text-on-surface">
                {perDayValue}
              </span>
              <span className="text-sm font-bold uppercase font-label text-primary tracking-wide">
                POR DIA
              </span>
              <p className="text-xs font-body text-on-surface-variant leading-relaxed">
                O governo gasta isso a cada 24 horas, incluindo fins de semana e feriados
              </p>
            </div>

            {/* Card 4: Salarios minimos per capita */}
            <div className="bg-white border-2 border-outline-variant hard-shadow p-6 flex flex-col gap-3">
              <div className="flex items-center justify-center w-12 h-12 bg-tertiary-container text-on-tertiary-container">
                <span className="material-symbols-outlined" style={{ fontSize: 28 }} aria-hidden="true">
                  payments
                </span>
              </div>
              <span className="text-3xl font-black font-headline tracking-tighter text-on-surface">
                {salariosPerCapita}
              </span>
              <span className="text-sm font-bold uppercase font-label text-tertiary tracking-wide">
                SALARIOS MINIMOS POR PESSOA
              </span>
              <p className="text-xs font-body text-on-surface-variant leading-relaxed">
                A parte de cada brasileiro equivale a {salariosPerCapita} meses de salario minimo (R$ {REFERENCES.salarioMinimo.toLocaleString('pt-BR')})
              </p>
            </div>
          </div>
        </section>
      )}

      {/* O QUE DARIA PRA FAZER — MEANINGFUL COMPARISONS */}
      {!isSpendingError && (
        <section className="px-4 sm:px-6 lg:px-12 py-10 bg-surface-container-low">
          <h2 className="font-headline font-black uppercase text-3xl tracking-tighter text-on-surface mb-2">
            O QUE DARIA PRA FAZER COM ESSE DINHEIRO?
          </h2>
          <p className="font-body text-sm text-on-surface-variant italic mb-8">
            Comparacoes reais para voce entender o tamanho desse gasto.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Alimentar criancas */}
            <div className="bg-white border-2 border-outline-variant hard-shadow p-6 flex items-start gap-4">
              <div className="flex items-center justify-center w-14 h-14 bg-primary text-on-primary shrink-0">
                <span className="material-symbols-outlined" style={{ fontSize: 32 }} aria-hidden="true">
                  lunch_dining
                </span>
              </div>
              <div>
                <span className="text-2xl font-black font-headline tracking-tighter text-on-surface">
                  {anosAlimentacao > 0 ? `${anosAlimentacao.toLocaleString('pt-BR')} anos` : 'Muitos anos'}
                </span>
                <p className="text-sm font-bold uppercase font-label text-primary mt-1">
                  ALIMENTANDO TODAS AS CRIANCAS NA ESCOLA
                </p>
                <p className="text-xs font-body text-on-surface-variant mt-2 leading-relaxed">
                  Daria para pagar a merenda de todos os 47 milhoes de estudantes brasileiros por {anosAlimentacao > 0 ? `${anosAlimentacao.toLocaleString('pt-BR')} anos` : 'muitos anos'}
                </p>
              </div>
            </div>

            {/* Escolas */}
            <div className="bg-white border-2 border-outline-variant hard-shadow p-6 flex items-start gap-4">
              <div className="flex items-center justify-center w-14 h-14 bg-error text-on-error shrink-0">
                <span className="material-symbols-outlined" style={{ fontSize: 32 }} aria-hidden="true">
                  school
                </span>
              </div>
              <div>
                <span className="text-2xl font-black font-headline tracking-tighter text-on-surface">
                  {equivalences.escolasFNDE.toLocaleString('pt-BR')} escolas
                </span>
                <p className="text-sm font-bold uppercase font-label text-error mt-1">
                  PODERIAM SER CONSTRUIDAS
                </p>
                <p className="text-xs font-body text-on-surface-variant mt-2 leading-relaxed">
                  Cada escola custa R$ 5 milhoes (padrao FNDE com 6 salas e quadra esportiva). Daria uma escola nova para cada bairro do Brasil
                </p>
              </div>
            </div>

            {/* Bolsa Familia */}
            <div className="bg-white border-2 border-outline-variant hard-shadow p-6 flex items-start gap-4">
              <div className="flex items-center justify-center w-14 h-14 bg-secondary-container text-on-secondary-container shrink-0">
                <span className="material-symbols-outlined" style={{ fontSize: 32 }} aria-hidden="true">
                  favorite
                </span>
              </div>
              <div>
                <span className="text-2xl font-black font-headline tracking-tighter text-on-surface">
                  {anosBolsaFamilia > 0 ? `${anosBolsaFamilia.toLocaleString('pt-BR')} anos` : 'Muitos anos'}
                </span>
                <p className="text-sm font-bold uppercase font-label text-secondary mt-1">
                  DO BOLSA FAMILIA
                </p>
                <p className="text-xs font-body text-on-surface-variant mt-2 leading-relaxed">
                  Seria possivel manter o programa Bolsa Familia funcionando por {anosBolsaFamilia > 0 ? `${anosBolsaFamilia.toLocaleString('pt-BR')} anos` : 'muitos anos'}, atendendo todas as familias cadastradas
                </p>
              </div>
            </div>

            {/* Consultas SUS */}
            <div className="bg-white border-2 border-outline-variant hard-shadow p-6 flex items-start gap-4">
              <div className="flex items-center justify-center w-14 h-14 bg-tertiary-container text-on-tertiary-container shrink-0">
                <span className="material-symbols-outlined" style={{ fontSize: 32 }} aria-hidden="true">
                  local_hospital
                </span>
              </div>
              <div>
                <span className="text-2xl font-black font-headline tracking-tighter text-on-surface">
                  {consultasPerCapita.toLocaleString('pt-BR')} consultas
                </span>
                <p className="text-sm font-bold uppercase font-label text-tertiary mt-1">
                  POR BRASILEIRO NO SUS
                </p>
                <p className="text-xs font-body text-on-surface-variant mt-2 leading-relaxed">
                  Cada brasileiro poderia ir ao medico {consultasPerCapita.toLocaleString('pt-BR')} vezes com o valor total gasto pelo governo
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* MOBILE VIRAL HASHTAG SECTION */}
      <section className="mt-12 bg-on-surface text-white p-8 mx-4 md:mx-0 md:hidden">
        <MaterialIcon icon="receipt_long" filled className="text-yellow-400 text-4xl mb-4" />
        <h2 className="font-headline font-black text-3xl uppercase leading-[0.9] tracking-tighter mb-4">
          Seu imposto esta pagando o silencio.
        </h2>
        <p className="font-body text-sm text-surface-variant mb-6 leading-relaxed">
          Fiscalize os gastos publicos. Cada centavo deve ser justificado.
        </p>
        <div className="h-1 bg-yellow-400 w-16 mb-6" />
        <p className="font-label text-xs uppercase font-bold tracking-widest text-yellow-400">
          #OMeuDinheiroSumindo
        </p>
      </section>

      {/* CTA BANNER */}
      <CtaBanner
        title="FISCALIZE. COMPARTILHE. COBRE."
        subtitle="Nenhum centavo pode sumir quando milhoes de olhos estao vigiando. Veja o ranking dos orgaos que mais gastam e acompanhe cada real."
        buttonText="VER RANKING DE GASTOS"
        buttonHref="/ranking"
      />
    </div>
  )
}
