import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createHash } from 'crypto'
import { AuditService } from '../audit/audit.service'

const makePrisma = () => ({
  syncJob: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  rawResponse: {
    create: vi.fn(),
  },
})

describe('AuditService', () => {
  let service: AuditService
  let prisma: ReturnType<typeof makePrisma>

  beforeEach(() => {
    prisma = makePrisma()
    service = new AuditService(prisma as any)
  })

  describe('saveRawResponse', () => {
    it('computes correct SHA-256 hash of the serialized response body', async () => {
      const responseBody = { key: 'value', count: 42 }
      const serialized = JSON.stringify(responseBody)
      const expectedHash = createHash('sha256').update(serialized).digest('hex')

      prisma.rawResponse.create.mockResolvedValue({ id: 'r1' })

      await service.saveRawResponse({
        source: 'test',
        endpointUrl: 'https://example.com',
        httpStatus: 200,
        responseBody,
        durationMs: 100,
      })

      expect(prisma.rawResponse.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ responseHash: expectedHash }),
        }),
      )
    })

    it('calculates responseSizeBytes as the utf-8 byte length of the serialized body', async () => {
      const responseBody = { text: 'hello' }
      const serialized = JSON.stringify(responseBody)
      const expectedBytes = Buffer.byteLength(serialized, 'utf8')

      prisma.rawResponse.create.mockResolvedValue({ id: 'r2' })

      await service.saveRawResponse({
        source: 'test',
        endpointUrl: 'https://example.com',
        httpStatus: 200,
        responseBody,
        durationMs: 50,
      })

      expect(prisma.rawResponse.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ responseSizeBytes: expectedBytes }),
        }),
      )
    })

    it('associates syncJobId when provided', async () => {
      prisma.rawResponse.create.mockResolvedValue({ id: 'r3' })

      await service.saveRawResponse({
        source: 'test',
        endpointUrl: 'https://example.com',
        httpStatus: 200,
        responseBody: {},
        durationMs: 10,
        syncJobId: 'job-123',
      })

      expect(prisma.rawResponse.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ syncJobId: 'job-123' }),
        }),
      )
    })

    it('stores syncJobId as undefined when not provided', async () => {
      prisma.rawResponse.create.mockResolvedValue({ id: 'r4' })

      await service.saveRawResponse({
        source: 'test',
        endpointUrl: 'https://example.com',
        httpStatus: 200,
        responseBody: {},
        durationMs: 10,
      })

      expect(prisma.rawResponse.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ syncJobId: undefined }),
        }),
      )
    })

    it('stores httpMethod as GET', async () => {
      prisma.rawResponse.create.mockResolvedValue({ id: 'r5' })

      await service.saveRawResponse({
        source: 'src',
        endpointUrl: 'https://example.com',
        httpStatus: 200,
        responseBody: {},
        durationMs: 5,
      })

      expect(prisma.rawResponse.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ httpMethod: 'GET' }),
        }),
      )
    })

    it('handles unicode characters in body for correct byte count', async () => {
      const responseBody = { emoji: '' }
      const serialized = JSON.stringify(responseBody)
      const expectedBytes = Buffer.byteLength(serialized, 'utf8')

      prisma.rawResponse.create.mockResolvedValue({ id: 'r6' })

      await service.saveRawResponse({
        source: 'test',
        endpointUrl: 'https://example.com',
        httpStatus: 200,
        responseBody,
        durationMs: 1,
      })

      expect(prisma.rawResponse.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ responseSizeBytes: expectedBytes }),
        }),
      )
    })

    it('handles empty object body', async () => {
      const responseBody = {}
      const serialized = JSON.stringify(responseBody)
      const expectedHash = createHash('sha256').update(serialized).digest('hex')

      prisma.rawResponse.create.mockResolvedValue({ id: 'r7' })

      await service.saveRawResponse({
        source: 'test',
        endpointUrl: 'https://example.com',
        httpStatus: 404,
        responseBody,
        durationMs: 5,
      })

      expect(prisma.rawResponse.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ responseHash: expectedHash, httpStatus: 404 }),
        }),
      )
    })
  })

  describe('createSyncJob', () => {
    it('creates a job with status "running"', async () => {
      prisma.syncJob.create.mockResolvedValue({ id: 'job-1', jobType: 'spending', status: 'running' })

      const result = await service.createSyncJob('spending')

      expect(prisma.syncJob.create).toHaveBeenCalledWith({
        data: { jobType: 'spending', status: 'running' },
      })
      expect(result.status).toBe('running')
    })

    it('creates a job with the correct jobType', async () => {
      prisma.syncJob.create.mockResolvedValue({ id: 'job-2', jobType: 'politicians', status: 'running' })

      await service.createSyncJob('politicians')

      expect(prisma.syncJob.create).toHaveBeenCalledWith({
        data: { jobType: 'politicians', status: 'running' },
      })
    })
  })

  describe('completeSyncJob', () => {
    it('updates job status and passes recordsFetched', async () => {
      const startedAt = new Date(Date.now() - 5000)
      prisma.syncJob.findUnique.mockResolvedValue({ id: 'job-1', startedAt })
      prisma.syncJob.update.mockResolvedValue({ id: 'job-1', status: 'completed' })

      await service.completeSyncJob('job-1', 'completed', 16)

      expect(prisma.syncJob.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'job-1' },
          data: expect.objectContaining({
            status: 'completed',
            recordsFetched: 16,
          }),
        }),
      )
    })

    it('calculates durationMs from startedAt', async () => {
      const startedAt = new Date(Date.now() - 2000)
      prisma.syncJob.findUnique.mockResolvedValue({ id: 'job-1', startedAt })
      prisma.syncJob.update.mockResolvedValue({ id: 'job-1' })

      await service.completeSyncJob('job-1', 'completed', 5)

      const updateCall = prisma.syncJob.update.mock.calls[0][0]
      const durationMs = updateCall.data.durationMs
      // Allow 500ms tolerance for test execution time
      expect(durationMs).toBeGreaterThanOrEqual(1500)
      expect(durationMs).toBeLessThan(5000)
    })

    it('uses durationMs of 0 when job is not found', async () => {
      prisma.syncJob.findUnique.mockResolvedValue(null)
      prisma.syncJob.update.mockResolvedValue({ id: 'job-missing' })

      await service.completeSyncJob('job-missing', 'failed', 0)

      expect(prisma.syncJob.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ durationMs: 0 }),
        }),
      )
    })

    it('passes errorMessage when provided', async () => {
      prisma.syncJob.findUnique.mockResolvedValue({ id: 'job-1', startedAt: new Date() })
      prisma.syncJob.update.mockResolvedValue({ id: 'job-1' })

      await service.completeSyncJob('job-1', 'failed', 0, 'Something went wrong')

      expect(prisma.syncJob.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ errorMessage: 'Something went wrong' }),
        }),
      )
    })

    it('sets completedAt to a Date instance', async () => {
      prisma.syncJob.findUnique.mockResolvedValue({ id: 'job-1', startedAt: new Date() })
      prisma.syncJob.update.mockResolvedValue({ id: 'job-1' })

      await service.completeSyncJob('job-1', 'completed', 10)

      const updateCall = prisma.syncJob.update.mock.calls[0][0]
      expect(updateCall.data.completedAt).toBeInstanceOf(Date)
    })
  })
})
