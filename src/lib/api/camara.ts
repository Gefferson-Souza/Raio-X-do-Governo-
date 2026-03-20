import type { DeputadoRaw, DespesaDeputadoRaw } from './camara-types'

const BASE_URL = 'https://dadosabertos.camara.leg.br/api/v2'
const DELAY_MS = 250

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function camaraGet<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`)
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v))
  }

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    throw new Error(`Camara API ${res.status}: ${res.statusText}`)
  }

  const json = await res.json()
  return json.dados as T
}

export async function fetchDeputados(): Promise<readonly DeputadoRaw[]> {
  return camaraGet<DeputadoRaw[]>('/deputados', {
    idLegislatura: 57,
    itens: 100,
    ordenarPor: 'nome',
    ordem: 'ASC',
  })
}

export async function fetchAllDeputados(): Promise<readonly DeputadoRaw[]> {
  const all: DeputadoRaw[] = []
  let page = 1

  while (true) {
    const batch = await camaraGet<DeputadoRaw[]>('/deputados', {
      idLegislatura: 57,
      itens: 100,
      pagina: page,
      ordenarPor: 'nome',
      ordem: 'ASC',
    })

    all.push(...batch)
    if (batch.length < 100) break
    page++
    await delay(DELAY_MS)
  }

  return all
}

export async function fetchDespesasDeputado(
  id: number,
  ano: number,
): Promise<readonly DespesaDeputadoRaw[]> {
  const all: DespesaDeputadoRaw[] = []
  let page = 1
  const maxPages = 5

  while (page <= maxPages) {
    const batch = await camaraGet<DespesaDeputadoRaw[]>(`/deputados/${id}/despesas`, {
      ano,
      itens: 100,
      pagina: page,
      ordenarPor: 'mes',
      ordem: 'DESC',
    })

    all.push(...batch)
    if (batch.length < 100) break
    page++
    await delay(DELAY_MS)
  }

  return all
}
