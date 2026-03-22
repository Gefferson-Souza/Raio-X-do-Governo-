import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SpendingSyncService } from '../sync/spending-sync.service'

const TOP_ORGAOS_COUNT = 16

const makePrisma = () => ({
  spendingSnapshot: {
    updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    findFirst: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({ id: 'snap-1' }),
  },
})

const makeAudit = () => ({
  createSyncJob: vi.fn().mockResolvedValue({ id: 'job-1' }),
  saveRawResponse: vi.fn().mockResolvedValue({ id: 'raw-1' }),
  completeSyncJob: vi.fn().mockResolvedValue({}),
})

const makeConfig = (apiKey: string | null = 'test-api-key') => ({
  get: vi.fn().mockReturnValue(apiKey === null ? undefined : apiKey),
})

const makeOrgaoResponse = (codigo: string) => ([
  {
    orgao: `Orgao ${codigo}`,
    codigoOrgao: codigo,
    orgaoSuperior: `Superior ${codigo}`,
    codigoOrgaoSuperior: codigo,
    empenhado: '1.000,00',
    liquidado: '900,00',
    pago: '800,00',
  },
])

function buildFetchMock() {
  return vi.fn().mockImplementation((_url: string) => {
    const body = makeOrgaoResponse('99999')
    return Promise.resolve({
      status: 200,
      json: () => Promise.resolve(body),
    })
  })
}

describe('SpendingSyncService', () => {
  let prisma: ReturnType<typeof makePrisma>
  let audit: ReturnType<typeof makeAudit>
  let config: ReturnType<typeof makeConfig>
  let fetchMock: ReturnType<typeof vi.fn>
  let service: SpendingSyncService

  function buildService() {
    return new SpendingSyncService(prisma as any, audit as any, config as any)
  }

  beforeEach(() => {
    vi.useFakeTimers()
    prisma = makePrisma()
    audit = makeAudit()
    config = makeConfig('valid-api-key')
    fetchMock = buildFetchMock()
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('AbortSignal', { timeout: vi.fn().mockReturnValue({}) })
    service = buildService()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  /**
   * Runs syncAll while advancing fake timers so setTimeout(300ms) delays
   * in the orgao loop don't stall the test.
   */
  async function runSync(svc: SpendingSyncService = service) {
    const p = svc.syncAll()
    await vi.runAllTimersAsync()
    return p
  }

  describe('syncAll', () => {
    it('creates a SyncJob with jobType "spending" before fetching', async () => {
      await runSync()

      expect(audit.createSyncJob).toHaveBeenCalledWith('spending')
      const createOrder = audit.createSyncJob.mock.invocationCallOrder[0]
      const fetchOrder = fetchMock.mock.invocationCallOrder[0]
      expect(createOrder).toBeLessThan(fetchOrder)
    })

    it('attempts to fetch data for all 16 orgaos', async () => {
      await runSync()

      expect(fetchMock).toHaveBeenCalledTimes(TOP_ORGAOS_COUNT)
    })

    it('saves raw responses via AuditService for each orgao', async () => {
      await runSync()

      expect(audit.saveRawResponse).toHaveBeenCalledTimes(TOP_ORGAOS_COUNT)
      expect(audit.saveRawResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'transparencia',
          syncJobId: 'job-1',
          httpStatus: 200,
        }),
      )
    })

    it('marks previous snapshots as isLatest=false before creating new one', async () => {
      await runSync()

      expect(prisma.spendingSnapshot.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isLatest: true }),
          data: { isLatest: false },
        }),
      )
    })

    it('creates SpendingSnapshot with isLatest=true', async () => {
      await runSync()

      expect(prisma.spendingSnapshot.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isLatest: true, syncJobId: 'job-1' }),
        }),
      )
    })

    it('increments version correctly when no prior snapshot exists', async () => {
      prisma.spendingSnapshot.findFirst.mockResolvedValue(null)

      await runSync()

      expect(prisma.spendingSnapshot.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ version: 1 }),
        }),
      )
    })

    it('increments version correctly when prior snapshot has version 3', async () => {
      prisma.spendingSnapshot.findFirst.mockResolvedValue({ version: 3 })

      await runSync()

      expect(prisma.spendingSnapshot.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ version: 4 }),
        }),
      )
    })

    it('completes job with status "completed" on success', async () => {
      await runSync()

      expect(audit.completeSyncJob).toHaveBeenCalledWith(
        'job-1',
        'completed',
        expect.any(Number),
      )
    })

    it('completes job with status "failed" and error message when API key is missing', async () => {
      // When API key is missing the error is thrown before the fetch loop —
      // runAllTimersAsync is used to flush any pending microtasks.
      config = makeConfig(null)
      const svc = buildService()

      const p = svc.syncAll()
      await vi.runAllTimersAsync()
      await p

      expect(audit.completeSyncJob).toHaveBeenCalledWith(
        'job-1',
        'failed',
        0,
        'TRANSPARENCY_API_KEY not configured',
      )
    })

    it('does not call fetch when API key is missing', async () => {
      config = makeConfig(null)
      const svc = buildService()

      const p = svc.syncAll()
      await vi.runAllTimersAsync()
      await p

      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('continues processing remaining orgaos when one fetch fails (graceful degradation)', async () => {
      let callCount = 0
      fetchMock = vi.fn().mockImplementation(() => {
        callCount++
        if (callCount === 3) {
          return Promise.reject(new Error('Network error'))
        }
        return Promise.resolve({
          status: 200,
          json: () => Promise.resolve(makeOrgaoResponse('99999')),
        })
      })
      vi.stubGlobal('fetch', fetchMock)
      const svc = buildService()

      await runSync(svc)

      // All 16 fetches were attempted
      expect(fetchMock).toHaveBeenCalledTimes(TOP_ORGAOS_COUNT)
      // Job still completes successfully
      expect(audit.completeSyncJob).toHaveBeenCalledWith('job-1', 'completed', expect.any(Number))
      // Snapshot still created
      expect(prisma.spendingSnapshot.create).toHaveBeenCalled()
    })

    it('creates snapshot with correct totals aggregated across all orgaos', async () => {
      await runSync()

      const createCall = prisma.spendingSnapshot.create.mock.calls[0][0]
      expect(createCall.data.totalPago).toBeGreaterThan(0)
      expect(createCall.data.totalEmpenhado).toBeGreaterThan(0)
      expect(createCall.data.totalLiquidado).toBeGreaterThan(0)
    })

    it('records the correct ano (current year) in the snapshot', async () => {
      const currentYear = new Date().getFullYear()

      await runSync()

      expect(prisma.spendingSnapshot.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ ano: currentYear }),
        }),
      )
    })

    it('passes totalFetched count to completeSyncJob', async () => {
      await runSync()

      const completedCall = audit.completeSyncJob.mock.calls[0]
      const totalFetched = completedCall[2]
      expect(totalFetched).toBe(TOP_ORGAOS_COUNT)
    })
  })
})
