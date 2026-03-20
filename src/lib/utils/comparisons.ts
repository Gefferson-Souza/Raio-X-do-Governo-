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

// ─── Color themes ────────────────────────────────────────────────
// error     → saude, urgencia, alimentacao
// primary   → agua, conectividade, educacao
// secondary → transporte, infraestrutura
// tertiary  → cultura, esporte, seguranca

const COMPARISON_POOL: readonly ComparisonDef[] = [
  // ══════════════════════════════════════════════════════════════
  //  EDUCACAO
  // ══════════════════════════════════════════════════════════════
  {
    icon: 'school',
    borderColor: 'border-primary',
    bgColor: 'bg-primary',
    iconTextColor: 'text-on-primary',
    compute: (v) => ({
      value: Math.floor(v / REFERENCES.escolaFNDE),
      label: 'ESCOLAS PODERIAM SER CONSTRUIDAS',
      desc: 'Escola padrao FNDE com 6 salas e quadra — R$ 5 mi cada',
    }),
  },
  {
    icon: 'child_care',
    borderColor: 'border-primary',
    bgColor: 'bg-primary',
    iconTextColor: 'text-on-primary',
    compute: (v) => ({
      value: Math.floor(v / REFERENCES.crecheProInfancia),
      label: 'CRECHES PARA AS CRIANCAS DO BRASIL',
      desc: 'Creche ProInfancia FNDE custa R$ 2 mi — e tem fila de espera em todo lugar',
    }),
  },
  {
    icon: 'lunch_dining',
    borderColor: 'border-error',
    bgColor: 'bg-error',
    iconTextColor: 'text-on-error',
    compute: (v) => ({
      value: Math.floor(v / REFERENCES.merenda),
      label: 'REFEICOES DA MERENDA ESCOLAR',
      desc: 'Cada refeicao do PNAE custa R$ 0,57 — pra muita crianca e a unica do dia',
    }),
  },
  {
    icon: 'tablet_android',
    borderColor: 'border-primary',
    bgColor: 'bg-primary',
    iconTextColor: 'text-on-primary',
    compute: (v) => ({
      value: Math.floor(v / REFERENCES.tabletEscolar),
      label: 'TABLETS PARA ALUNOS DA REDE PUBLICA',
      desc: 'Cada tablet escolar custa R$ 900 em licitacao publica',
    }),
  },
  {
    icon: 'wifi',
    borderColor: 'border-primary',
    bgColor: 'bg-primary',
    iconTextColor: 'text-on-primary',
    compute: (v) => ({
      value: Math.floor(v / REFERENCES.wifiEscolar),
      label: 'ESCOLAS RURAIS COM INTERNET POR 1 ANO',
      desc: 'Conectar uma escola no interior custa R$ 50 mil/ano',
    }),
  },

  // ══════════════════════════════════════════════════════════════
  //  SAUDE
  // ══════════════════════════════════════════════════════════════
  {
    icon: 'local_hospital',
    borderColor: 'border-error',
    bgColor: 'bg-error',
    iconTextColor: 'text-on-error',
    compute: (v) => ({
      value: Math.floor(v / REFERENCES.consultaSUS),
      label: 'CONSULTAS MEDICAS NO SUS',
      desc: 'Cada consulta custa R$ 10 na tabela SUS — e a fila so cresce',
    }),
  },
  {
    icon: 'vaccines',
    borderColor: 'border-error',
    bgColor: 'bg-error',
    iconTextColor: 'text-on-error',
    compute: (v) => ({
      value: Math.floor(v / REFERENCES.vacinaSUS),
      label: 'DOSES DE VACINA NO SUS',
      desc: 'Cada dose custa em media R$ 50 pro SUS — de BCG a COVID',
    }),
  },
  {
    icon: 'ambulance',
    borderColor: 'border-error',
    bgColor: 'bg-error',
    iconTextColor: 'text-on-error',
    compute: (v) => ({
      value: Math.floor(v / REFERENCES.ambulanciaSAMU),
      label: 'AMBULANCIAS DO SAMU',
      desc: 'Cada ambulancia basica custa R$ 310 mil — Novo PAC 2024',
    }),
  },
  {
    icon: 'medical_services',
    borderColor: 'border-error',
    bgColor: 'bg-error',
    iconTextColor: 'text-on-error',
    compute: (v) => ({
      value: Math.floor(v / REFERENCES.ubsCompleta),
      label: 'POSTOS DE SAUDE (UBS) COMPLETOS',
      desc: 'Cada UBS com obra e equipamentos custa R$ 3 mi',
    }),
  },
  {
    icon: 'health_and_safety',
    borderColor: 'border-error',
    bgColor: 'bg-error',
    iconTextColor: 'text-on-error',
    compute: (v) => ({
      value: Math.floor(v / REFERENCES.equipeSaudeFamilia),
      label: 'EQUIPES SAUDE DA FAMILIA POR 1 ANO',
      desc: 'Cada equipe do PSF custa R$ 350 mil/ano — medico, enfermeiro e agentes',
    }),
  },

  // ══════════════════════════════════════════════════════════════
  //  MORADIA & INFRAESTRUTURA
  // ══════════════════════════════════════════════════════════════
  {
    icon: 'home',
    borderColor: 'border-secondary',
    bgColor: 'bg-secondary-container',
    iconTextColor: 'text-on-secondary-container',
    compute: (v) => ({
      value: Math.floor(v / REFERENCES.casaPopular),
      label: 'CASAS DO MINHA CASA MINHA VIDA',
      desc: 'Cada casa Faixa 1 custa R$ 270 mil — e o deficit habitacional so aumenta',
    }),
  },
  {
    icon: 'add_road',
    borderColor: 'border-secondary',
    bgColor: 'bg-secondary-container',
    iconTextColor: 'text-on-secondary-container',
    compute: (v) => ({
      value: Math.floor(v / REFERENCES.kmAsfalto),
      label: 'KM DE ASFALTO NOVO',
      desc: 'Cada km de pavimentacao custa R$ 1,2 milhao — e tem estrada de terra pra todo lado',
    }),
  },
  {
    icon: 'water_drop',
    borderColor: 'border-primary',
    bgColor: 'bg-primary',
    iconTextColor: 'text-on-primary',
    compute: (v) => ({
      value: Math.floor(v / REFERENCES.saneamentoAnual),
      label: 'FAMILIAS COM AGUA TRATADA POR 1 ANO',
      desc: 'Saneamento basico custa R$ 3 mil/ano por domicilio',
    }),
  },
  {
    icon: 'water',
    borderColor: 'border-primary',
    bgColor: 'bg-primary',
    iconTextColor: 'text-on-primary',
    compute: (v) => ({
      value: Math.floor(v / REFERENCES.cisterna),
      label: 'CISTERNAS NO SERTAO NORDESTINO',
      desc: 'Cada cisterna do Programa Cisternas custa so R$ 3.800 — e muda a vida de uma familia',
    }),
  },
  {
    icon: 'plumbing',
    borderColor: 'border-primary',
    bgColor: 'bg-primary',
    iconTextColor: 'text-on-primary',
    compute: (v) => ({
      value: Math.floor(v / REFERENCES.pocoArtesiano),
      label: 'POCOS ARTESIANOS EM COMUNIDADES RURAIS',
      desc: 'Cada poco custa R$ 35 mil — agua limpa pra quem nao tem',
    }),
  },

  // ══════════════════════════════════════════════════════════════
  //  TRANSPORTE
  // ══════════════════════════════════════════════════════════════
  {
    icon: 'directions_bus',
    borderColor: 'border-secondary',
    bgColor: 'bg-secondary-container',
    iconTextColor: 'text-on-secondary-container',
    compute: (v) => ({
      value: Math.floor(v / REFERENCES.onibusUrbano),
      label: 'ONIBUS URBANOS NOVOS',
      desc: 'Cada onibus custa R$ 800 mil — e o transporte publico ta caindo aos pedacos',
    }),
  },
  {
    icon: 'two_wheeler',
    borderColor: 'border-secondary',
    bgColor: 'bg-secondary-container',
    iconTextColor: 'text-on-secondary-container',
    compute: (v) => ({
      value: Math.floor(v / REFERENCES.motoCG160),
      label: 'MOTOS HONDA CG 160',
      desc: 'A CG, sonho do brasileiro, custa R$ 17 mil — a mais vendida do pais',
    }),
  },
  {
    icon: 'directions_car',
    borderColor: 'border-secondary',
    bgColor: 'bg-secondary-container',
    iconTextColor: 'text-on-secondary-container',
    compute: (v) => ({
      value: Math.floor(v / REFERENCES.carroPopular),
      label: 'CARROS POPULARES ZERO KM',
      desc: 'Um carro popular zero km custa R$ 76 mil — e o brasileiro financia em 60x',
    }),
  },

  // ══════════════════════════════════════════════════════════════
  //  SEGURANCA
  // ══════════════════════════════════════════════════════════════
  {
    icon: 'local_police',
    borderColor: 'border-tertiary',
    bgColor: 'bg-tertiary-container',
    iconTextColor: 'text-on-tertiary-container',
    compute: (v) => ({
      value: Math.floor(v / REFERENCES.viatura),
      label: 'VIATURAS POLICIAIS EQUIPADAS',
      desc: 'Cada viatura SUV equipada custa R$ 180 mil',
    }),
  },

  // ══════════════════════════════════════════════════════════════
  //  ESPORTE & CULTURA
  // ══════════════════════════════════════════════════════════════
  {
    icon: 'sports_soccer',
    borderColor: 'border-tertiary',
    bgColor: 'bg-tertiary-container',
    iconTextColor: 'text-on-tertiary-container',
    compute: (v) => ({
      value: Math.floor(v / REFERENCES.quadraPoliesportiva),
      label: 'QUADRAS POLIESPORTIVAS COBERTAS',
      desc: 'Cada quadra coberta padrao prefeitura custa R$ 800 mil',
    }),
  },
  {
    icon: 'sports',
    borderColor: 'border-tertiary',
    bgColor: 'bg-tertiary-container',
    iconTextColor: 'text-on-tertiary-container',
    compute: (v) => ({
      value: Math.floor(v / REFERENCES.campoSociety),
      label: 'CAMPOS DE FUTEBOL SOCIETY',
      desc: 'Campo com grama sintetica custa R$ 150 mil — pelada de fim de semana garantida',
    }),
  },

  // ══════════════════════════════════════════════════════════════
  //  CUSTO DE VIDA DO BRASILEIRO
  // ══════════════════════════════════════════════════════════════
  {
    icon: 'payments',
    borderColor: 'border-tertiary',
    bgColor: 'bg-tertiary-container',
    iconTextColor: 'text-on-tertiary-container',
    compute: (v) => ({
      value: Math.floor(v / REFERENCES.salarioMinimo),
      label: 'SALARIOS MINIMOS',
      desc: `Salario minimo de R$ ${REFERENCES.salarioMinimo.toLocaleString('pt-BR')} em 2026`,
    }),
  },
  {
    icon: 'restaurant',
    borderColor: 'border-error',
    bgColor: 'bg-error',
    iconTextColor: 'text-on-error',
    compute: (v) => ({
      value: Math.floor(v / REFERENCES.cestaBasica),
      label: 'CESTAS BASICAS',
      desc: 'Cesta basica DIEESE custa R$ 700 — o basico pra alimentar uma familia',
    }),
  },
  {
    icon: 'local_gas_station',
    borderColor: 'border-error',
    bgColor: 'bg-error',
    iconTextColor: 'text-on-error',
    compute: (v) => ({
      value: Math.floor(v / REFERENCES.botijaoGas),
      label: 'BOTIJOES DE GAS',
      desc: 'O botijao de 13kg custa R$ 110 — e tem brasileiro cozinhando na lenha',
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
  const safeCount = Math.min(count, COMPARISON_POOL.length)
  const seed = Math.floor(total / 1_000_000)
  const indices = COMPARISON_POOL.map((_, i) => i)

  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i) * (i + 1))
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }

  const picked: Comparison[] = []

  for (const idx of indices) {
    if (picked.length >= safeCount) break

    const def = COMPARISON_POOL[idx]
    const result = def.compute(total)

    if (result.value < 1) continue

    picked.push({
      icon: def.icon,
      value: humanizeCount(result.value),
      label: result.label,
      desc: result.desc,
      borderColor: def.borderColor,
      bgColor: def.bgColor,
      iconTextColor: def.iconTextColor,
    })
  }

  return picked
}
