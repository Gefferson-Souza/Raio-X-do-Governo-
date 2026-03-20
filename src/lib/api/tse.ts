const BASE_URL = 'https://divulgacandcontas.tse.jus.br/divulga/rest/v1'

export interface CandidatoTSE {
  readonly id: number
  readonly nomeUrna: string
  readonly nomeCompleto: string
  readonly numero: number
  readonly partido: { readonly sigla: string; readonly nome: string }
  readonly cargo: { readonly nome: string }
  readonly descricaoSituacao: string
  readonly fotoUrl: string
  readonly totalDeBens: number
}

export interface BemCandidato {
  readonly descricao: string
  readonly valor: number
}

export interface FinancaCampanha {
  readonly totalRecebido: number
  readonly totalGasto: number
  readonly fontes: readonly { readonly tipo: string; readonly valor: number }[]
}

async function tseGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    throw new Error(`TSE API ${res.status}: ${res.statusText}`)
  }

  return res.json() as Promise<T>
}

export async function fetchAnosEleitorais(): Promise<readonly number[]> {
  try {
    const data = await tseGet<{ readonly anos: readonly number[] }>('/eleicao/anos-eleitorais')
    return data.anos ?? []
  } catch {
    return []
  }
}

export async function fetchCandidatos(
  ano: number,
  cargo: number,
  siglaUf: string,
): Promise<readonly CandidatoTSE[]> {
  try {
    const data = await tseGet<{ readonly candidatos: readonly CandidatoTSE[] }>(
      `/candidatura/listar/${ano}/${siglaUf}/2/${cargo}/candidatos`,
    )
    return data.candidatos ?? []
  } catch {
    return []
  }
}
