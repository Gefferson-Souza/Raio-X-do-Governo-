import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@upstash/redis', () => ({
  Redis: class {
    async get() {
      throw new Error('Redis connection failed')
    }
    async set() {
      throw new Error('Redis connection failed')
    }
  },
}))

import { getCached, setCache } from '@/lib/api/cache'

describe('cache (redis error fallback)', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      UPSTASH_REDIS_REST_URL: 'https://fake-redis.upstash.io',
      UPSTASH_REDIS_REST_TOKEN: 'fake-token',
    }
  })

  afterEach(() => {
    process.env = originalEnv
    vi.restoreAllMocks()
  })

  it('falls back to in-memory when redis throws on get', async () => {
    await setCache('redis-fallback', 'works', 60)
    const result = await getCached<string>('redis-fallback')
    expect(result).toBe('works')
  })

  it('setCache does not throw when redis fails', async () => {
    await expect(setCache('key', 'value', 60)).resolves.toBeUndefined()
  })
})
