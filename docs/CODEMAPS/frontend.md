<!-- Generated: 2026-03-22 | Files scanned: 32 | Token estimate: ~800 -->

# Frontend

## Page Tree

```
app/
├── layout.tsx              RSC  Root: fonts (Epilogue, Public Sans, Space Grotesk),
│                                Providers, TopNav, SideNav, BottomNav, Footer
├── page.tsx                RSC  / → dashboard: counter, equivalences, contracts (revalidate=300)
├── ranking/page.tsx        RSC  /ranking → ministry podium, execution bars, timeline (revalidate=300)
├── carrinho/page.tsx       RSC  /carrinho → top 20 contracts, grouped by supplier (revalidate=300)
├── gerador/
│   ├── page.tsx            RSC  /gerador → static shell
│   └── _components/
│       └── impact-generator.tsx  CC  Interactive card generator with share (361 lines)
├── politicos/
│   ├── page.tsx            RSC  /politicos → overview with client hydration
│   ├── deputados/[id]/     RSC  /politicos/deputados/:id → deputy detail (172 lines)
│   ├── congresso/          RSC  /politicos/congresso → congress analytics (159 lines)
│   └── partidos/           RSC  /politicos/partidos → party breakdown (177 lines)
└── api/
    ├── spending/route.ts        BFF → NestJS /api/v1/spending/summary
    ├── politicians/route.ts     BFF → NestJS /api/v1/politicians
    ├── cron/politicians/route.ts Cron pre-fetch
    └── og/route.tsx             Edge OG image (1200x630)
```

RSC = React Server Component | CC = Client Component

## Component Hierarchy

```
layout.tsx
├── Providers (QueryClientProvider, staleTime=5min)
│   ├── TopNav           CC  Fixed header, nav links (Gastos, Ranking, Politicos, Gerador)
│   ├── SideNav          CC  Desktop sidebar (lg+), "DENUNCIAR" CTA
│   ├── {page content}
│   │   ├── [/ home]
│   │   │   ├── SpendingPoller       CC  useQuery poll 5min, initialData from SSR
│   │   │   │   ├── StatsBar         → ExecutionBar (budget progress)
│   │   │   │   ├── CounterHero      CC  Animated counter (framer-motion)
│   │   │   │   └── Comparison cards (pickRandomComparisons, deterministic seed)
│   │   │   ├── KpiEquivalence ×4    Per-capita, families, daily, salary equivalences
│   │   │   ├── ContractCard ×3      Top 3 contracts by value
│   │   │   ├── DataSourceBanner     Live/cached/error indicator
│   │   │   └── CtaBanner            CTA to /gerador
│   │   ├── [/ranking]
│   │   │   ├── PodiumCard ×3        Top 3 ministries (gold/silver/bronze)
│   │   │   ├── ExecutionBar ×4      Ministries 4-7
│   │   │   └── TimelineRow ×N       Recent contracts timeline
│   │   ├── [/carrinho]
│   │   │   └── ContractCard ×20     Grouped by supplier
│   │   ├── [/politicos]
│   │   │   └── PoliticiansContent   CC  Main display (429 lines, largest component)
│   │   └── [/gerador]
│   │       └── ImpactGenerator      CC  Form → preview → share card
│   ├── BottomNav        CC  Mobile-only bottom tabs
│   └── Footer           RSC
```

## State Management

| Layer | Tool | Scope |
|-------|------|-------|
| Server | Next.js ISR (revalidate=300) | All data pages |
| Client | React Query (staleTime=5min) | SpendingPoller |
| Client | React Query (refetchInterval=1h) | PoliticiansContent |
| URL | nuqs | Shareable filter/pagination state |
| Local | useState | ImpactGenerator form, timers |

## Services (apps/web/src/lib/services/)

```
spending-service.ts     fetch NestJS /api/v1/spending/summary, revalidate 5min, fallback empty
contracts-service.ts    fetch NestJS /api/v1/spending/contracts, revalidate 10min, readonly
politicians-service.ts  fetch NestJS /api/v1/politicians, revalidate 1h, fallback empty
```

## API Clients (apps/web/src/lib/api/)

```
transparency.ts   Portal da Transparencia (retry 3x, 300ms delay, 15s timeout)
camara.ts         Camara dos Deputados (paginated)
senado.ts         Senate/Codante (bulk expenses + parties)
tse.ts            TSE (reserved, not active)
cache.ts          Two-tier: Redis (Upstash) → fallback in-memory Map
```
