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

export interface EmendaParlamentarRaw {
  codigoEmenda: string
  ano: number
  tipoEmenda: string
  autor: string
  nomeAutor: string
  localidadeDoGasto: string
  funcao: string
  subfuncao: string
  valorEmpenhado: string
  valorLiquidado: string
  valorPago: string
}

export interface ViagemOficialRaw {
  id: number
  situacao: string
  dataInicioAfastamento: string
  dataFimAfastamento: string
  valorTotalPassagem: number
  valorTotalDiarias: number
  valorTotalViagem: number
  beneficiario: {
    nome: string
  }
  cargo: {
    descricao: string
  }
  orgao: {
    orgaoMaximo: {
      nome: string
    }
  }
  viagem: {
    motivo: string
  }
}

export interface CartaoPagamentoRaw {
  id: number
  dataTransacao: string
  valorTransacao: string
  mesExtrato: string
  portador: {
    nome: string
    cpfFormatado: string
  }
  unidadeGestora: {
    orgaoMaximo: {
      nome: string
    }
  }
  tipoCartao: {
    descricao: string
  }
}

export interface SpendingSummary {
  totalPago: number
  totalEmpenhado: number
  totalLiquidado: number
  porOrgao: DespesaPorOrgao[]
  atualizadoEm: string
  source: 'live' | 'cached' | 'error'
}
