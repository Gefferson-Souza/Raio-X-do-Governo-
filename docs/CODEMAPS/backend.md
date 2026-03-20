<!-- Generated: 2026-03-20 | Files scanned: 42 | Token estimate: ~600 -->

# Backend

## API Routes

```
GET /api/spending → route.ts → getSpendingData(2026) → SpendingSummary JSON
    Headers: Cache-Control: public, s-maxage=300, stale-while-revalidate=600
    X-Data-Source: live | cached | error
    Status: 200 (ok) | 502 (error)

GET /api/og?valor=&item=&equivalencia= → route.tsx → ImageResponse (1200x630)
    Runtime: edge
    Fonts: Epilogue, Space Grotesk (fetched at request time)
```

## Service → API Client Chain

```
spending-service.ts
  getSpendingData(year)
    └── getCached('spending-{year}')     [cache.ts, TTL 300s]
    └── fetchSpendingSummary(year)       [transparency.ts]
          └── 16× fetchDespesasPorOrgao(year, orgaoId)
                └── apiGet('/despesas/por-orgao')
                      └── fetchWithRetry(url, 3 attempts, exponential backoff)
                            └── Portal da Transparência API

contracts-service.ts
  getRecentContracts(days=30)
    └── getCached('contracts-recent-{days}')  [cache.ts, TTL 600s]
    └── fetchRecentContracts(days)            [transparency.ts]
          └── 8× fetchContratos(startDate, endDate, orgaoId)
                └── apiGet('/contratos')
          fallback: same period previous year if empty
```

## Cache Layer

```
cache.ts
  getCached<T>(key) → Redis (Upstash) ──fallback──→ In-memory Map
  setCache<T>(key, value, ttl) → writes both Redis + in-memory
  Redis errors silently caught → in-memory always available
```

## Key Files

```
src/lib/api/transparency.ts   (261 lines) API client, retry logic, rate limiting
src/lib/api/cache.ts           (69 lines)  Two-tier cache (Redis + Map)
src/lib/api/types.ts           (81 lines)  All TypeScript interfaces
src/lib/services/spending-service.ts   (31 lines) Cache-aside for spending
src/lib/services/contracts-service.ts  (26 lines) Cache-aside for contracts
src/app/api/spending/route.ts          (20 lines) GET endpoint
src/app/api/og/route.tsx               (196 lines) OG image generator
```
