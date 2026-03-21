<!-- Generated: 2026-03-20 | Files scanned: 56 | Token estimate: ~950 -->

# Frontend

## Page Tree

```
app/
├── layout.tsx              RSC  Root: fonts, Providers, TopNav, SideNav, BottomNav, Footer
├── page.tsx                RSC  / → dashboard: counter, equivalences, contracts (revalidate=300)
├── ranking/page.tsx        RSC  /ranking → ministry podium, execution bars, timeline (revalidate=300)
├── carrinho/page.tsx       RSC  /carrinho → top 20 contracts, grouped by supplier (revalidate=300)
├── gerador/
│   ├── page.tsx            RSC  /gerador → static shell
│   └── _components/
│       └── impact-generator.tsx  CC  Interactive card generator with share preview (361 lines)
├── politicos/
│   ├── page.tsx            RSC  /politicos → overview with client hydration (28 lines)
│   ├── deputados/
│   │   └── [id]/page.tsx   RSC  /politicos/deputados/:id → deputy details (172 lines)
│   ├── congresso/page.tsx  RSC  /politicos/congresso → congress analytics (159 lines)
│   └── partidos/page.tsx   RSC  /politicos/partidos → party breakdown (177 lines)
└── api/
    ├── spending/route.ts        GET → SpendingSummary JSON
    ├── politicians/route.ts     GET → PoliticiansData JSON
    ├── cron/politicians/route.ts GET → Cron pre-fetch
    └── og/route.tsx             POST → OG image (edge)
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
│   │   ├── [/politicos]
│   │   │   └── PoliticiansContent   CC  Main display (429 lines, largest component)
│   │   │       ├── Deputy/Senator lists
│   │   │       ├── Party breakdowns
│   │   │       ├── Expense summaries
│   │   │       └── Badge (status/category indicators)
│   │   ├── [/politicos/deputados/:id]
│   │   │   └── Deputy detail: expenses, bio, LastUpdated
│   │   ├── [/politicos/congresso]
│   │   │   └── Congress analytics: spending charts, comparisons
│   │   ├── [/politicos/partidos]
│   │   │   └── Party breakdown: by-party spending, member counts
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
| Client (global) | React Query (refetchInterval=1h) | PoliticiansContent |
| Client (local) | useState | ImpactGenerator form, LastUpdated timer |

## Data Flow: SSR → Client Hydration

```
Spending flow:
  SSR: page.tsx → getSpendingData() → cache → API → render HTML
  Hydrate: SpendingPoller(initialData) → useQuery poll /api/spending every 5min

Politicians flow:
  SSR: page.tsx → getPoliticiansData() → cache → render HTML
  Hydrate: PoliticiansContent → useQuery /api/politicians (refetchInterval 1h)

Sharing flow:
  share.ts → WhatsApp / LinkedIn / Twitter / Image download
  OG preview → /api/og (edge-rendered 1200x630 image)
```
