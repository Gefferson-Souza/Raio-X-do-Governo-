import { humanizeNumber } from './format'

export interface Comparison {
  readonly icon: string
  readonly value: string
  readonly label: string
  readonly desc: string
  readonly borderColor: string
  readonly bgColor: string
  readonly iconTextColor: string
}

interface ComparisonDef {
  readonly icon: string
  readonly borderColor: string
  readonly bgColor: string
  readonly iconTextColor: string
  readonly compute: (value: number) => {
    readonly value: number
    readonly label: string
    readonly desc: string
  }
}

const COMPARISON_POOL: readonly ComparisonDef[] = [
  {
    icon: 'school',
    borderColor: 'border-error',
    bgColor: 'bg-error',
    iconTextColor: 'text-on-error',
    compute: (v: number) => ({
      value: Math.floor(v / 5_000_000),
      label: 'ESCOLAS PODERIAM SER CONSTRUIDAS',
      desc: 'Cada escola FNDE custa R$ 5 milhoes',
    }),
  },
  {
    icon: 'vaccines',
    borderColor: 'border-primary',
    bgColor: 'bg-primary',
    iconTextColor: 'text-on-primary',
    compute: (v: number) => ({
      value: Math.floor(v / 0.50),
      label: 'DOSES DE VACINA',
      desc: 'Cada dose custa em media R$ 0,50 para o SUS',
    }),
  },
  {
    icon: 'directions_bus',
    borderColor: 'border-secondary',
    bgColor: 'bg-secondary-container',
    iconTextColor: 'text-on-secondary-container',
    compute: (v: number) => ({
      value: Math.floor(v / 800_000),
      label: 'ONIBUS NOVOS',
      desc: 'Cada onibus urbano custa R$ 800 mil',
    }),
  },
  {
    icon: 'water_drop',
    borderColor: 'border-primary',
    bgColor: 'bg-primary',
    iconTextColor: 'text-on-primary',
    compute: (v: number) => ({
      value: Math.floor(v / 3_000),
      label: 'FAMILIAS COM AGUA TRATADA POR 1 ANO',
      desc: 'Custo anual de saneamento por domicilio',
    }),
  },
  {
    icon: 'local_hospital',
    borderColor: 'border-error',
    bgColor: 'bg-error',
    iconTextColor: 'text-on-error',
    compute: (v: number) => ({
      value: Math.floor(v / 10),
      label: 'CONSULTAS MEDICAS NO SUS',
      desc: 'Cada consulta custa R$ 10 na tabela SUS',
    }),
  },
  {
    icon: 'home',
    borderColor: 'border-secondary',
    bgColor: 'bg-secondary-container',
    iconTextColor: 'text-on-secondary-container',
    compute: (v: number) => ({
      value: Math.floor(v / 270_000),
      label: 'CASAS POPULARES',
      desc: 'Cada casa do Minha Casa Minha Vida custa R$ 270 mil',
    }),
  },
  {
    icon: 'sports_soccer',
    borderColor: 'border-tertiary',
    bgColor: 'bg-tertiary-container',
    iconTextColor: 'text-on-tertiary-container',
    compute: (v: number) => ({
      value: Math.floor(v / 15_000_000),
      label: 'QUADRAS ESPORTIVAS',
      desc: 'Cada quadra poliesportiva custa R$ 15 milhoes',
    }),
  },
  {
    icon: 'wifi',
    borderColor: 'border-primary',
    bgColor: 'bg-primary',
    iconTextColor: 'text-on-primary',
    compute: (v: number) => ({
      value: Math.floor(v / 50_000),
      label: 'ESCOLAS COM INTERNET POR 1 ANO',
      desc: 'Custo de conectar uma escola rural a internet por 1 ano',
    }),
  },
  {
    icon: 'payments',
    borderColor: 'border-tertiary',
    bgColor: 'bg-tertiary-container',
    iconTextColor: 'text-on-tertiary-container',
    compute: (v: number) => ({
      value: Math.floor(v / 1_621),
      label: 'SALARIOS MINIMOS',
      desc: 'Salario minimo de R$ 1.621 em 2026',
    }),
  },
  {
    icon: 'restaurant',
    borderColor: 'border-error',
    bgColor: 'bg-error',
    iconTextColor: 'text-on-error',
    compute: (v: number) => ({
      value: Math.floor(v / 680),
      label: 'CESTAS BASICAS',
      desc: 'Cada cesta basica custa R$ 680 (media DIEESE)',
    }),
  },
] as const

/**
 * Picks `count` random comparisons from the pool and computes values
 * based on the spending total. Uses Math.random() which on the server
 * side (ISR with revalidate=300) gives new picks every 5 minutes.
 */
export function pickRandomComparisons(total: number, count: number = 2): readonly Comparison[] {
  const shuffled = [...COMPARISON_POOL].sort(() => Math.random() - 0.5)
  const picked = shuffled.slice(0, count)

  return picked.map((def) => {
    const result = def.compute(total)
    return {
      icon: def.icon,
      value: humanizeNumber(result.value),
      label: result.label,
      desc: result.desc,
      borderColor: def.borderColor,
      bgColor: def.bgColor,
      iconTextColor: def.iconTextColor,
    }
  })
}
