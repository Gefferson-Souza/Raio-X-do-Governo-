<!-- Generated: 2026-03-20 | Files scanned: 56 | Token estimate: ~800 -->

# Backend

## API Routes

```
GET  /api/spending → route.ts → getSpendingData(2026) → SpendingSummary JSON
     Headers: Cache-Control: public, s-maxage=300, stale-while-revalidate=600
     X-Data-Source: live | cached | error
     Status: 200 (ok) | 502 (error)

GET  /api/politicians → route.ts → fetchDeputados + fetchSenadores + fetchPartidos → PoliticiansData JSON
     Headers: Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400
     maxDuration: 300 (5min)
     Status: 200 | 502

POST /api/og?valor=&item=&equivalencia= → route.tsx → ImageResponse (1200x630)
     Runtime: edge
     Fonts: Epilogue, Space Grotesk (fetched at request time)

GET  /api/cron/politicians → route.ts → full politicians pre-fetch
     Trigger: vercel.json cron "0 6 * * *" (daily 6am)
     maxDuration: 300 (5min)
     Auth: CRON_SECRET (optional)
```

## Service → API Client Chain

```
spending-service.ts
  getSpendingData(year)
    └── getCached('spending-{year}')        [cache.ts, TTL 300s]
    └── fetchSpendingSummary(year)          [transparency.ts]
          └── 16× fetchDespesasPorOrgao(year, orgaoId)
                └── apiGet('/despesas/por-orgao')
                      └── fetchWithRetry(url, 3 attempts, exponential backoff)

contracts-service.ts
  getRecentContracts(days=30)
    └── getCached('contracts-recent-{days}')   [cache.ts, TTL 600s]
    └── fetchRecentContracts(days)             [transparency.ts]
          └── 8× fetchContratos(startDate, endDate, orgaoId)
          fallback: same period previous year if empty

politicians-service.ts
  getPoliticiansData()
    └── getCached('politicians-data')       [cache.ts, TTL 3600s]
    └── fetchDeputados()                    [camara.ts]
          └── GET /deputados (paginated)
          └── GET /deputados/{id}/despesas (per deputy)
    └── fetchSenadores()                    [senado.ts]
          └── GET /senator-expenses (bulk)
    └── fetchPartidos()                     [senado.ts]
          └── GET /senator-expenses/parties
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
src/lib/api/transparency.ts   (289 lines) Portal da Transparência client, retry, rate limiting
src/lib/api/camara.ts          (84 lines)  Câmara dos Deputados client, pagination
src/lib/api/senado.ts         (103 lines)  Senate/Codante API client
src/lib/api/tse.ts             (61 lines)  Electoral board API client (reserved)
src/lib/api/cache.ts           (69 lines)  Two-tier cache (Redis + Map)
src/lib/api/types.ts          (138 lines)  Common TypeScript interfaces
src/lib/api/camara-types.ts   (114 lines)  Deputy/Senator types

src/lib/services/spending-service.ts     (31 lines) Cache-aside for spending
src/lib/services/contracts-service.ts    (26 lines) Cache-aside for contracts
src/lib/services/politicians-service.ts  (23 lines) Cache-aside for politicians

src/app/api/spending/route.ts            (20 lines) GET spending endpoint
src/app/api/politicians/route.ts        (132 lines) GET politicians endpoint
src/app/api/cron/politicians/route.ts   (359 lines) Cron pre-fetch job
src/app/api/og/route.tsx                (213 lines) OG image generator (edge)
```
