import type { Contrato, DespesaPorOrgao, EmpresaSancionada, SpendingSummary } from './types'

const BASE_URL = 'https://api.portaldatransparencia.gov.br/api-de-dados'
const TIMEOUT_MS = 10_000
const MAX_RETRIES = 3
const INITIAL_BACKOFF_MS = 500

function getApiKey(): string {
  const key = process.env.TRANSPARENCY_API_KEY
  if (!key) {
    throw new Error(
      'TRANSPARENCY_API_KEY environment variable is not set. ' +
      'Get your key at https://portaldatransparencia.gov.br/api-de-dados/cadastrar-email'
    )
  }
  return key
}

async function fetchWithRetry(url: string, init: RequestInit): Promise<Response> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.status === 429 || response.status >= 500) {
        lastError = new Error(`HTTP ${response.status}: ${response.statusText}`)
        if (attempt < MAX_RETRIES - 1) {
          const backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt)
          await delay(backoff)
        }
        continue
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return response
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))

      const isNetworkError =
        err.name === 'AbortError' ||
        err.message.includes('fetch failed')

      if (!isNetworkError) {
        throw err
      }

      lastError = err
      if (attempt < MAX_RETRIES - 1) {
        const backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt)
        await delay(backoff)
      }
    }
  }

  throw new Error(`Request failed after ${MAX_RETRIES} retries: ${lastError?.message}`)
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function buildUrl(path: string, params: Record<string, string | number>): string {
  const url = new URL(`${BASE_URL}${path}`)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value))
  }
  return url.toString()
}

async function apiGet<T>(path: string, params: Record<string, string | number>): Promise<T> {
  const apiKey = getApiKey()
  const url = buildUrl(path, params)

  const response = await fetchWithRetry(url, {
    method: 'GET',
    headers: {
      'chave-api-dados': apiKey,
      'Accept': 'application/json',
    },
  })

  return response.json() as Promise<T>
}

export async function fetchDespesasPorOrgao(
  ano: number,
  pagina: number = 1,
): Promise<DespesaPorOrgao[]> {
  return apiGet<DespesaPorOrgao[]>('/despesas/por-orgao', {
    ano,
    pagina,
  })
}

export async function fetchContratos(
  dataInicial: string,
  dataFinal: string,
  pagina: number = 1,
): Promise<Contrato[]> {
  return apiGet<Contrato[]>('/contratos', {
    dataInicial,
    dataFinal,
    pagina,
  })
}

export async function fetchCEIS(pagina: number = 1): Promise<EmpresaSancionada[]> {
  return apiGet<EmpresaSancionada[]>('/ceis', {
    pagina,
  })
}

const MAX_PAGES = 20
const INTER_PAGE_DELAY_MS = 200

export async function fetchSpendingSummary(ano: number): Promise<SpendingSummary> {
  const allDespesas: DespesaPorOrgao[] = []
  let pagina = 1
  let batch: DespesaPorOrgao[]

  do {
    batch = await fetchDespesasPorOrgao(ano, pagina)
    allDespesas.push(...batch)
    pagina++

    if (batch.length > 0 && pagina <= MAX_PAGES) {
      await delay(INTER_PAGE_DELAY_MS)
    }
  } while (batch.length > 0 && pagina <= MAX_PAGES)

  const totals = allDespesas.reduce(
    (acc, item) => ({
      totalPago: acc.totalPago + item.valorPago,
      totalEmpenhado: acc.totalEmpenhado + item.valorEmpenhado,
      totalLiquidado: acc.totalLiquidado + item.valorLiquidado,
    }),
    { totalPago: 0, totalEmpenhado: 0, totalLiquidado: 0 },
  )

  return {
    ...totals,
    porOrgao: allDespesas,
    atualizadoEm: new Date().toISOString(),
    source: 'live',
  }
}

function formatDateBR(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

export async function fetchRecentContracts(days: number = 30): Promise<Contrato[]> {
  const today = new Date()
  const past = new Date(today)
  past.setDate(today.getDate() - days)

  const dataFinal = formatDateBR(today)
  const dataInicial = formatDateBR(past)

  const allContracts: Contrato[] = []
  const maxPages = 3

  for (let pagina = 1; pagina <= maxPages; pagina++) {
    const batch = await fetchContratos(dataInicial, dataFinal, pagina)
    allContracts.push(...batch)

    if (batch.length === 0) {
      break
    }

    if (pagina < maxPages) {
      await delay(INTER_PAGE_DELAY_MS)
    }
  }

  return allContracts
}
