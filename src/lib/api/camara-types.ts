export interface DeputadoRaw {
  readonly id: number
  readonly nome: string
  readonly siglaPartido: string
  readonly siglaUf: string
  readonly urlFoto: string
  readonly email: string | null
}

export interface DespesaDeputadoRaw {
  readonly ano: number
  readonly mes: number
  readonly tipoDespesa: string
  readonly valorDocumento: number
  readonly valorLiquido: number
  readonly nomeFornecedor: string
  readonly cnpjCpfFornecedor: string
}

export interface DeputadoRanking {
  readonly id: number
  readonly nome: string
  readonly partido: string
  readonly uf: string
  readonly foto: string
  readonly totalGasto: number
  readonly topDespesas: readonly { readonly tipo: string; readonly total: number }[]
}

export interface EmendaResumo {
  readonly autor: string
  readonly totalPago: number
  readonly totalEmpenhado: number
  readonly quantidade: number
}

export interface ViagemResumo {
  readonly viajante: string
  readonly cargo: string
  readonly orgao: string
  readonly destino: string
  readonly motivo: string
  readonly valorTotal: number
  readonly dataInicio: string
}

export interface CartaoResumo {
  readonly portador: string
  readonly orgao: string
  readonly totalGasto: number
  readonly transacoes: number
}

export interface ServidorTopRemuneracao {
  readonly nome: string
  readonly cargo: string
  readonly orgao: string
  readonly remuneracaoBruta: number
  readonly remuneracaoLiquida: number
}

export interface PeriodoData {
  readonly anoAtual: number
  readonly anoAnterior: number
}

export interface PoliticiansData {
  readonly periodo: PeriodoData
  readonly deputados: {
    readonly ranking: readonly DeputadoRanking[]
    readonly totalGasto: number
    readonly totalGastoAnoAnterior: number
  }
  readonly senadores: {
    readonly ranking: readonly SenadorRanking[]
    readonly porPartido: readonly PartidoResumo[]
    readonly totalGasto: number
    readonly totalGastoAnoAnterior: number
  }
  readonly emendas: {
    readonly topAutores: readonly EmendaResumo[]
    readonly totalPago: number
    readonly totalEmpenhado: number
    readonly totalPagoAnoAnterior: number
  }
  readonly viagens: {
    readonly recentes: readonly ViagemResumo[]
    readonly totalGasto: number
  }
  readonly cartoes: {
    readonly topPortadores: readonly CartaoResumo[]
    readonly totalGasto: number
  }
  readonly remuneracoes: {
    readonly topServidores: readonly ServidorTopRemuneracao[]
  }
  readonly atualizadoEm: string
  readonly status: 'ok' | 'partial' | 'error'
}

export interface SenadorRanking {
  readonly id: number
  readonly nome: string
  readonly partido: string
  readonly uf: string
  readonly foto: string
  readonly totalGasto: number
}

export interface PartidoResumo {
  readonly partido: string
  readonly totalGasto: number
  readonly quantidadeParlamentares: number
}
