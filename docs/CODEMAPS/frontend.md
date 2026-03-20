<!-- Generated: 2026-03-20 | Files scanned: 42 | Token estimate: ~900 -->

# Frontend

## Page Tree

```
app/
├── layout.tsx          RSC  Root: fonts, Providers, TopNav, SideNav, BottomNav, Footer
├── page.tsx            RSC  / → dashboard: counter, equivalences, contracts (revalidate=300)
├── ranking/page.tsx    RSC  /ranking → ministry podium, execution bars, timeline (revalidate=300)
├── carrinho/page.tsx   RSC  /carrinho → top 20 contracts, grouped by supplier (revalidate=300)
├── gerador/
│   ├── page.tsx        RSC  /gerador → static shell
│   └── _components/
│       └── impact-generator.tsx  CC  Interactive card generator with share preview
└── api/
    ├── spending/route.ts   GET → SpendingSummary JSON (Cache-Control: 300s)
    └── og/route.tsx        GET → 1200x630 OG image (edge runtime)
```

RSC = React Server Component | CC = Client Component

## Component Hierarchy

```
layout.tsx
├── Providers (QueryClientProvider, staleTime=5min)
│   ├── TopNav           CC  Fixed header, nav links, active highlight
│   ├── SideNav          CC  Desktop sidebar (lg+), "DENUNCIAR" CTA
│   ├── {page content}
│   │   ├── [/ home]
│   │   │   ├── SpendingPoller       CC  useQuery poll 5min, initialData from SSR
│   │   │   │   ├── StatsBar         → ExecutionBar (progress bar)
│   │   │   │   ├── CounterHero      CC  Animated counter (framer-motion)
│   │   │   │   └── Comparison cards (from pickRandomComparisons)
│   │   │   ├── KpiEquivalence ×4    Per-capita, families, daily, salary equivalences
│   │   │   ├── ContractCard ×3      Top 3 contracts by value
│   │   │   ├── DataSourceBanner     Live/cached/error indicator
│   │   │   └── CtaBanner            CTA to /gerador
│   │   ├── [/ranking]
│   │   │   ├── PodiumCard ×3        Top 3 ministries (gold/silver/bronze)
│   │   │   ├── ExecutionBar ×4      Ministries 4-7
│   │   │   └── TimelineRow ×N       Recent contracts timeline
│   │   ├── [/carrinho]
│   │   │   └── ContractCard ×20     Grouped by supplier, collapse logic
│   │   └── [/gerador]
│   │       └── ImpactGenerator      CC  Form → preview → share card
│   ├── BottomNav        CC  Mobile-only bottom tabs
│   └── Footer           RSC
```

## State Management

| Layer | Tool | Scope |
|-------|------|-------|
| Server | Next.js ISR (revalidate=300) | All data pages |
| Client (global) | React Query (staleTime=5min) | SpendingPoller polling |
| Client (local) | useState | ImpactGenerator form, LastUpdated timer |

## Data Flow: SSR → Client Hydration

```
SSR: page.tsx → getSpendingData() → cache → API → render HTML
                                                      │
Hydrate: SpendingPoller(initialData=SSR_result)       │
           └── useQuery(['spending'], poll /api/spending every 5min)
                 └── CounterHero animates to new value
                 └── StatsBar updates execution %
                 └── Comparisons recomputed (deterministic hash)
```
