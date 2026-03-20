import { MaterialIcon } from '@/components/icons/material-icon'
import { ImpactGenerator } from './_components/impact-generator'

export default function GeradorPage() {
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
              Transforme gastos públicos em comparações que o povo entende
            </p>
          </div>
        </div>
        <p className="text-base font-body text-on-surface-variant max-w-2xl mt-4">
          Configure um gasto governamental e gere um card de impacto visual para
          compartilhar nas redes sociais. Mostre o que esse dinheiro poderia
          comprar para a população brasileira.
        </p>
      </section>

      <ImpactGenerator />
    </div>
  )
}
