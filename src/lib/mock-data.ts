import type { Contrato, DespesaPorOrgao, SpendingSummary } from './api/types'

const MOCK_ORGAOS: readonly DespesaPorOrgao[] = [
  {
    ano: 2026,
    codigoOrgaoSuperior: '52000',
    nomeOrgaoSuperior: 'MINISTERIO DA DEFESA',
    codigoOrgao: '52131',
    nomeOrgao: 'MINISTERIO DA DEFESA',
    valorEmpenhado: 420_000_000,
    valorLiquidado: 380_000_000,
    valorPago: 356_200_000,
    valorRestoInscrito: 12_000_000,
    valorRestoPago: 8_400_000,
  },
  {
    ano: 2026,
    codigoOrgaoSuperior: '26000',
    nomeOrgaoSuperior: 'MINISTERIO DA EDUCACAO',
    codigoOrgao: '26101',
    nomeOrgao: 'MINISTERIO DA EDUCACAO',
    valorEmpenhado: 380_000_000,
    valorLiquidado: 340_000_000,
    valorPago: 312_500_000,
    valorRestoInscrito: 18_000_000,
    valorRestoPago: 11_200_000,
  },
  {
    ano: 2026,
    codigoOrgaoSuperior: '36000',
    nomeOrgaoSuperior: 'MINISTERIO DA SAUDE',
    codigoOrgao: '36901',
    nomeOrgao: 'MINISTERIO DA SAUDE',
    valorEmpenhado: 520_000_000,
    valorLiquidado: 465_000_000,
    valorPago: 428_100_000,
    valorRestoInscrito: 22_000_000,
    valorRestoPago: 14_800_000,
  },
  {
    ano: 2026,
    codigoOrgaoSuperior: '20000',
    nomeOrgaoSuperior: 'PRESIDENCIA DA REPUBLICA',
    codigoOrgao: '20101',
    nomeOrgao: 'PRESIDENCIA DA REPUBLICA',
    valorEmpenhado: 185_000_000,
    valorLiquidado: 162_000_000,
    valorPago: 148_300_000,
    valorRestoInscrito: 8_500_000,
    valorRestoPago: 5_200_000,
  },
  {
    ano: 2026,
    codigoOrgaoSuperior: '56000',
    nomeOrgaoSuperior: 'MINISTERIO DA INFRAESTRUTURA',
    codigoOrgao: '56101',
    nomeOrgao: 'MINISTERIO DA INFRAESTRUTURA',
    valorEmpenhado: 290_000_000,
    valorLiquidado: 248_000_000,
    valorPago: 225_600_000,
    valorRestoInscrito: 15_000_000,
    valorRestoPago: 9_800_000,
  },
  {
    ano: 2026,
    codigoOrgaoSuperior: '54000',
    nomeOrgaoSuperior: 'MINISTERIO DO TURISMO',
    codigoOrgao: '54101',
    nomeOrgao: 'MINISTERIO DO TURISMO',
    valorEmpenhado: 98_000_000,
    valorLiquidado: 85_000_000,
    valorPago: 78_400_000,
    valorRestoInscrito: 4_200_000,
    valorRestoPago: 2_800_000,
  },
  {
    ano: 2026,
    codigoOrgaoSuperior: '25000',
    nomeOrgaoSuperior: 'MINISTERIO DA FAZENDA',
    codigoOrgao: '25101',
    nomeOrgao: 'MINISTERIO DA FAZENDA',
    valorEmpenhado: 340_000_000,
    valorLiquidado: 298_000_000,
    valorPago: 272_800_000,
    valorRestoInscrito: 16_000_000,
    valorRestoPago: 10_600_000,
  },
  {
    ano: 2026,
    codigoOrgaoSuperior: '30000',
    nomeOrgaoSuperior: 'MINISTERIO DA JUSTICA E SEGURANCA PUBLICA',
    codigoOrgao: '30101',
    nomeOrgao: 'MINISTERIO DA JUSTICA E SEGURANCA PUBLICA',
    valorEmpenhado: 210_000_000,
    valorLiquidado: 185_000_000,
    valorPago: 168_200_000,
    valorRestoInscrito: 9_800_000,
    valorRestoPago: 6_400_000,
  },
] as const

const MOCK_CONTRATOS: readonly Contrato[] = [
  {
    id: 88201,
    dataAssinatura: '2026-03-10',
    dataFimVigencia: '2026-12-31',
    dataInicioVigencia: '2026-03-15',
    dimCompra: {
      numero: '00012/2026',
      objeto: 'SERVICOS DE TRANSPORTE AEREO PARA COMITIVA PRESIDENCIAL - VIAGENS NACIONAIS E INTERNACIONAIS',
    },
    fornecedor: {
      cnpjCpf: '12.345.678/0001-90',
      nome: 'AEROSERVICE TRANSPORTES EXECUTIVOS LTDA',
    },
    unidadeGestora: {
      codigo: '110001',
      nome: 'PRESIDENCIA DA REPUBLICA',
      orgaoVinculado: {
        codigo: '20000',
        nome: 'PRESIDENCIA DA REPUBLICA',
      },
    },
    valorFinal: 4_800_000,
    valorInicial: 3_200_000,
  },
  {
    id: 88202,
    dataAssinatura: '2026-03-05',
    dataFimVigencia: '2027-03-05',
    dataInicioVigencia: '2026-03-10',
    dimCompra: {
      numero: '00045/2026',
      objeto: 'AQUISICAO DE MOBILIARIO DE ALTO PADRAO PARA GABINETES MINISTERIAIS',
    },
    fornecedor: {
      cnpjCpf: '98.765.432/0001-10',
      nome: 'MOVEIS LUXO CORPORATIVO S.A.',
    },
    unidadeGestora: {
      codigo: '110002',
      nome: 'MINISTERIO DA DEFESA',
      orgaoVinculado: {
        codigo: '52000',
        nome: 'MINISTERIO DA DEFESA',
      },
    },
    valorFinal: 2_150_000,
    valorInicial: 1_400_000,
  },
  {
    id: 88203,
    dataAssinatura: '2026-03-01',
    dataFimVigencia: '2026-09-01',
    dataInicioVigencia: '2026-03-05',
    dimCompra: {
      numero: '00078/2026',
      objeto: 'SERVICO DE BUFFET E ALIMENTACAO PARA EVENTOS OFICIAIS E RECEPCOES DIPLOMATICAS',
    },
    fornecedor: {
      cnpjCpf: '45.678.901/0001-23',
      nome: 'GOURMET EVENTS CERIMONIAL EIRELI',
    },
    unidadeGestora: {
      codigo: '110003',
      nome: 'MINISTERIO DAS RELACOES EXTERIORES',
      orgaoVinculado: {
        codigo: '35000',
        nome: 'MINISTERIO DAS RELACOES EXTERIORES',
      },
    },
    valorFinal: 1_890_000,
    valorInicial: 1_200_000,
  },
  {
    id: 88204,
    dataAssinatura: '2026-02-20',
    dataFimVigencia: '2027-02-20',
    dataInicioVigencia: '2026-03-01',
    dimCompra: {
      numero: '00091/2026',
      objeto: 'LOCACAO DE VEICULOS BLINDADOS COM MOTORISTA PARA SEGURANCA DE AUTORIDADES',
    },
    fornecedor: {
      cnpjCpf: '33.444.555/0001-66',
      nome: 'BLINDACAR SEGURANCA AUTOMOTIVA LTDA',
    },
    unidadeGestora: {
      codigo: '110004',
      nome: 'GABINETE DE SEGURANCA INSTITUCIONAL',
      orgaoVinculado: {
        codigo: '20000',
        nome: 'PRESIDENCIA DA REPUBLICA',
      },
    },
    valorFinal: 3_400_000,
    valorInicial: 2_600_000,
  },
  {
    id: 88205,
    dataAssinatura: '2026-03-12',
    dataFimVigencia: '2026-12-31',
    dataInicioVigencia: '2026-03-15',
    dimCompra: {
      numero: '00103/2026',
      objeto: 'CONSULTORIA EM COMUNICACAO INSTITUCIONAL E GESTAO DE IMAGEM GOVERNAMENTAL',
    },
    fornecedor: {
      cnpjCpf: '77.888.999/0001-44',
      nome: 'MIDIA FORTE COMUNICACAO ESTRATEGICA S.A.',
    },
    unidadeGestora: {
      codigo: '110005',
      nome: 'SECRETARIA ESPECIAL DE COMUNICACAO SOCIAL',
      orgaoVinculado: {
        codigo: '20000',
        nome: 'PRESIDENCIA DA REPUBLICA',
      },
    },
    valorFinal: 5_200_000,
    valorInicial: 3_800_000,
  },
  {
    id: 88206,
    dataAssinatura: '2026-03-08',
    dataFimVigencia: '2027-03-08',
    dataInicioVigencia: '2026-03-10',
    dimCompra: {
      numero: '00120/2026',
      objeto: 'REFORMA E ADEQUACAO DE ESPACOS FISICOS EM EDIFICIOS PUBLICOS FEDERAIS',
    },
    fornecedor: {
      cnpjCpf: '22.333.444/0001-55',
      nome: 'CONSTRUTORA FEDERAL OBRAS ESPECIAIS LTDA',
    },
    unidadeGestora: {
      codigo: '110006',
      nome: 'MINISTERIO DA INFRAESTRUTURA',
      orgaoVinculado: {
        codigo: '56000',
        nome: 'MINISTERIO DA INFRAESTRUTURA',
      },
    },
    valorFinal: 8_700_000,
    valorInicial: 6_100_000,
  },
] as const

function computeTotals(orgaos: readonly DespesaPorOrgao[]): {
  readonly totalPago: number
  readonly totalEmpenhado: number
  readonly totalLiquidado: number
} {
  return orgaos.reduce(
    (acc, item) => ({
      totalPago: acc.totalPago + item.valorPago,
      totalEmpenhado: acc.totalEmpenhado + item.valorEmpenhado,
      totalLiquidado: acc.totalLiquidado + item.valorLiquidado,
    }),
    { totalPago: 0, totalEmpenhado: 0, totalLiquidado: 0 },
  )
}

const totals = computeTotals(MOCK_ORGAOS)

export const mockSpendingSummary: SpendingSummary = {
  totalPago: totals.totalPago,
  totalEmpenhado: totals.totalEmpenhado,
  totalLiquidado: totals.totalLiquidado,
  porOrgao: [...MOCK_ORGAOS],
  atualizadoEm: new Date().toISOString(),
}

export const mockContratos: readonly Contrato[] = MOCK_CONTRATOS
