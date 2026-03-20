<!-- Generated: 2026-03-20 | Files scanned: 42 | Token estimate: ~700 -->

# Architecture

## System Overview

Next.js 16 SSR dashboard consuming the Brazilian Portal da Transparência REST API.
Hybrid rendering: Server Components (ISR 300s) + client-side polling (React Query 5min).

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  / home  │  │ /ranking │  │/carrinho │  │ /gerador │        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────────┘        │
│       │              │              │                             │
│       └──────────────┼──────────────┘                            │
│                      ▼                                           │
│              SpendingPoller (useQuery, 5min poll)                │
│                      │                                           │
└──────────────────────┼───────────────────────────────────────────┘
                       ▼
              GET /api/spending
                       │
┌──────────────────────┼───────────────────────────────────────────┐
│  Next.js Server      │                                           │
│                      ▼                                           │
│  ┌─────────────────────────┐                                     │
│  │    Service Layer         │                                     │
│  │  spending-service.ts     │  ← cache-aside (TTL 300s)          │
│  │  contracts-service.ts    │  ← cache-aside (TTL 600s)          │
│  └────────────┬────────────┘                                     │
│               ▼                                                  │
│  ┌─────────────────────────┐                                     │
│  │    Cache Layer           │                                     │
│  │  cache.ts                │                                     │
│  │  Redis (Upstash) ──or── │                                     │
│  │  In-memory Map fallback  │                                     │
│  └────────────┬────────────┘                                     │
│               ▼                                                  │
│  ┌─────────────────────────┐                                     │
│  │    API Client            │                                     │
│  │  transparency.ts         │                                     │
│  │  fetchWithRetry (3x)     │                                     │
│  │  300ms inter-req delay   │                                     │
│  └────────────┬────────────┘                                     │
└───────────────┼──────────────────────────────────────────────────┘
                ▼
   Portal da Transparência API
   (api.portaldatransparencia.gov.br)
```

## Key Architectural Decisions

- **ISR (300s)** on all data pages → fast loads, near-real-time data
- **Cache-aside pattern** in service layer → resilient to API downtime
- **Two-tier cache** (Redis + in-memory) → works with or without Upstash
- **Error boundaries** return zero-value objects with `source: 'error'` → pages always render
- **No database** → all data sourced from external API + ephemeral cache
- **Edge OG image generation** → social sharing cards rendered on `/api/og`
