import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  fetchDespesasPorOrgao,
  fetchContratos,
  fetchCEIS,
  fetchSpendingSummary,
} from '@/lib/api/transparency'
import type { DespesaPorOrgao } from '@/lib/api/types'

const BASE_URL = 'https://api.portaldatransparencia.gov.br/api-de-dados'

function makeDespesa(overrides: Partial<DespesaPorOrgao> = {}): DespesaPorOrgao {
  return {
    ano: 2025,
    codigoOrgaoSuperior: '26000',
    nomeOrgaoSuperior: 'Ministério da Educação',
    codigoOrgao: '26101',
    nomeOrgao: 'Secretaria Executiva',
    valorEmpenhado: 1_000_000,
    valorLiquidado: 900_000,
    valorPago: 800_000,
    valorRestoInscrito: 50_000,
    valorRestoPago: 40_000,
    ...overrides,
  }
}

describe('transparency API client', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv, TRANSPARENCY_API_KEY: 'test-key-123' }
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    process.env = originalEnv
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('fetchDespesasPorOrgao', () => {
    it('sends correct request and returns data', async () => {
      const mockData = [makeDespesa()]
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(mockData), { status: 200 }),
      )

      const result = await fetchDespesasPorOrgao(2025, 1)

      expect(result).toEqual(mockData)
      expect(fetchSpy).toHaveBeenCalledTimes(1)

      const [url, init] = fetchSpy.mock.calls[0]
      expect(url).toContain(`${BASE_URL}/despesas/por-orgao`)
      expect(url).toContain('ano=2025')
      expect(url).toContain('pagina=1')
      expect((init as RequestInit).headers).toEqual(
        expect.objectContaining({ 'chave-api-dados': 'test-key-123' }),
      )
    })

    it('defaults pagina to 1', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify([]), { status: 200 }),
      )

      await fetchDespesasPorOrgao(2025)

      const [url] = fetchSpy.mock.calls[0]
      expect(url).toContain('pagina=1')
    })
  })

  describe('fetchContratos', () => {
    it('sends correct request with date params', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify([]), { status: 200 }),
      )

      await fetchContratos('01/01/2025', '30/06/2025', 2)

      const [url] = fetchSpy.mock.calls[0]
      expect(url).toContain('dataInicial=01%2F01%2F2025')
      expect(url).toContain('dataFinal=30%2F06%2F2025')
      expect(url).toContain('pagina=2')
    })
  })

  describe('fetchCEIS', () => {
    it('sends correct request', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify([]), { status: 200 }),
      )

      await fetchCEIS(3)

      const [url] = fetchSpy.mock.calls[0]
      expect(url).toContain(`${BASE_URL}/ceis`)
      expect(url).toContain('pagina=3')
    })
  })

  describe('missing API key', () => {
    it('throws when TRANSPARENCY_API_KEY is not set', async () => {
      delete process.env.TRANSPARENCY_API_KEY

      await expect(fetchDespesasPorOrgao(2025)).rejects.toThrow(
        'TRANSPARENCY_API_KEY environment variable is not set',
      )
    })
  })

  describe('retry behavior', () => {
    it('retries on 500 errors and eventually succeeds', async () => {
      const mockData = [makeDespesa()]
      const fetchSpy = vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(new Response('', { status: 500, statusText: 'Server Error' }))
        .mockResolvedValueOnce(new Response(JSON.stringify(mockData), { status: 200 }))

      const result = await fetchDespesasPorOrgao(2025)

      expect(result).toEqual(mockData)
      expect(fetchSpy).toHaveBeenCalledTimes(2)
    })

    it('retries on 429 rate limit', async () => {
      const mockData = [makeDespesa()]
      const fetchSpy = vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(new Response('', { status: 429, statusText: 'Too Many Requests' }))
        .mockResolvedValueOnce(new Response(JSON.stringify(mockData), { status: 200 }))

      const result = await fetchDespesasPorOrgao(2025)

      expect(result).toEqual(mockData)
      expect(fetchSpy).toHaveBeenCalledTimes(2)
    })

    it('throws after max retries exhausted', async () => {
      vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(new Response('', { status: 500, statusText: 'Server Error' }))
        .mockResolvedValueOnce(new Response('', { status: 500, statusText: 'Server Error' }))
        .mockResolvedValueOnce(new Response('', { status: 500, statusText: 'Server Error' }))

      await expect(fetchDespesasPorOrgao(2025)).rejects.toThrow(
        'Request failed after 3 retries',
      )
    })

    it('does not retry on 4xx errors other than 429', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response('', { status: 403, statusText: 'Forbidden' }),
      )

      await expect(fetchDespesasPorOrgao(2025)).rejects.toThrow('HTTP 403: Forbidden')
    })
  })

  describe('fetchSpendingSummary', () => {
    it('aggregates multiple pages into summary', async () => {
      const page1 = [
        makeDespesa({ valorPago: 100, valorEmpenhado: 200, valorLiquidado: 150 }),
        makeDespesa({ valorPago: 300, valorEmpenhado: 400, valorLiquidado: 350 }),
      ]
      const page2 = [
        makeDespesa({ valorPago: 50, valorEmpenhado: 80, valorLiquidado: 60 }),
      ]

      vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(new Response(JSON.stringify(page1), { status: 200 }))
        .mockResolvedValueOnce(new Response(JSON.stringify(page2), { status: 200 }))
        .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))

      const summary = await fetchSpendingSummary(2025)

      expect(summary.totalPago).toBe(450)
      expect(summary.totalEmpenhado).toBe(680)
      expect(summary.totalLiquidado).toBe(560)
      expect(summary.porOrgao).toHaveLength(3)
      expect(summary.atualizadoEm).toBeDefined()
      expect(summary.source).toBe('live')
    })

    it('returns zeros when no data is available', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify([]), { status: 200 }),
      )

      const summary = await fetchSpendingSummary(2025)

      expect(summary.totalPago).toBe(0)
      expect(summary.totalEmpenhado).toBe(0)
      expect(summary.totalLiquidado).toBe(0)
      expect(summary.porOrgao).toHaveLength(0)
      expect(summary.source).toBe('live')
    })
  })
})
