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
  dataAssinatura: string
  dataFimVigencia: string
  dataInicioVigencia: string
  dimCompra: {
    numero: string
    objeto: string
  }
  fornecedor: {
    cnpjCpf: string
    nome: string
  }
  unidadeGestora: {
    codigo: string
    nome: string
    orgaoVinculado: {
      codigo: string
      nome: string
    }
  }
  valorFinal: number
  valorInicial: number
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
