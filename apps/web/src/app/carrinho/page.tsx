import { MaterialIcon } from '@/components/icons/material-icon'
import { getRecentContracts } from '@/lib/services/contracts-service'
import { humanizeNumber, formatBRL, formatDateBR } from '@/lib/utils/format'
import { convertToEquivalences, type Equivalences } from '@/lib/utils/equivalences'
import { DataSourceBanner } from '@/components/ui/data-source-banner'
import type { Contrato } from '@/lib/api/types'

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

const EQ_LABELS = [
  (eq: Equivalences) => `${eq.salariosMinimos.toLocaleString('pt-BR')} salarios minimos`,
  (eq: Equivalences) => `${eq.cestasBasicas.toLocaleString('pt-BR')} cestas basicas`,
  (eq: Equivalences) => `${eq.consultasSUS.toLocaleString('pt-BR')} consultas no SUS`,
  (eq: Equivalences) => `${eq.casasPopulares.toLocaleString('pt-BR')} casas populares`,
  (eq: Equivalences) => `${eq.ambulanciasUTI.toLocaleString('pt-BR')} ambulancias UTI`,
  (eq: Equivalences) => `${eq.kitsEscolares.toLocaleString('pt-BR')} kits escolares`,
] as const

function pickEquivalence(valor: number, index: number): string {
  const eq = convertToEquivalences(valor)
  const formatter = EQ_LABELS[index % EQ_LABELS.length]
  const result = formatter(eq)
  if (result.startsWith('0 ')) {
    return `${eq.salariosMinimos.toLocaleString('pt-BR')} salarios minimos`
  }
  return result
}

type DisplayItem =
  | { readonly kind: 'contract'; readonly contrato: Contrato; readonly eqIdx: number }
  | { readonly kind: 'collapsed'; readonly supplier: string; readonly extra: number; readonly totalValue: number }

function buildDisplayItems(contracts: readonly Contrato[]): readonly DisplayItem[] {
  const seen = new Map<string, number>()
  const collapsed = new Set<string>()
  const items: DisplayItem[] = []
  let eqIdx = 0

  for (const c of contracts) {
    const name = c.fornecedor?.nome ?? 'Nao informado'
    const count = (seen.get(name) ?? 0) + 1
    seen.set(name, count)

    if (count <= 2) {
      items.push({ kind: 'contract', contrato: c, eqIdx: eqIdx++ })
    } else if (!collapsed.has(name)) {
      collapsed.add(name)
      const allFromSupplier = contracts.filter(
        (x) => (x.fornecedor?.nome ?? 'Nao informado') === name,
      )
      const extra = allFromSupplier.length - 2
      const totalValue = allFromSupplier
        .slice(2)
        .reduce((s, x) => s + x.valorFinalCompra, 0)
      items.push({ kind: 'collapsed', supplier: name, extra, totalValue })
    }
  }

  return items
}

export default async function CarrinhoPage() {
  const { data: contracts, source: contractsSource } = await getRecentContracts(90)

  const isContractsError = contractsSource === 'error'
  const hasContracts = contracts.length > 0

  const sortedContracts = [...contracts]
    .sort((a, b) => b.valorFinalCompra - a.valorFinalCompra)
    .slice(0, 20)

  const totalContratos = contracts.reduce((sum, c) => sum + c.valorFinalCompra, 0)
  const displayItems = buildDisplayItems(sortedContracts)

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

      <section className="grid grid-cols-1 md:grid-cols-2 gap-0">
        <div className="p-6 bg-yellow-400">
          <span className="block text-xs uppercase tracking-widest font-label text-emerald-950">
            Contratos Encontrados
          </span>
          <span className="block text-3xl font-black tracking-tighter font-headline text-emerald-950">
            {isContractsError ? 'INDISPONIVEL' : `${contracts.length} contratos`}
          </span>
        </div>
        <div className="p-6 bg-surface-container-highest">
          <span className="block text-xs uppercase tracking-widest font-label text-on-surface-variant">
            Valor Total
          </span>
          <span className="block text-3xl font-black tracking-tighter font-headline text-error">
            {isContractsError ? 'INDISPONIVEL' : humanizeNumber(totalContratos)}
          </span>
        </div>
      </section>

      <DataSourceBanner
        source={isContractsError ? 'error' : contractsSource}
        updatedAt={new Date().toISOString()} /* TODO: use actual data timestamp when contracts-service exposes it */
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
        <section className="mt-8">
          <div className="flex flex-col gap-0 border-2 border-outline-variant bg-white">
            {displayItems.map((item, index) => {
              if (item.kind === 'collapsed') {
                return (
                  <div
                    key={`collapsed-${item.supplier}`}
                    className="px-6 py-4 bg-surface-container-low border-b border-outline-variant flex items-center gap-3"
                  >
                    <MaterialIcon icon="more_horiz" className="text-on-surface-variant" />
                    <span className="font-body text-sm text-on-surface-variant">
                      e mais <strong>{item.extra}</strong> contrato{item.extra > 1 ? 's' : ''} com{' '}
                      <strong>{item.supplier}</strong>{' '}
                      <span className="text-xs text-on-surface-variant/60">
                        (total: {formatBRL(item.totalValue)})
                      </span>
                    </span>
                  </div>
                )
              }

              const { contrato, eqIdx } = item
              const objeto = contrato.compra?.objeto ?? 'Sem descricao'
              const fornecedor = contrato.fornecedor?.nome ?? 'Nao informado'
              const orgao = contrato.unidadeGestora?.orgaoVinculado?.nome ?? ''
              const numero = contrato.compra?.numero ?? 'N/A'
              const icon = pickIcon(objeto)
              const equivalence = pickEquivalence(contrato.valorFinalCompra, eqIdx)

              return (
                <div
                  key={`${contrato.id}-${index}`}
                  className="border-b border-outline-variant last:border-b-0 p-6 flex flex-col md:flex-row md:items-start gap-4"
                >
                  <div className="flex items-center justify-center w-10 h-10 bg-surface-container-high shrink-0">
                    <MaterialIcon icon={icon} size={22} className="text-on-surface-variant" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-headline font-black text-base uppercase leading-tight line-clamp-2 text-on-surface">
                      {objeto}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-label text-on-surface-variant">
                      <span>Contrato {numero}</span>
                      <span className="w-1 h-1 bg-outline-variant rounded-full" />
                      <span>{formatDateBR(contrato.dataInicioVigencia)} a {formatDateBR(contrato.dataFimVigencia)}</span>
                    </div>
                    <p className="mt-1 font-body text-sm text-on-surface-variant">
                      {fornecedor}
                    </p>
                    {orgao && (
                      <p className="font-label text-xs text-primary font-bold uppercase mt-1">
                        {orgao}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 text-right md:min-w-[180px]">
                    <span className="block text-xl font-black font-headline text-error tracking-tight">
                      {formatBRL(contrato.valorFinalCompra)}
                    </span>
                    <span className="block text-xs font-label text-on-surface-variant uppercase mt-1">
                      {equivalence}
                    </span>
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
