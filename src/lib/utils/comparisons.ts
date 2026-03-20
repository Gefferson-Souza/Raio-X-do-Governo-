import { humanizeCount } from './format'
import { REFERENCES } from './constants'

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
      value: Math.floor(v / REFERENCES.escolaFNDE),
      label: 'ESCOLAS PODERIAM SER CONSTRUIDAS',
      desc: `Cada escola FNDE custa R$ ${(REFERENCES.escolaFNDE / 1_000_000).toFixed(0)} milhoes`,
    }),
  },
  {
    icon: 'vaccines',
    borderColor: 'border-primary',
    bgColor: 'bg-primary',
    iconTextColor: 'text-on-primary',
    compute: (v: number) => ({
      value: Math.floor(v / REFERENCES.merenda),
      label: 'DOSES DE VACINA',
      desc: `Cada dose custa em media R$ ${REFERENCES.merenda.toFixed(2).replace('.', ',')} para o SUS`,
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
      value: Math.floor(v / REFERENCES.consultaSUS),
      label: 'CONSULTAS MEDICAS NO SUS',
      desc: `Cada consulta custa R$ ${REFERENCES.consultaSUS.toFixed(0)} na tabela SUS`,
    }),
  },
  {
    icon: 'home',
    borderColor: 'border-secondary',
    bgColor: 'bg-secondary-container',
    iconTextColor: 'text-on-secondary-container',
    compute: (v: number) => ({
      value: Math.floor(v / REFERENCES.casaPopular),
      label: 'CASAS POPULARES',
      desc: `Cada casa do Minha Casa Minha Vida custa R$ ${(REFERENCES.casaPopular / 1_000).toFixed(0)} mil`,
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
      value: Math.floor(v / REFERENCES.salarioMinimo),
      label: 'SALARIOS MINIMOS',
      desc: `Salario minimo de R$ ${REFERENCES.salarioMinimo.toLocaleString('pt-BR')}`,
    }),
  },
  {
    icon: 'restaurant',
    borderColor: 'border-error',
    bgColor: 'bg-error',
    iconTextColor: 'text-on-error',
    compute: (v: number) => ({
      value: Math.floor(v / REFERENCES.cestaBasica),
      label: 'CESTAS BASICAS',
      desc: `Cada cesta basica custa R$ ${REFERENCES.cestaBasica.toFixed(0)} (media DIEESE)`,
    }),
  },
] as const

/**
 * Deterministic pseudo-random number from a seed.
 * Same seed always produces the same result on server and client.
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

/**
 * Picks `count` comparisons deterministically seeded by the spending total.
 * Same total = same picks on server and client (no hydration mismatch).
 */
export function pickRandomComparisons(total: number, count: number = 2): readonly Comparison[] {
  const seed = Math.floor(total / 1_000_000)
  const indices = COMPARISON_POOL.map((_, i) => i)

  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i) * (i + 1))
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }

  const picked = indices.slice(0, count)

  return picked.map((idx) => {
    const def = COMPARISON_POOL[idx]
    const result = def.compute(total)
    return {
      icon: def.icon,
      value: humanizeCount(result.value),
      label: result.label,
      desc: result.desc,
      borderColor: def.borderColor,
      bgColor: def.bgColor,
      iconTextColor: def.iconTextColor,
    }
  })
}
