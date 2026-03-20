export interface DespesaPorOrgao {
  ano: number
  codigoOrgaoSuperior: string
  nomeOrgaoSuperior: string
  codigoOrgao: string
  nomeOrgao: string
  valorEmpenhado: number
  valorLiquidado: number
  valorPago: number
  valorRestoInscrito: number
  valorRestoPago: number
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
}
