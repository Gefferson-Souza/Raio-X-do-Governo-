<!-- Generated: 2026-03-20 | Files scanned: 56 | Token estimate: ~850 -->

# Architecture

## System Overview

Next.js 16 SSR dashboard consuming multiple Brazilian government APIs.
Hybrid rendering: Server Components (ISR 300s) + client-side polling (React Query 5min).
Cron job (daily 6am) pre-fetches politicians data.

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Browser                                    │
│  ┌────────┐ ┌────────┐ ┌─────────┐ ┌────────┐ ┌──────────────────┐ │
│  │ / home │ │/ranking│ │/carrinho│ │/gerador│ │  /politicos/*   │ │
│  └───┬────┘ └───┬────┘ └───┬─────┘ └────────┘ └───────┬─────────┘ │
│      │          │          │                           │            │
│      └──────────┼──────────┘                           │            │
│                 ▼                                      ▼            │
│     SpendingPoller (useQuery 5min)      PoliticiansContent (useQuery│
│                 │                          refetchInterval 1h)      │
└─────────────────┼──────────────────────────┼────────────────────────┘
                  ▼                          ▼
       GET /api/spending          GET /api/politicians
                  │                          │
┌─────────────────┼──────────────────────────┼────────────────────────┐
│  Next.js Server │                          │                        │
│                 ▼                          ▼                        │
│  ┌──────────────────────────────────────────────────┐               │
│  │    Service Layer                                  │               │
│  │  spending-service.ts    ← cache-aside (TTL 300s) │               │
│  │  contracts-service.ts   ← cache-aside (TTL 600s) │               │
│  │  politicians-service.ts ← cache-aside (TTL 3600s)│               │
│  └───────────────────────┬──────────────────────────┘               │
│                          ▼                                          │
│  ┌──────────────────────────────────────────────────┐               │
│  │    Cache Layer (cache.ts)                         │               │
│  │    Redis (Upstash) ──fallback──→ In-memory Map    │               │
│  └───────────────────────┬──────────────────────────┘               │
│                          ▼                                          │
│  ┌──────────────────────────────────────────────────┐               │
│  │    API Clients                                    │               │
│  │  transparency.ts  → Portal da Transparência       │               │
│  │  camara.ts        → Câmara dos Deputados          │               │
│  │  senado.ts        → Senado (via Codante)          │               │
│  │  tse.ts           → Tribunal Superior Eleitoral   │               │
│  └───────────────────────┬──────────────────────────┘               │
└──────────────────────────┼──────────────────────────────────────────┘
                           ▼
  ┌─────────────────────────────────────────────┐
  │  External APIs                               │
  │  - api.portaldatransparencia.gov.br          │
  │  - dadosabertos.camara.leg.br                │
  │  - apis.codante.io/senator-expenses          │
  │  - divulgacandcontas.tse.jus.br (reserved)   │
  └─────────────────────────────────────────────┘

Cron: GET /api/cron/politicians (daily 6am via vercel.json)
  └── Fetches deputies + senators + parties → stores in cache (TTL 24h)
```

## Key Architectural Decisions

- **ISR (300s)** on all data pages → fast loads, near-real-time data
- **Cache-aside pattern** in service layer → resilient to API downtime
- **Two-tier cache** (Redis + in-memory) → works with or without Upstash
- **Error boundaries** return zero-value objects with `source: 'error'` → pages always render
- **No database** → all data sourced from external APIs + ephemeral cache
- **Edge OG image generation** → social sharing cards rendered on `/api/og`
- **Daily cron pre-fetch** → politicians data always warm in cache
- **Rate limiting** → 300ms inter-request delay to respect API limits
