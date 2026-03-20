import { MaterialIcon } from '@/components/icons/material-icon'
import { getSpendingData } from '@/lib/services/spending-service'
import { getRecentContracts } from '@/lib/services/contracts-service'
import { humanizeNumber, formatBRL } from '@/lib/utils/format'
import { aggregateByOrgaoSuperior } from '@/lib/utils/aggregate-orgaos'
import { ImpactGenerator } from './_components/impact-generator'

export const revalidate = 300

export default async function GeradorPage() {
  const currentYear = new Date().getFullYear()

  const [spendingSummary, contractsResult] = await Promise.all([
    getSpendingData(currentYear),
    getRecentContracts(90),
  ])

  const topOrgaos = aggregateByOrgaoSuperior(spendingSummary.porOrgao)
    .slice(0, 4)
    .map((o) => ({
      label: o.shortName,
      value: o.pago,
      formatted: humanizeNumber(o.pago),
    }))

  const topContracts = [...contractsResult.data]
    .sort((a, b) => b.valorFinalCompra - a.valorFinalCompra)
    .slice(0, 3)
    .map((c) => ({
      label: c.compra?.objeto ?? 'Contrato Federal',
      value: c.valorFinalCompra,
      formatted: formatBRL(c.valorFinalCompra),
      orgao: c.unidadeGestora?.orgaoVinculado?.nome ?? '',
    }))

  return (
    <div className="pt-4 pb-12 lg:pl-8 px-4 md:px-8">
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-secondary-container flex items-center justify-center">
            <MaterialIcon icon="bolt" size={28} className="text-on-secondary-container" />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter font-headline">
              GERADOR DE IMPACTO
            </h1>
            <p className="text-sm font-label uppercase tracking-widest text-on-surface-variant">
              Transforme gastos publicos em comparacoes que todo mundo entende
            </p>
          </div>
        </div>
        <p className="text-base font-body text-on-surface-variant max-w-2xl mt-4">
          Escolha um gasto real do governo ou digite um valor, e veja o que esse
          dinheiro poderia comprar. Baixe a imagem ou compartilhe no WhatsApp.
        </p>
      </section>

      <ImpactGenerator
        realOrgaos={topOrgaos}
        realContracts={topContracts}
      />
    </div>
  )
}
