export interface DespesaPorOrgaoRaw {
  ano: number
  orgao: string
  codigoOrgao: string
  orgaoSuperior: string
  codigoOrgaoSuperior: string
  empenhado: string
  liquidado: string
  pago: string
}

export interface DespesaPorOrgao {
  ano: number
  orgao: string
  codigoOrgao: string
  orgaoSuperior: string
  codigoOrgaoSuperior: string
  empenhado: number
  liquidado: number
  pago: number
}

export interface Contrato {
  id: number
  numero: string
  objeto: string
  situacaoContrato: string
  dataAssinatura: string
  dataFimVigencia: string
  dataInicioVigencia: string
  compra: {
    numero: string
    objeto: string
  }
  fornecedor: {
    id: number
    nome: string
    cnpjFormatado: string
    tipo: string
  }
  unidadeGestora: {
    codigo: string
    nome: string
    orgaoVinculado: {
      nome: string
      sigla: string
    }
    orgaoMaximo: {
      codigo: string
      nome: string
      sigla: string
    }
  }
  valorInicialCompra: number
  valorFinalCompra: number
}

export interface EmpresaSancionada {
  id: number
  dataInicioSancao: string
  dataFimSancao: string
  orgaoSancionador: {
    nome: string
  }
  sancionado: {
    cnpjCpf: string
    nome: string
  }
  tipoSancao: {
    descricaoResumida: string
  }
}

export interface EmendaParlamentar {
  codigoEmenda: string
  ano: number
  tipoEmenda: string
  autor: string
  localidadeDoGasto: string
  funcaoEmenda: string
  subfuncaoEmenda: string
  valorEmpenhado: number
  valorLiquidado: number
  valorPago: number
}

export interface ViagemOficial {
  id: number
  situacao: string
  viajante: string
  cargo: string
  orgaoSuperior: string
  dataInicio: string
  dataFim: string
  destinos: string
  motivo: string
  valorPassagens: number
  valorDiarias: number
  valorTotal: number
}

export interface CartaoPagamento {
  id: number
  cpfPortador: string
  nomePortador: string
  unidadeGestora: string
  orgaoSuperior: string
  dataTransacao: string
  valorTransacao: number
  tipoCartao: string
}

export interface ServidorRemuneracao {
  id: number
  nome: string
  cpf: string
  orgaoServidorExercicio: string
  orgaoSuperiorServidorExercicio: string
  funcao: string
  cargo: string
  remuneracaoBasicaBruta: number
  gratificacaoNatalina: number
  ferias: number
  outrasRemuneracoes: number
  irrf: number
  pssSeguridadeSocial: number
  demaisDeducoes: number
  remuneracaoAposDeducoes: number
  mesAno: string
}

export interface SpendingSummary {
  totalPago: number
  totalEmpenhado: number
  totalLiquidado: number
  porOrgao: DespesaPorOrgao[]
  atualizadoEm: string
  source: 'live' | 'cached' | 'error'
}
