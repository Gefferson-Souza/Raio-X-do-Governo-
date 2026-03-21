import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getCached, setCache } from '@/lib/api/cache'

describe('cache (in-memory fallback)', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
    vi.useFakeTimers()
  })

  afterEach(() => {
    process.env = originalEnv
    vi.useRealTimers()
  })

  it('returns null for a non-existent key', async () => {
    const result = await getCached<string>('nonexistent-key')
    expect(result).toBeNull()
  })

  it('stores and retrieves a value', async () => {
    await setCache('test-key', { data: 42 }, 60)
    const result = await getCached<{ data: number }>('test-key')
    expect(result).toEqual({ data: 42 })
  })

  it('returns null after TTL expires', async () => {
    await setCache('expire-key', 'hello', 5)

    const before = await getCached<string>('expire-key')
    expect(before).toBe('hello')

    vi.advanceTimersByTime(6_000)

    const after = await getCached<string>('expire-key')
    expect(after).toBeNull()
  })

  it('overwrites existing keys', async () => {
    await setCache('overwrite-key', 'first', 60)
    await setCache('overwrite-key', 'second', 60)

    const result = await getCached<string>('overwrite-key')
    expect(result).toBe('second')
  })

  it('handles different types', async () => {
    await setCache('number', 123, 60)
    await setCache('array', [1, 2, 3], 60)
    await setCache('null-val', null, 60)

    expect(await getCached<number>('number')).toBe(123)
    expect(await getCached<number[]>('array')).toEqual([1, 2, 3])
    expect(await getCached<null>('null-val')).toBeNull()
  })

  it('isolates keys from each other', async () => {
    await setCache('key-a', 'value-a', 60)
    await setCache('key-b', 'value-b', 60)

    expect(await getCached<string>('key-a')).toBe('value-a')
    expect(await getCached<string>('key-b')).toBe('value-b')
  })
})
