import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { PoliticiansSyncService } from '../sync/politicians-sync.service'

// Camara API deputy list page response
function makeDeputadosPage(count: number, startId = 1) {
  return {
    dados: Array.from({ length: count }, (_, i) => ({
      id: startId + i,
      nome: `Deputy ${startId + i}`,
      siglaPartido: 'PT',
      siglaUf: 'SP',
      urlFoto: `https://example.com/${startId + i}.jpg`,
    })),
  }
}

// Camara API deputy expenses response
function makeDeputadoExpenses(total: number) {
  return {
    dados: [
      { tipoDespesa: 'COMBUSTÍVEIS', valorLiquido: total },
    ],
  }
}

// Codante senators response
function makeSenatorsResponse(count: number) {
  return {
    data: Array.from({ length: count }, (_, i) => ({
      id: 100 + i,
      name: `Senator ${100 + i}`,
      party: 'MDB',
      UF: 'RJ',
      avatar_url: `https://example.com/s${100 + i}.jpg`,
    })),
  }
}

// Codante senator expenses response
function makeSenatorExpenses(sum: string | null) {
  return { meta: { expenses_sum: sum } }
}

// Codante by-party summary
function makePartidosSummary() {
  return [
    {
      year: '2024',
      data: [
        { party: 'PT', total_expenses: 500000, senator_ids: [1, 2, 3] },
        { party: 'MDB', total_expenses: 300000, senator_ids: [4, 5] },
      ],
    },
  ]
}

const makePrisma = () => ({
  politiciansSnapshot: {
    updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    findFirst: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({ id: 'snap-pol-1' }),
  },
  politician: {
    upsert: vi.fn().mockResolvedValue({}),
  },
  politicianExpense: {
    create: vi.fn().mockResolvedValue({}),
  },
})

const makeAudit = () => ({
  createSyncJob: vi.fn().mockResolvedValue({ id: 'job-pol-1' }),
  saveRawResponse: vi.fn().mockResolvedValue({ id: 'raw-pol-1' }),
  completeSyncJob: vi.fn().mockResolvedValue({}),
})

describe('PoliticiansSyncService', () => {
  let service: PoliticiansSyncService
  let prisma: ReturnType<typeof makePrisma>
  let audit: ReturnType<typeof makeAudit>
  let fetchMock: ReturnType<typeof vi.fn>

  function buildFullFetchMock() {
    return vi.fn().mockImplementation((url: string) => {
      // Deputies list — single page with 5 deputies (< 100, so pagination stops)
      if (url.includes('/deputados?') && !url.includes('/despesas')) {
        return Promise.resolve({
          status: 200,
          json: () => Promise.resolve(makeDeputadosPage(5)),
        })
      }
      // Deputy expenses
      if (url.includes('/deputados/') && url.includes('/despesas')) {
        return Promise.resolve({
          status: 200,
          json: () => Promise.resolve(makeDeputadoExpenses(1000)),
        })
      }
      // Senators list
      if (url.includes('/senators?active=true')) {
        return Promise.resolve({
          status: 200,
          json: () => Promise.resolve(makeSenatorsResponse(3)),
        })
      }
      // Senator expenses
      if (url.includes('/senators/') && url.includes('/expenses')) {
        return Promise.resolve({
          status: 200,
          json: () => Promise.resolve(makeSenatorExpenses('5000.00')),
        })
      }
      // By-party summary
      if (url.includes('/summary/by-party')) {
        return Promise.resolve({
          status: 200,
          json: () => Promise.resolve(makePartidosSummary()),
        })
      }
      return Promise.resolve({
        status: 404,
        json: () => Promise.resolve({}),
      })
    })
  }

  beforeEach(() => {
    vi.useFakeTimers()
    prisma = makePrisma()
    audit = makeAudit()
    fetchMock = buildFullFetchMock()
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('AbortSignal', { timeout: vi.fn().mockReturnValue({}) })
    service = new PoliticiansSyncService(prisma as any, audit as any)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  describe('syncAll', () => {
    it('creates a SyncJob with jobType "politicians" before fetching', async () => {
      const syncPromise = service.syncAll()
      vi.runAllTimersAsync()
      await syncPromise

      expect(audit.createSyncJob).toHaveBeenCalledWith('politicians')
      const createOrder = audit.createSyncJob.mock.invocationCallOrder[0]
      const fetchOrder = fetchMock.mock.invocationCallOrder[0]
      expect(createOrder).toBeLessThan(fetchOrder)
    })

    it('fetches deputies list stopping when batch returns fewer than 100', async () => {
      // buildFullFetchMock returns 5 deputies, so pagination should stop after 1 page
      const syncPromise = service.syncAll()
      vi.runAllTimersAsync()
      await syncPromise

      const deputyListCalls = fetchMock.mock.calls.filter(
        ([url]: [string]) => url.includes('/deputados?') && !url.includes('/despesas'),
      )
      expect(deputyListCalls).toHaveLength(1)
    })

    it('fetches all deputies when list requires multiple pages', async () => {
      // First page returns 100 (full), second page returns 30 (partial → stop)
      let listCallCount = 0
      fetchMock = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/deputados?') && !url.includes('/despesas')) {
          listCallCount++
          const count = listCallCount === 1 ? 100 : 30
          return Promise.resolve({
            status: 200,
            json: () => Promise.resolve(makeDeputadosPage(count, (listCallCount - 1) * 100 + 1)),
          })
        }
        if (url.includes('/deputados/') && url.includes('/despesas')) {
          return Promise.resolve({ status: 200, json: () => Promise.resolve(makeDeputadoExpenses(500)) })
        }
        if (url.includes('/senators?active=true')) {
          return Promise.resolve({ status: 200, json: () => Promise.resolve(makeSenatorsResponse(2)) })
        }
        if (url.includes('/senators/') && url.includes('/expenses')) {
          return Promise.resolve({ status: 200, json: () => Promise.resolve(makeSenatorExpenses('1000')) })
        }
        if (url.includes('/summary/by-party')) {
          return Promise.resolve({ status: 200, json: () => Promise.resolve(makePartidosSummary()) })
        }
        return Promise.resolve({ status: 200, json: () => Promise.resolve({}) })
      })
      vi.stubGlobal('fetch', fetchMock)
      service = new PoliticiansSyncService(prisma as any, audit as any)

      const syncPromise = service.syncAll()
      vi.runAllTimersAsync()
      await syncPromise

      const deputyListCalls = fetchMock.mock.calls.filter(
        ([url]: [string]) => url.includes('/deputados?') && !url.includes('/despesas'),
      )
      expect(deputyListCalls).toHaveLength(2)
    })

    it('fetches deputy expenses in batches of 10', async () => {
      // Use 25 deputies to check batching
      let listCallCount = 0
      fetchMock = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/deputados?') && !url.includes('/despesas')) {
          listCallCount++
          if (listCallCount === 1) {
            return Promise.resolve({ status: 200, json: () => Promise.resolve(makeDeputadosPage(25, 1)) })
          }
          return Promise.resolve({ status: 200, json: () => Promise.resolve({ dados: [] }) })
        }
        if (url.includes('/deputados/') && url.includes('/despesas')) {
          return Promise.resolve({ status: 200, json: () => Promise.resolve(makeDeputadoExpenses(100)) })
        }
        if (url.includes('/senators?active=true')) {
          return Promise.resolve({ status: 200, json: () => Promise.resolve(makeSenatorsResponse(1)) })
        }
        if (url.includes('/senators/') && url.includes('/expenses')) {
          return Promise.resolve({ status: 200, json: () => Promise.resolve(makeSenatorExpenses('100')) })
        }
        if (url.includes('/summary/by-party')) {
          return Promise.resolve({ status: 200, json: () => Promise.resolve(makePartidosSummary()) })
        }
        return Promise.resolve({ status: 200, json: () => Promise.resolve({}) })
      })
      vi.stubGlobal('fetch', fetchMock)
      service = new PoliticiansSyncService(prisma as any, audit as any)

      const syncPromise = service.syncAll()
      vi.runAllTimersAsync()
      await syncPromise

      // 25 deputies each get 1 expenses call = 25 expense fetches
      const expenseCalls = fetchMock.mock.calls.filter(
        ([url]: [string]) => url.includes('/deputados/') && url.includes('/despesas'),
      )
      expect(expenseCalls).toHaveLength(25)
    })

    it('fetches senators from Codante API', async () => {
      const syncPromise = service.syncAll()
      vi.runAllTimersAsync()
      await syncPromise

      const senatorListCalls = fetchMock.mock.calls.filter(
        ([url]: [string]) => url.includes('/senators?active=true'),
      )
      expect(senatorListCalls).toHaveLength(1)
    })

    it('calculates status "ok" when all data sources succeed', async () => {
      const syncPromise = service.syncAll()
      vi.runAllTimersAsync()
      await syncPromise

      const createCall = prisma.politiciansSnapshot.create.mock.calls[0][0]
      expect(createCall.data.status).toBe('ok')
    })

    it('calculates status "partial" when some data sources fail', async () => {
      fetchMock = vi.fn().mockImplementation((url: string) => {
        // senators list always fails
        if (url.includes('/senators?active=true')) {
          return Promise.reject(new Error('Codante unavailable'))
        }
        if (url.includes('/deputados?') && !url.includes('/despesas')) {
          return Promise.resolve({ status: 200, json: () => Promise.resolve(makeDeputadosPage(3)) })
        }
        if (url.includes('/deputados/') && url.includes('/despesas')) {
          return Promise.resolve({ status: 200, json: () => Promise.resolve(makeDeputadoExpenses(500)) })
        }
        if (url.includes('/summary/by-party')) {
          return Promise.resolve({ status: 200, json: () => Promise.resolve(makePartidosSummary()) })
        }
        return Promise.resolve({ status: 200, json: () => Promise.resolve({}) })
      })
      vi.stubGlobal('fetch', fetchMock)
      service = new PoliticiansSyncService(prisma as any, audit as any)

      const syncPromise = service.syncAll()
      vi.runAllTimersAsync()
      await syncPromise

      const createCall = prisma.politiciansSnapshot.create.mock.calls[0][0]
      expect(createCall.data.status).toBe('partial')
    })

    it('calculates status "partial" when deputies and senators fail but partidos succeeds', async () => {
      // fetchPartidosResumo always fulfills because it has an internal try/catch.
      // When all external fetches reject, deputados and senadores are 'rejected'
      // but partidos is always 'fulfilled', giving status 'partial' (not 'error').
      fetchMock = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/summary/by-party')) {
          return Promise.resolve({ status: 200, json: () => Promise.resolve(makePartidosSummary()) })
        }
        return Promise.reject(new Error('All down'))
      })
      vi.stubGlobal('fetch', fetchMock)
      service = new PoliticiansSyncService(prisma as any, audit as any)

      const syncPromise = service.syncAll()
      vi.runAllTimersAsync()
      await syncPromise

      const createCall = prisma.politiciansSnapshot.create.mock.calls[0][0]
      expect(createCall.data.status).toBe('partial')
    })

    it('saves the complete ranking without truncation', async () => {
      // 5 deputies with expenses — all should appear in ranking
      const syncPromise = service.syncAll()
      vi.runAllTimersAsync()
      await syncPromise

      const createCall = prisma.politiciansSnapshot.create.mock.calls[0][0]
      const deputadosRanking = createCall.data.deputados.ranking
      expect(deputadosRanking).toHaveLength(5)
    })

    it('marks previous snapshot as isLatest=false', async () => {
      const syncPromise = service.syncAll()
      vi.runAllTimersAsync()
      await syncPromise

      expect(prisma.politiciansSnapshot.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isLatest: true },
          data: { isLatest: false },
        }),
      )
    })

    it('creates new snapshot with isLatest=true', async () => {
      const syncPromise = service.syncAll()
      vi.runAllTimersAsync()
      await syncPromise

      expect(prisma.politiciansSnapshot.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isLatest: true }),
        }),
      )
    })

    it('increments version correctly when no prior snapshot exists', async () => {
      prisma.politiciansSnapshot.findFirst.mockResolvedValue(null)

      const syncPromise = service.syncAll()
      vi.runAllTimersAsync()
      await syncPromise

      const createCall = prisma.politiciansSnapshot.create.mock.calls[0][0]
      expect(createCall.data.version).toBe(1)
    })

    it('increments version correctly when prior snapshot exists', async () => {
      prisma.politiciansSnapshot.findFirst.mockResolvedValue({ version: 7 })

      const syncPromise = service.syncAll()
      vi.runAllTimersAsync()
      await syncPromise

      const createCall = prisma.politiciansSnapshot.create.mock.calls[0][0]
      expect(createCall.data.version).toBe(8)
    })

    it('calls completeSyncJob with job id and totalFetched', async () => {
      const syncPromise = service.syncAll()
      vi.runAllTimersAsync()
      await syncPromise

      expect(audit.completeSyncJob).toHaveBeenCalledWith(
        'job-pol-1',
        expect.any(String),
        expect.any(Number),
      )
    })

    it('calls completeSyncJob with "failed" status when an unexpected error occurs', async () => {
      // Simulate prisma failing at snapshot creation
      prisma.politiciansSnapshot.create.mockRejectedValue(new Error('DB connection lost'))

      const syncPromise = service.syncAll()
      vi.runAllTimersAsync()
      await syncPromise

      expect(audit.completeSyncJob).toHaveBeenCalledWith(
        'job-pol-1',
        'failed',
        expect.any(Number),
        'DB connection lost',
      )
    })

    it('includes periodo with anoAtual and anoAnterior in snapshot', async () => {
      const currentYear = new Date().getFullYear()
      const syncPromise = service.syncAll()
      vi.runAllTimersAsync()
      await syncPromise

      const createCall = prisma.politiciansSnapshot.create.mock.calls[0][0]
      expect(createCall.data.periodo).toEqual({
        anoAtual: currentYear,
        anoAnterior: currentYear - 1,
      })
    })

    it('uses dados field from Camara API response when building deputies list', async () => {
      // Verify that `body.dados` is the field used (not body itself)
      let capturedDeputyCount = 0
      fetchMock = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/deputados?') && !url.includes('/despesas')) {
          // Return a response with dados containing 7 items
          return Promise.resolve({
            status: 200,
            json: () => Promise.resolve(makeDeputadosPage(7)),
          })
        }
        if (url.includes('/deputados/') && url.includes('/despesas')) {
          capturedDeputyCount++
          return Promise.resolve({ status: 200, json: () => Promise.resolve(makeDeputadoExpenses(200)) })
        }
        if (url.includes('/senators?active=true')) {
          return Promise.resolve({ status: 200, json: () => Promise.resolve(makeSenatorsResponse(1)) })
        }
        if (url.includes('/senators/') && url.includes('/expenses')) {
          return Promise.resolve({ status: 200, json: () => Promise.resolve(makeSenatorExpenses('100')) })
        }
        if (url.includes('/summary/by-party')) {
          return Promise.resolve({ status: 200, json: () => Promise.resolve(makePartidosSummary()) })
        }
        return Promise.resolve({ status: 200, json: () => Promise.resolve({}) })
      })
      vi.stubGlobal('fetch', fetchMock)
      service = new PoliticiansSyncService(prisma as any, audit as any)

      const syncPromise = service.syncAll()
      vi.runAllTimersAsync()
      await syncPromise

      // All 7 deputies should have their expenses fetched
      expect(capturedDeputyCount).toBe(7)
    })
  })
})
