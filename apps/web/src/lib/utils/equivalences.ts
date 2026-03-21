import { REFERENCES } from './constants'

export interface Equivalences {
  readonly salariosMinimos: number
  readonly cestasBasicas: number
  readonly escolasFNDE: number
  readonly kitsEscolares: number
  readonly consultasSUS: number
  readonly ambulanciasUTI: number
  readonly respiradoresUTI: number
  readonly merendas: number
  readonly casasPopulares: number
  readonly cirurgiasCardiacas: number
  readonly perCapita: number
}

const ZERO_EQUIVALENCES: Equivalences = {
  salariosMinimos: 0,
  cestasBasicas: 0,
  escolasFNDE: 0,
  kitsEscolares: 0,
  consultasSUS: 0,
  ambulanciasUTI: 0,
  respiradoresUTI: 0,
  merendas: 0,
  casasPopulares: 0,
  cirurgiasCardiacas: 0,
  perCapita: 0,
}

export function convertToEquivalences(valor: number): Equivalences {
  if (valor <= 0) {
    return ZERO_EQUIVALENCES
  }

  return {
    salariosMinimos: Math.floor(valor / REFERENCES.salarioMinimo),
    cestasBasicas: Math.floor(valor / REFERENCES.cestaBasica),
    escolasFNDE: Math.floor(valor / REFERENCES.escolaFNDE),
    kitsEscolares: Math.floor(valor / REFERENCES.kitEscolar),
    consultasSUS: Math.floor(valor / REFERENCES.consultaSUS),
    ambulanciasUTI: Math.floor(valor / REFERENCES.ambulanciaUTI),
    respiradoresUTI: Math.floor(valor / REFERENCES.respiradorUTI),
    merendas: Math.floor(valor / REFERENCES.merenda),
    casasPopulares: Math.floor(valor / REFERENCES.casaPopular),
    cirurgiasCardiacas: Math.floor(valor / REFERENCES.cirurgiaCardiaca),
    perCapita: Number((valor / REFERENCES.populacaoBR).toFixed(4)),
  }
}
