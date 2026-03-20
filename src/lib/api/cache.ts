interface CacheEntry<T> {
  value: T
  expiresAt: number
}

const memoryStore = new Map<string, CacheEntry<unknown>>()

function isRedisConfigured(): boolean {
  return !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  )
}

async function getRedisClient() {
  const { Redis } = await import('@upstash/redis')
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })
}

function getFromMemory<T>(key: string): T | null {
  const entry = memoryStore.get(key) as CacheEntry<T> | undefined
  if (!entry) {
    return null
  }
  if (Date.now() > entry.expiresAt) {
    memoryStore.delete(key)
    return null
  }
  return entry.value
}

function setInMemory<T>(key: string, value: T, ttlSeconds: number): void {
  memoryStore.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  })
}

export async function getCached<T>(key: string): Promise<T | null> {
  if (!isRedisConfigured()) {
    return getFromMemory<T>(key)
  }

  try {
    const redis = await getRedisClient()
    const data = await redis.get<T>(key)
    return data ?? null
  } catch {
    return getFromMemory<T>(key)
  }
}

export async function setCache<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  setInMemory(key, value, ttlSeconds)

  if (!isRedisConfigured()) {
    return
  }

  try {
    const redis = await getRedisClient()
    await redis.set(key, value, { ex: ttlSeconds })
  } catch {
    // In-memory fallback already set above
  }
}
