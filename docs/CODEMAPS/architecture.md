<!-- Generated: 2026-03-22 | Files scanned: 48 | Token estimate: ~700 -->

# Architecture

## System Overview

Nx monorepo: Next.js 16 frontend + NestJS 11 backend + PostgreSQL 16 + Redis 7.
Data sourced from Portal da Transparencia API, stored in versioned snapshots.
Daily cron sync (5-6 AM) via @nestjs/schedule.

```
Browser (mobile-first)
    |
    v
[Next.js 16 - App Router]  :3000
    |  Server Components (ISR: 5min spending, 1h politicians)
    |  Route Handlers (BFF thin → proxy to NestJS)
    |  Client: React Query polling, framer-motion, nuqs
    |
    v
[NestJS 11 API]  :3001  (prefix: /api/v1)
    |  Controllers -> Services -> PrismaService
    |  Modules: health, spending, politicians, contracts, sync, audit, admin
    |  Cron: @nestjs/schedule (daily 5-6 AM)
    |
    +---> [PostgreSQL 16]  :5432/5433
    |       sync_jobs (audit trail)
    |       raw_responses (every API call logged with SHA256)
    |       politicians_snapshots, spending_snapshots, contract_snapshots
    |
    +---> [Redis 7]  :6379
    |       Next.js cache layer (Upstash in prod, local in dev)
    |
    +---> [External APIs]
            Portal da Transparencia (spending, contracts)
            Camara dos Deputados (deputies)
            Codante (senators, parties)
```

## Monorepo Layout (Nx)

```
apps/
  web/     Next.js 16 (React 19, Tailwind 4, Vitest)
  api/     NestJS 11 (Prisma 7, PostgreSQL 16)
libs/
  shared/types/   @raio-x/types   (politicians, transparency interfaces)
  shared/utils/   @raio-x/utils   (format, equivalences, constants)
  api-clients/    @raio-x/api-clients/*  (placeholder: camara, senado, tse, transparencia)
  data-access/    @raio-x/cache   (placeholder: Redis cache layer)
e2e/             Playwright (desktop Chrome + mobile Pixel 7)
```

## Data Flow

```
Portal da Transparencia --> SyncService (cron daily 5-6AM)
  --> AuditService.saveRawResponse (SHA256 hash, timing, size)
  --> SyncJob (tracks fetch status, counts, errors)
  --> Snapshot (versioned, isLatest flag)
      --> NestJS GET endpoint
          --> Next.js BFF route handler (cache headers)
              --> Server Component (ISR revalidate)
                  --> Client Component (React Query poll)
```

## Key Architectural Decisions

- **Snapshot pattern**: Versioned data with `isLatest` flag for instant rollback
- **Full audit trail**: Every external API call → `raw_responses` with SHA256, timing, size
- **BFF thin**: Next.js route handlers proxy to NestJS, add cache headers
- **ISR revalidation**: spending=5min, politicians=1h, contracts=10min
- **Two-tier cache**: Redis (Upstash prod) + in-memory fallback
- **Error resilience**: Services return empty data with `source: 'error'`, pages always render
- **Rate limiting**: 300ms inter-request delay for external APIs
- **No auth on public endpoints**: Admin sync endpoint needs protection in prod
