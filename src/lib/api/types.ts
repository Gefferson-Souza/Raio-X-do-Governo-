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

export interface SpendingSummary {
  totalPago: number
  totalEmpenhado: number
  totalLiquidado: number
  porOrgao: DespesaPorOrgao[]
  atualizadoEm: string
  source: 'live' | 'cached' | 'error'
}
