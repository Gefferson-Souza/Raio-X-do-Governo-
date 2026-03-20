import { MaterialIcon } from '@/components/icons/material-icon'

const BADGE_STYLES: Record<string, string> = {
  VERIFICADO: 'bg-secondary-container text-on-secondary-container',
  'CONTRATO ATIVO': 'bg-tertiary-container text-on-tertiary-container',
  'DENÚNCIA': 'bg-error-container text-on-error-container',
  VAZAMENTO: 'bg-error text-on-error',
  SUPERFATURADO: 'bg-error-container text-on-error-container',
  EXTERNO: 'bg-surface-container-high text-on-surface-variant',
}

const CART_ITEMS = [
  {
    title: 'Lagostas e Vinhos de Reserva',
    description:
      'Compra recorrente de lagostas, vinhos importados e cortes nobres para eventos oficiais em gabinetes ministeriais.',
    costLabel: 'R$ 2.400,00',
    costUnit: '/unidade',
    equivalence: '1 JANTA = 12 CESTAS BÁSICAS',
    badge: 'VERIFICADO',
    icon: 'restaurant',
  },
  {
    title: 'Sofá de Veludo de Grife',
    description:
      'Aquisição de mobiliário italiano de luxo para salas de reunião em órgãos federais com dispensa de licitação.',
    costLabel: 'R$ 65.000,00',
    costUnit: '/unidade',
    equivalence: '1 SOFÁ = 260 CONSULTAS SUS',
    badge: 'CONTRATO ATIVO',
    icon: 'chair',
  },
  {
    title: 'Canetas Tinteiro Ouro 18k',
    description:
      'Canetas banhadas a ouro com gravação personalizada para cerimoniais de assinatura de atos oficiais.',
    costLabel: 'R$ 12.800,00',
    costUnit: '/unidade',
    equivalence: '1 CANETA = 80 KITS ESCOLARES',
    badge: 'DENÚNCIA',
    icon: 'edit',
  },
  {
    title: 'Fretamento de Jato Executivo',
    description:
      'Fretamento de aeronaves particulares para deslocamento de autoridades em trechos com voos comerciais disponíveis.',
    costLabel: 'R$ 180.000,00',
    costUnit: '/hora',
    equivalence: '1 VOO = 1 AMBULÂNCIA NOVA',
    badge: 'VAZAMENTO',
    icon: 'flight',
  },
  {
    title: 'Reforma de Banheiro Carrara',
    description:
      'Reforma completa com mármore carrara importado, louças de design europeu e metais banhados a ouro.',
    costLabel: 'R$ 420.000,00',
    costUnit: '',
    equivalence: '1 REFORMA = 12 CASAS POPULARES',
    badge: 'SUPERFATURADO',
    icon: 'bathroom',
  },
  {
    title: 'Cafeteira Profissional Suíça',
    description:
      'Equipamento profissional de preparo de café com cápsulas importadas e contrato de manutenção premium.',
    costLabel: 'R$ 28.500,00',
    costUnit: '/unidade',
    equivalence: '1 CAFÉ = 5600 MERENDAS ESCOLARES',
    badge: 'EXTERNO',
    icon: 'coffee',
  },
] as const

export default function CarrinhoPage() {
  return (
    <div className="pb-12 lg:pl-8 px-4 md:px-8">
      <section className="bg-primary-container p-8 md:p-12">
        <span className="inline-block bg-on-primary-container text-primary-container font-label text-xs font-bold uppercase tracking-widest px-4 py-1 mb-6">
          Arquivo Confidencial: #882-G
        </span>
        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter font-headline text-on-primary-container">
          CARRINHO DE COMPRAS DO GOVERNO
        </h1>
        <p className="mt-4 text-lg font-body text-on-primary-container/80 max-w-3xl">
          Auditoria cidadã dos itens de luxo adquiridos com dinheiro público.
          Cada produto aqui foi comprado pelo governo federal e está registrado
          no Portal da Transparência ou no Diário Oficial da União.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-0">
        <div className="p-6 bg-emerald-900">
          <span className="block text-xs uppercase tracking-widest font-label text-yellow-400">
            Total em Luxos
          </span>
          <span className="block text-3xl font-black tracking-tighter font-headline text-white">
            R$ 4.298.400,00
          </span>
        </div>
        <div className="p-6 bg-yellow-400">
          <span className="block text-xs uppercase tracking-widest font-label text-emerald-950">
            Itens de Ostentação
          </span>
          <span className="block text-3xl font-black tracking-tighter font-headline text-emerald-950">
            142 UNIDADES
          </span>
        </div>
        <div className="p-6 bg-surface-container-highest">
          <span className="block text-xs uppercase tracking-widest font-label text-on-surface-variant">
            Média de Superfaturamento
          </span>
          <span className="block text-3xl font-black tracking-tighter font-headline text-error">
            +420% ACIMA DO MERCADO
          </span>
        </div>
      </section>

      <section className="mt-12">
        <div className="grid gap-8" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {CART_ITEMS.map((item) => (
            <div
              key={item.title}
              className="relative bg-white border-b-[8px] border-primary hard-shadow flex flex-col"
            >
              <span
                className={`absolute top-3 right-3 z-10 font-label text-xs font-black uppercase px-3 py-1 ${BADGE_STYLES[item.badge]}`}
              >
                {item.badge}
              </span>

              <div className="h-48 overflow-hidden bg-surface-container-high flex items-center justify-center">
                <MaterialIcon
                  icon={item.icon}
                  size={64}
                  className="text-on-surface-variant/40"
                />
              </div>

              <div className="p-6 flex flex-col gap-4 flex-1">
                <h3 className="font-headline font-black text-2xl uppercase">
                  {item.title}
                </h3>
                <p className="font-body text-sm text-on-surface-variant">
                  {item.description}
                </p>

                <div className="bg-surface-container-low p-4 mt-auto">
                  <span className="block text-xs uppercase tracking-widest font-label text-on-surface-variant">
                    Custo por Unidade
                  </span>
                  <span className="block text-2xl font-black font-headline text-error">
                    {item.costLabel}
                    {item.costUnit && (
                      <span className="text-sm font-normal text-on-surface-variant">
                        {item.costUnit}
                      </span>
                    )}
                  </span>
                </div>

                <div className="bg-secondary-container p-4">
                  <span className="block text-xs uppercase tracking-widest font-label text-on-secondary-container">
                    O QUE ISSO COMPRA?
                  </span>
                  <span className="block text-base font-bold font-headline text-on-secondary-container">
                    {item.equivalence}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="text-center mt-20">
        <h2 className="text-3xl font-black uppercase font-headline text-on-surface mb-4">
          Viu algo suspeito no diário oficial?
        </h2>
        <p className="text-on-surface-variant font-body mb-8 max-w-xl mx-auto">
          Denuncie gastos abusivos ou compartilhe esta investigação para que
          mais brasileiros tenham acesso à verdade.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/denunciar"
            className="inline-flex items-center gap-2 bg-error text-on-error font-label font-bold uppercase tracking-wider px-8 py-4 hover:opacity-90 transition-opacity"
          >
            <MaterialIcon icon="campaign" size={20} />
            DENUNCIAR GASTO
          </a>
          <a
            href="#compartilhar"
            className="inline-flex items-center gap-2 bg-secondary-container text-on-secondary-container font-label font-bold uppercase tracking-wider px-8 py-4 hover:opacity-90 transition-opacity"
          >
            <MaterialIcon icon="share" size={20} />
            COMPARTILHAR O ESCÂNDALO
          </a>
        </div>
        <p className="mt-8 text-xs font-label text-on-surface-variant uppercase tracking-widest">
          Fonte: Portal da Transparência & Diário Oficial da União
        </p>
      </section>
    </div>
  )
}
