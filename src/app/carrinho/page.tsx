import { MaterialIcon } from '@/components/icons/material-icon'
import { getSpendingData } from '@/lib/services/spending-service'
import { getRecentContracts } from '@/lib/services/contracts-service'
import { humanizeNumber, formatBRL } from '@/lib/utils/format'
import { convertToEquivalences } from '@/lib/utils/equivalences'
import { DataSourceBanner } from '@/components/ui/data-source-banner'

export const revalidate = 300

const ICON_MAP: Record<string, string> = {
  TRANSPORTE: 'flight',
  AEREO: 'flight',
  VIAGEM: 'flight',
  MOBILIARIO: 'chair',
  MOVEIS: 'chair',
  ALIMENTACAO: 'restaurant',
  BUFFET: 'restaurant',
  CONSULTORIA: 'campaign',
  COMUNICACAO: 'campaign',
  REFORMA: 'construction',
  OBRA: 'construction',
  VEICULO: 'directions_car',
  BLINDADO: 'directions_car',
  TECNOLOGIA: 'computer',
  SOFTWARE: 'computer',
  SAUDE: 'local_hospital',
  MEDICAMENTO: 'medication',
  SEGURANCA: 'shield',
  EDUCACAO: 'school',
}

function pickIcon(objeto: string): string {
  const upper = objeto.toUpperCase()
  for (const [keyword, icon] of Object.entries(ICON_MAP)) {
    if (upper.includes(keyword)) return icon
  }
  return 'receipt_long'
}

function pickEquivalence(valor: number): string {
  const eq = convertToEquivalences(valor)
  if (eq.ambulanciasUTI >= 1) return `${eq.ambulanciasUTI.toLocaleString('pt-BR')} AMBULANCIA(S) UTI`
  if (eq.casasPopulares >= 1) return `${eq.casasPopulares.toLocaleString('pt-BR')} CASA(S) POPULAR(ES)`
  if (eq.consultasSUS >= 1) return `${eq.consultasSUS.toLocaleString('pt-BR')} CONSULTAS SUS`
  if (eq.cestasBasicas >= 1) return `${eq.cestasBasicas.toLocaleString('pt-BR')} CESTAS BASICAS`
  if (eq.kitsEscolares >= 1) return `${eq.kitsEscolares.toLocaleString('pt-BR')} KITS ESCOLARES`
  if (eq.merendas >= 1) return `${eq.merendas.toLocaleString('pt-BR')} MERENDAS ESCOLARES`
  return `${eq.salariosMinimos.toLocaleString('pt-BR')} SALARIOS MINIMOS`
}

export default async function CarrinhoPage() {
  const year = new Date().getFullYear()
  const [spendingSummary, { data: contracts, source: contractsSource }] = await Promise.all([
    getSpendingData(year),
    getRecentContracts(90),
  ])

  const isSpendingError = spendingSummary.source === 'error'
  const isContractsError = contractsSource === 'error'
  const hasContracts = contracts.length > 0

  const topContracts = [...contracts]
    .sort((a, b) => b.valorFinalCompra - a.valorFinalCompra)
    .slice(0, 12)

  const totalContratos = contracts.reduce((sum, c) => sum + c.valorFinalCompra, 0)

  return (
    <div className="pb-12 lg:pl-8 px-4 md:px-8">
      <section className="bg-primary-container p-8 md:p-12">
        <span className="inline-block bg-on-primary-container text-primary-container font-label text-xs font-bold uppercase tracking-widest px-4 py-1 mb-6">
          DADOS EM TEMPO REAL — PORTAL DA TRANSPARENCIA
        </span>
        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter font-headline text-on-primary-container">
          CONTRATOS DO GOVERNO
        </h1>
        <p className="mt-4 text-lg font-body text-on-primary-container/80 max-w-3xl">
          Os maiores contratos federais dos ultimos 90 dias. Todos os valores
          sao extraidos da API oficial do Portal da Transparencia em tempo real.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-0">
        <div className="p-6 bg-emerald-900">
          <span className="block text-xs uppercase tracking-widest font-label text-yellow-400">
            Total Pago ({year})
          </span>
          <span className="block text-3xl font-black tracking-tighter font-headline text-white">
            {isSpendingError ? 'INDISPONIVEL' : humanizeNumber(spendingSummary.totalPago)}
          </span>
        </div>
        <div className="p-6 bg-yellow-400">
          <span className="block text-xs uppercase tracking-widest font-label text-emerald-950">
            Contratos Recentes
          </span>
          <span className="block text-3xl font-black tracking-tighter font-headline text-emerald-950">
            {isContractsError ? 'INDISPONIVEL' : `${contracts.length} CONTRATOS`}
          </span>
        </div>
        <div className="p-6 bg-surface-container-highest">
          <span className="block text-xs uppercase tracking-widest font-label text-on-surface-variant">
            Valor Total Contratos
          </span>
          <span className="block text-3xl font-black tracking-tighter font-headline text-error">
            {isContractsError ? 'INDISPONIVEL' : humanizeNumber(totalContratos)}
          </span>
        </div>
      </section>

      <DataSourceBanner
        source={isContractsError ? 'error' : contractsSource}
        updatedAt={spendingSummary.atualizadoEm}
      />

      {isContractsError && (
        <section className="mt-8">
          <div className="bg-error-container border-2 border-error p-6">
            <div className="flex items-center gap-3">
              <MaterialIcon icon="error" className="text-error text-2xl" />
              <div>
                <h3 className="font-headline font-black uppercase text-lg text-on-error-container">
                  DADOS EM TEMPO REAL INDISPONIVEIS
                </h3>
                <p className="font-body text-sm text-on-error-container/80">
                  Nao foi possivel conectar ao Portal da Transparencia. Verifique sua conexao ou tente novamente.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {hasContracts && (
        <section className="mt-12">
          <div
            className="grid gap-8"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}
          >
            {topContracts.map((contrato) => {
              const equivalence = pickEquivalence(contrato.valorFinalCompra)
              const icon = pickIcon(contrato.compra?.objeto || '')
              const objeto = contrato.compra?.objeto || 'Contrato Federal'
              const fornecedor = contrato.fornecedor?.nome || 'Nao informado'

              return (
                <div
                  key={contrato.id}
                  className="relative bg-white border-b-[8px] border-primary hard-shadow flex flex-col"
                >
                  <span className="absolute top-3 right-3 z-10 font-label text-xs font-black uppercase px-3 py-1 bg-secondary-container text-on-secondary-container">
                    AUDITADO
                  </span>

                  <div className="h-48 overflow-hidden bg-surface-container-high flex items-center justify-center">
                    <MaterialIcon icon={icon} size={64} className="text-on-surface-variant/40" />
                  </div>

                  <div className="p-6 flex flex-col gap-4 flex-1">
                    <h3 className="font-headline font-black text-xl uppercase leading-tight line-clamp-3">
                      {objeto}
                    </h3>
                    <p className="font-body text-xs text-on-surface-variant uppercase">
                      {typeof fornecedor === 'string' ? fornecedor : ''}
                    </p>
                    <p className="font-label text-xs text-primary font-bold uppercase">
                      {contrato.unidadeGestora?.orgaoVinculado?.nome || ''}
                    </p>

                    <div className="bg-surface-container-low p-4 mt-auto">
                      <span className="block text-xs uppercase tracking-widest font-label text-on-surface-variant">
                        Valor do Contrato
                      </span>
                      <span className="block text-2xl font-black font-headline text-error">
                        {formatBRL(contrato.valorFinalCompra)}
                      </span>
                    </div>

                    <div className="bg-secondary-container p-4">
                      <span className="block text-xs uppercase tracking-widest font-label text-on-secondary-container">
                        O QUE ISSO COMPRA?
                      </span>
                      <span className="block text-base font-bold font-headline text-on-secondary-container">
                        {equivalence}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {!hasContracts && !isContractsError && (
        <section className="mt-12 text-center p-12">
          <MaterialIcon icon="search_off" size={64} className="text-on-surface-variant/30" />
          <h3 className="font-headline font-black uppercase text-xl mt-4">
            NENHUM CONTRATO ENCONTRADO
          </h3>
          <p className="font-body text-on-surface-variant mt-2">
            Nao foram encontrados contratos nos ultimos 90 dias para os orgaos consultados.
          </p>
        </section>
      )}

      <section className="text-center mt-20">
        <h2 className="text-3xl font-black uppercase font-headline text-on-surface mb-4">
          Viu algo suspeito?
        </h2>
        <p className="text-on-surface-variant font-body mb-8 max-w-xl mx-auto">
          Todos os dados sao publicos e verificaveis no Portal da Transparencia.
          Compartilhe para que mais brasileiros tenham acesso.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="https://portaldatransparencia.gov.br"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-primary text-on-primary font-label font-bold uppercase tracking-wider px-8 py-4"
          >
            <MaterialIcon icon="open_in_new" size={20} />
            VER NO PORTAL OFICIAL
          </a>
          <a
            href="#compartilhar"
            className="inline-flex items-center gap-2 bg-secondary-container text-on-secondary-container font-label font-bold uppercase tracking-wider px-8 py-4"
          >
            <MaterialIcon icon="share" size={20} />
            COMPARTILHAR
          </a>
        </div>
        <p className="mt-8 text-xs font-label text-on-surface-variant uppercase tracking-widest">
          Fonte: API Portal da Transparencia — Dados Abertos
        </p>
      </section>
    </div>
  )
}
