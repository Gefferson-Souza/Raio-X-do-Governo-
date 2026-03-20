import type { Contrato, DespesaPorOrgaoRaw, DespesaPorOrgao, EmpresaSancionada, SpendingSummary, EmendaParlamentarRaw, ViagemOficialRaw, CartaoPagamentoRaw } from './types'

const BASE_URL = 'https://api.portaldatransparencia.gov.br/api-de-dados'
const TIMEOUT_MS = 15_000
const MAX_RETRIES = 3
const INITIAL_BACKOFF_MS = 500
const INTER_REQUEST_DELAY_MS = 300

const TOP_ORGAOS_SUPERIORES = [
  '20000', // Presidencia da Republica
  '22000', // Min. da Agricultura
  '24000', // Min. da Ciencia e Tecnologia
  '25000', // Min. da Fazenda
  '26000', // Min. da Educacao
  '28000', // Min. do Desenvolvimento
  '30000', // Min. da Justica
  '32000', // Min. de Minas e Energia
  '33000', // Min. da Previdencia
  '35000', // Min. das Relacoes Exteriores
  '36000', // Min. da Saude
  '39000', // Min. dos Transportes
  '44000', // Min. do Meio Ambiente
  '52000', // Min. da Defesa
  '54000', // Min. do Turismo
  '55000', // Min. da Integracao
]

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

function parseBRNumber(value: string | number | undefined | null): number {
  if (value === undefined || value === null) return 0
  if (typeof value === 'number') return value
  if (typeof value !== 'string' || value === '-' || value === '') return 0
  const cleaned = value.replace(/\./g, '').replace(',', '.')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

function transformDespesa(raw: DespesaPorOrgaoRaw): DespesaPorOrgao {
  return {
    ano: raw.ano,
    orgao: raw.orgao || '',
    codigoOrgao: raw.codigoOrgao || '',
    orgaoSuperior: raw.orgaoSuperior || '',
    codigoOrgaoSuperior: raw.codigoOrgaoSuperior || '',
    empenhado: parseBRNumber(raw.empenhado),
    liquidado: parseBRNumber(raw.liquidado),
    pago: parseBRNumber(raw.pago),
  }
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
        const body = await response.text().catch(() => '')
        throw new Error(`HTTP ${response.status}: ${response.statusText} — ${body.slice(0, 200)}`)
      }

      return response
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      const isRetryable = err.name === 'AbortError' || err.message.includes('fetch failed')

      if (!isRetryable) throw err

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
  codigoOrgaoSuperior: string,
  pagina: number = 1,
): Promise<DespesaPorOrgao[]> {
  const rawList = await apiGet<DespesaPorOrgaoRaw[]>('/despesas/por-orgao', {
    ano,
    orgaoSuperior: codigoOrgaoSuperior,
    pagina,
  })
  return rawList.map(transformDespesa)
}

export async function fetchContratos(
  dataInicial: string,
  dataFinal: string,
  codigoOrgao: string,
  pagina: number = 1,
): Promise<Contrato[]> {
  return apiGet<Contrato[]>('/contratos', {
    dataInicial,
    dataFinal,
    codigoOrgao,
    pagina,
  })
}

export async function fetchCEIS(pagina: number = 1): Promise<EmpresaSancionada[]> {
  return apiGet<EmpresaSancionada[]>('/ceis', { pagina })
}

export async function fetchEmendas(ano: number, pagina: number = 1): Promise<EmendaParlamentarRaw[]> {
  return apiGet<EmendaParlamentarRaw[]>('/emendas', { ano, pagina })
}

export async function fetchViagens(
  dataIdaDe: string,
  dataIdaAte: string,
  pagina: number = 1,
): Promise<ViagemOficialRaw[]> {
  return apiGet<ViagemOficialRaw[]>('/viagens', {
    dataIdaDe,
    dataIdaAte,
    pagina,
  })
}

export async function fetchCartoes(
  dataTransacaoDe: string,
  dataTransacaoAte: string,
  pagina: number = 1,
): Promise<CartaoPagamentoRaw[]> {
  return apiGet<CartaoPagamentoRaw[]>('/cartoes', {
    dataTransacaoDe,
    dataTransacaoAte,
    pagina,
  })
}

export async function fetchSpendingSummary(ano: number): Promise<SpendingSummary> {
  const allDespesas: DespesaPorOrgao[] = []

  for (const codigoOrgao of TOP_ORGAOS_SUPERIORES) {
    try {
      const batch = await fetchDespesasPorOrgao(ano, codigoOrgao, 1)
      allDespesas.push(...batch)
      await delay(INTER_REQUEST_DELAY_MS)
    } catch (error) {
      console.error(`[transparency] Failed to fetch orgao ${codigoOrgao}:`, error)
    }
  }

  const totals = allDespesas.reduce(
    (acc, item) => ({
      totalPago: acc.totalPago + item.pago,
      totalEmpenhado: acc.totalEmpenhado + item.empenhado,
      totalLiquidado: acc.totalLiquidado + item.liquidado,
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
  const contracts = await fetchContractsForPeriod(days)

  // Fallback: if current date range returns nothing (common when data lags behind),
  // try the same period from the previous year
  if (contracts.length === 0) {
    console.warn('[transparency] No contracts found for current period, trying previous year fallback')
    return fetchContractsForPreviousYear()
  }

  return contracts
}

async function fetchContractsForPeriod(days: number): Promise<Contrato[]> {
  const today = new Date()
  const past = new Date(today)
  past.setDate(today.getDate() - days)

  const dataFinal = formatDateBR(today)
  const dataInicial = formatDateBR(past)

  const allContracts: Contrato[] = []

  for (const codigoOrgao of TOP_ORGAOS_SUPERIORES.slice(0, 8)) {
    try {
      const batch = await fetchContratos(dataInicial, dataFinal, codigoOrgao, 1)
      allContracts.push(...batch)
      await delay(INTER_REQUEST_DELAY_MS)
    } catch (error) {
      console.error(`[transparency] Failed to fetch contracts for orgao ${codigoOrgao}:`, error)
    }
  }

  return allContracts
}

async function fetchContractsForPreviousYear(): Promise<Contrato[]> {
  const now = new Date()
  const previousYear = now.getFullYear() - 1
  const fallbackEnd = new Date(previousYear, now.getMonth(), now.getDate())
  const fallbackStart = new Date(previousYear, 0, 1)

  const dataFinal = formatDateBR(fallbackEnd)
  const dataInicial = formatDateBR(fallbackStart)

  const allContracts: Contrato[] = []

  for (const codigoOrgao of TOP_ORGAOS_SUPERIORES.slice(0, 8)) {
    try {
      const batch = await fetchContratos(dataInicial, dataFinal, codigoOrgao, 1)
      allContracts.push(...batch)
      await delay(INTER_REQUEST_DELAY_MS)
    } catch (error) {
      console.error(`[transparency] Fallback fetch failed for orgao ${codigoOrgao}:`, error)
    }
  }

  return allContracts
}
