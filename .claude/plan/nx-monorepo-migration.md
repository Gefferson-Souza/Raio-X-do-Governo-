# Plano de Migracao: Next.js → Nx Monorepo (NestJS + Next.js)

## Task Type
- [x] Backend (NestJS API, PostgreSQL, sync jobs, audit layer)
- [x] Frontend (Next.js refactor, simplified data fetching)
- [x] Infrastructure (Nx monorepo, Docker, deploy strategy)
- [x] Fullstack

---

## Visao Geral

### Estado Atual (snapshot 2026-03-20)

O projeto e um monolito Next.js 16 com 56 arquivos (6.615 linhas) que consome 4 APIs do governo brasileiro:

| API | Client | Linhas | Status |
|-----|--------|--------|--------|
| Portal da Transparencia | `transparency.ts` | 289 | Ativo: despesas, contratos, emendas, viagens, cartoes |
| Camara dos Deputados | `camara.ts` | 84 | Ativo: deputados + despesas (limitado a 40/513) |
| Senado (Codante) | `senado.ts` | 103 | Ativo: senadores + partidos |
| TSE | `tse.ts` | 61 | Reservado (nao utilizado nas paginas) |

### Tres Problemas Concretos

**1. Performance no `/politicos` (CRITICO)**
O cron em `src/app/api/cron/politicians/route.ts:52` faz `deputados.slice(0, 40)` — busca apenas 40 de 513 deputados porque o `maxDuration = 300` nao permite mais. O cron ja executa 7 tarefas em paralelo (deputados, senadores, partidos, emendas, viagens, cartoes, ano anterior) e ainda assim atinge o limite.

**2. Auditabilidade zero (ALTO em ano eleitoral)**
Nenhuma resposta de API e salva. Se a Camara retornar dados errados, nao ha como provar o que chegou. O cache (Redis + in-memory) e efemero e perde dados a cada deploy.

**3. Escala dos crons no Vercel (MEDIO)**
O `vercel.json` tem um unico cron (`0 6 * * *`). O plano do mapa orcamentario (SICONFI) adicionaria outro cron pesado. O free tier do Vercel limita duracoes e frequencias.

### O Que Ja Existe e Funciona

Antes de migrar, e critico reconhecer o que NAO precisa ser reescrito:

| Componente | Loc | Reutilizavel? |
|------------|-----|---------------|
| Types (`types.ts` + `camara-types.ts`) | 253 linhas | SIM — direto para shared lib |
| Utils (`format.ts`, `equivalences.ts`, `constants.ts`, `comparisons.ts`) | 510 linhas | SIM — zero acoplamento com Next.js (exceto `share.ts` 47 linhas — browser-only, fica no web) |
| API Clients (`transparency.ts`, `camara.ts`, `senado.ts`, `tse.ts`) | 537 linhas | PARCIAL — precisam adaptar para DI do NestJS |
| Cache (`cache.ts`) | 69 linhas | PARCIAL — abstrair para NestJS CacheModule |
| UI Components (13 componentes) | ~700 linhas | SIM — ficam no Next.js |
| Pages (8 paginas) | ~1.674 linhas | REFATORAR — trocar data source |

---

## Fase 0 — Coleta e Versionamento das Specs das APIs

### Objetivo
Ter todas as specs em JSON versionado. Serve para: gerar tipos, testes de contrato, cadeia de custodia legal.

### APIs a Documentar

**Camara dos Deputados**
- Spec: `https://dadosabertos.camara.leg.br/api/v2/api-docs` (OpenAPI 3.0 completo)
- Endpoints ativamente usados pelo projeto:
  - `GET /deputados` (paginado, `camara.ts:fetchAllDeputados`)
  - `GET /deputados/{id}/despesas` (paginado, `camara.ts:fetchDespesasDeputado`)

**Portal da Transparencia**
- Swagger UI: `https://api.portaldatransparencia.gov.br/swagger-ui/index.html`
- Spec provavel: `/v3/api-docs` ou `/api-docs` (verificar via DevTools Network)
- Rate limits documentados no `real-data-integration.md`:
  - 06:00-00:00: 400 req/min
  - 00:00-06:00: 700 req/min
  - Exceder = token suspenso imediatamente
- Endpoints ativamente usados:
  - `GET /despesas/por-orgao` (16 orgaos, `transparency.ts`)
  - `GET /contratos` (8 orgaos, `transparency.ts`)
  - `GET /emendas-parlamentares` (paginado, `transparency.ts`)
  - `GET /viagens` (ultimos 30 dias, `transparency.ts`)
  - `GET /cartoes` (ultimos 3 meses, `transparency.ts`)

**Senado Federal (Codante)**
- Base: `https://apis.codante.io/senator-expenses`
- Sem spec OpenAPI — documentar manualmente os 3 endpoints usados:
  - `GET /senators` (`senado.ts:fetchSenadores`)
  - `GET /senator-expenses/parties` (`senado.ts:fetchResumoPartidos`)
  - Resposta inclui ranking e totais por senador

**SICONFI (Tesouro Nacional)** — futuro, para mapa orcamentario
- Base: `https://apidatalake.tesouro.gov.br/ords/siconfi/tt/`
- Endpoints planejados: `GET /entes`, `GET /rreo` (Anexos 01-03)
- 82 requests por cron (27 estados x 3 anexos + populacao)

**IBGE** — futuro, para mapa orcamentario
- `https://servicodados.ibge.gov.br/api/v3/malhas/` (GeoJSON)
- `https://apisidra.ibge.gov.br/values/` (populacao)

### Estrutura de Arquivos

```
docs/api-specs/
  camara.openapi.json          ← download direto
  transparencia.openapi.json   ← captura via DevTools
  senado-codante.openapi.json  ← manual (3 endpoints)
  siconfi.openapi.json         ← futuro
  ibge.openapi.json            ← futuro
```

### Criterio de Conclusao
- [ ] Todas as specs baixadas e versionadas no git
- [ ] Cada endpoint usado pelo projeto esta documentado na spec
- [ ] Commit com data de captura no message

---

## Fase 1 — Estrutura do Monorepo Nx

### Topologia

```
raio-x-do-governo/
  apps/
    web/                  ← Next.js 16 (frontend atual, refatorado)
    api/                  ← NestJS 10 (backend novo)
  libs/
    shared/
      types/              ← Interfaces TS (extraidas de types.ts + camara-types.ts)
      utils/              ← format.ts, equivalences.ts, constants.ts, comparisons.ts (share.ts fica no web — browser-only)
    api-clients/
      camara/             ← Client HTTP (extraido de camara.ts, 84 linhas)
      transparencia/      ← Client HTTP (extraido de transparency.ts, 289 linhas)
      senado/             ← Client HTTP (extraido de senado.ts, 103 linhas)
      tse/                ← Client HTTP (extraido de tse.ts, 61 linhas)
      siconfi/            ← Client HTTP (novo, para mapa)
      ibge/               ← Client HTTP (novo, para mapa)
    data-access/
      database/           ← Prisma schema + migrations + repositories
      cache/              ← Abstracao Redis (extraida de cache.ts, 69 linhas)
      audit/              ← Modulo de auditoria (entidades + repositorios)
  tools/
    openapi-codegen/      ← Script para gerar types a partir das specs
  docs/
    api-specs/            ← JSONs das specs (Fase 0)
    CODEMAPS/             ← Documentacao tecnica (ja existe)
```

### Mapa de Migracao Arquivo-por-Arquivo

**Direto para `libs/shared/types/`** (copiar sem alteracao):
```
src/lib/api/types.ts         → libs/shared/types/src/transparency.ts
src/lib/api/camara-types.ts  → libs/shared/types/src/politicians.ts
```

**Direto para `libs/shared/utils/`** (copiar sem alteracao):
```
src/lib/utils/format.ts              → libs/shared/utils/src/format.ts
src/lib/utils/equivalences.ts        → libs/shared/utils/src/equivalences.ts
src/lib/utils/constants.ts           → libs/shared/utils/src/constants.ts
src/lib/utils/comparisons.ts         → libs/shared/utils/src/comparisons.ts
src/lib/utils/aggregate-orgaos.ts    → libs/shared/utils/src/aggregate-orgaos.ts
src/lib/utils/empty-politicians-data.ts → libs/shared/utils/src/empty-politicians-data.ts
```

**Refatorar para `libs/api-clients/`** (remover acoplamento com Next.js):
```
src/lib/api/transparency.ts  → libs/api-clients/transparencia/src/client.ts
  - Remover import de cache.ts (cache sera injetado via DI no NestJS)
  - Manter fetchWithRetry, rate limiting, parseBRNumber
  - Exportar como funcoes puras que recebem config via parametro

src/lib/api/camara.ts        → libs/api-clients/camara/src/client.ts
src/lib/api/senado.ts        → libs/api-clients/senado/src/client.ts
src/lib/api/tse.ts           → libs/api-clients/tse/src/client.ts
```

**Refatorar para `libs/data-access/cache/`**:
```
src/lib/api/cache.ts         → libs/data-access/cache/src/cache.service.ts
  - Converter para classe CacheService com interface ICacheProvider
  - RedisProvider e MemoryProvider como implementacoes
```

**Ficam em `apps/web/`** (sem alteracao significativa):
```
src/app/layout.tsx
src/app/page.tsx              ← refatorar data source (Fase 4)
src/app/ranking/page.tsx      ← refatorar data source
src/app/carrinho/page.tsx     ← refatorar data source
src/app/gerador/page.tsx      ← refatorar data source (importa spending + contracts)
src/app/politicos/**          ← refatorar data source
src/app/api/og/route.tsx      ← manter no Next.js (edge runtime)
src/components/**             ← sem alteracao
src/app/globals.css           ← sem alteracao
```

**Migram para `apps/api/`** (viram modulos NestJS):
```
src/app/api/spending/route.ts              → apps/api/src/spending/spending.controller.ts
src/app/api/politicians/route.ts           → apps/api/src/politicians/politicians.controller.ts
src/app/api/cron/politicians/route.ts      → apps/api/src/sync/politicians-sync.service.ts
src/lib/services/spending-service.ts       → apps/api/src/spending/spending.service.ts
src/lib/services/contracts-service.ts      → apps/api/src/spending/contracts.service.ts
src/lib/services/politicians-service.ts    → apps/api/src/politicians/politicians.service.ts
```

### Namespace de Imports

```typescript
// Antes (Next.js monolito)
import { SpendingSummary } from '@/lib/api/types'
import { formatBRL } from '@/lib/utils/format'

// Depois (Nx monorepo)
import { SpendingSummary } from '@raio-x/types'
import { formatBRL } from '@raio-x/utils'
```

### Decisoes de Design

1. **`apps/api` (NestJS) e o unico processo que toca APIs do governo**. O `apps/web` (Next.js) so consulta o NestJS.
2. **`libs/` sao pacotes internos do Nx**, sem publicacao npm. TypeScript paths resolvem imports.
3. **Prisma como ORM** (nao TypeORM). Razao: schema-first, migracao declarativa, melhor tooling para Supabase.

### Criterio de Conclusao
- [ ] `nx build web` — build do Next.js passa
- [ ] `nx build api` — build do NestJS passa
- [ ] Todos os 8 testes existentes passam (`nx test web`)
- [ ] Import paths `@raio-x/*` resolvem corretamente
- [ ] Zero alteracao de comportamento visivel ao usuario

---

## Fase 2 — Banco de Dados e Schema de Auditoria

### Tecnologia

**PostgreSQL via Supabase** (projeto novo, separado do Forno.dev).
Conexao direta via Prisma (sem SDK Supabase, sem overhead de RLS para dados publicos).

### Schema PostgreSQL (Prisma)

#### Camada 1 — Raw Responses (IMUTAVEL)

```prisma
model RawResponse {
  id            String   @id @default(uuid())
  source        String   // 'camara' | 'transparencia' | 'senado' | 'tse' | 'siconfi' | 'ibge'
  endpointUrl   String
  httpMethod    String   @default("GET")
  httpStatus    Int
  responseHash  String   // SHA-256 do body
  responseBody  Json     // JSONB — o JSON exatamente como chegou
  responseSizeBytes Int
  fetchedAt     DateTime @default(now())
  durationMs    Int      // tempo de resposta
  syncJobId     String?
  syncJob       SyncJob? @relation(fields: [syncJobId], references: [id])

  @@index([source, fetchedAt])
  @@index([syncJobId])
  @@index([responseHash])
  @@map("raw_responses")
}
```

**Regras**: Nunca UPDATE ou DELETE. Apenas INSERT. Particionamento por mes se crescer.

**Estimativa de storage** (com 513 deputados — ver addendum item 6 para detalhes):
- Cron diario: ~600 raw responses (513 deputados x ~3 paginas + senadores + emendas + viagens + cartoes)
- raw_responses: ~46 MB/dia (deputados) + ~3 MB/dia (outros) = ~50 MB/dia
- processed_data + snapshots: ~1.5 MB/dia
- **Total: ~1.5 GB/mes**
- Supabase free tier (500MB) NAO suporta — precisa Pro ($25/mes) ou compressao/particionamento

#### Camada 2 — Processed Data (VERSIONADO)

```prisma
model PoliticiansSnapshot {
  id              String   @id @default(uuid())
  version         Int      // gerenciado pela aplicacao (MAX(version)+1 por snapshot_key)
  periodo         Json     // { anoAtual: 2026, anoAnterior: 2025 }
  deputados       Json     // { ranking: DeputadoRanking[], totalGasto, totalGastoAnoAnterior }
  senadores       Json     // { ranking: SenadorRanking[], porPartido, totalGasto }
  emendas         Json     // { topAutores, totalPago, totalEmpenhado }
  viagens         Json     // { recentes, totalGasto }
  cartoes         Json     // { topPortadores, totalGasto }
  status          String   // 'ok' | 'partial' | 'error'
  syncJobId       String
  syncJob         SyncJob  @relation(fields: [syncJobId], references: [id])
  createdAt       DateTime @default(now())
  isLatest        Boolean  @default(true)

  @@index([isLatest])
  @@index([syncJobId])
  @@map("politicians_snapshots")
}

model SpendingSnapshot {
  id              String   @id @default(uuid())
  version         Int      // gerenciado pela aplicacao (MAX(version)+1 por snapshot_key)
  ano             Int
  totalPago       Decimal  @db.Decimal(18, 2)
  totalEmpenhado  Decimal  @db.Decimal(18, 2)
  totalLiquidado  Decimal  @db.Decimal(18, 2)
  porOrgao        Json     // DespesaPorOrgao[]
  syncJobId       String
  syncJob         SyncJob  @relation(fields: [syncJobId], references: [id])
  createdAt       DateTime @default(now())
  isLatest        Boolean  @default(true)

  @@index([ano, isLatest])
  @@map("spending_snapshots")
}

model ContractSnapshot {
  id              String   @id @default(uuid())
  version         Int      // gerenciado pela aplicacao (MAX(version)+1 por snapshot_key)
  contratos       Json     // Contrato[]
  periodoInicio   DateTime
  periodoFim      DateTime
  syncJobId       String
  syncJob         SyncJob  @relation(fields: [syncJobId], references: [id])
  createdAt       DateTime @default(now())
  isLatest        Boolean  @default(true)

  @@index([isLatest])
  @@map("contract_snapshots")
}
```

#### Camada 3 — Display Snapshots (DEFESA LEGAL)

```prisma
model DisplaySnapshot {
  id                String    @id @default(uuid())
  pageRoute         String    // '/politicos', '/ranking', '/'
  componentName     String    // 'SpendingPoller', 'PoliticiansContent'
  dataType          String    // 'politicians' | 'spending' | 'contracts'
  dataSnapshotId    String    // FK polimorfica (app-level, nao Prisma @relation — pode apontar para politicians/spending/contract snapshot)
  servedAt          DateTime  @default(now())
  invalidatedAt     DateTime? // quando um novo snapshot tomou o lugar
  requestIp         String?   // hash do IP (para auditoria, nao tracking)
  userAgent         String?

  @@index([pageRoute, servedAt])
  @@index([dataType, dataSnapshotId])
  @@map("display_snapshots")
}
```

#### Sync Jobs (ORQUESTRACAO)

```prisma
model SyncJob {
  id              String   @id @default(uuid())
  jobType         String   // 'politicians' | 'spending' | 'contracts' | 'mapa'
  status          String   // 'running' | 'completed' | 'partial' | 'failed'
  startedAt       DateTime @default(now())
  completedAt     DateTime?
  durationMs      Int?
  recordsFetched  Int      @default(0)
  recordsFailed   Int      @default(0)
  errorMessage    String?
  metadata        Json?    // detalhes especificos do job

  rawResponses          RawResponse[]
  politiciansSnapshots  PoliticiansSnapshot[]
  spendingSnapshots     SpendingSnapshot[]
  contractSnapshots     ContractSnapshot[]

  @@index([jobType, status])
  @@index([startedAt])
  @@map("sync_jobs")
}
```

### Politica de Retencao

| Tabela | Retencao | Razao |
|--------|----------|-------|
| `raw_responses` | 6 meses | Cadeia de custodia, depois compactar para hash-only |
| `*_snapshots` | 12 meses | Historico de versoes, audit trail |
| `display_snapshots` | 3 meses | Defesa legal em periodo eleitoral |
| `sync_jobs` | 12 meses | Observabilidade |

### Criterio de Conclusao
- [ ] `prisma migrate dev` roda sem erro
- [ ] Tabelas criadas no Supabase
- [ ] Seed com dados de teste
- [ ] Indices verificados com `EXPLAIN ANALYZE`

---

## Fase 3 — Arquitetura do NestJS

### Modulos

```
apps/api/src/
  app.module.ts
  main.ts
  ├── sync/
  │   ├── sync.module.ts
  │   ├── sync.service.ts          ← orquestrador de jobs
  │   ├── politicians-sync.service.ts  ← migrado de cron/politicians/route.ts
  │   ├── spending-sync.service.ts
  │   ├── contracts-sync.service.ts
  │   └── mapa-sync.service.ts     ← futuro (SICONFI)
  ├── politicians/
  │   ├── politicians.module.ts
  │   ├── politicians.controller.ts
  │   └── politicians.service.ts
  ├── spending/
  │   ├── spending.module.ts
  │   ├── spending.controller.ts
  │   └── spending.service.ts
  ├── contracts/
  │   ├── contracts.module.ts
  │   ├── contracts.controller.ts
  │   └── contracts.service.ts
  ├── audit/
  │   ├── audit.module.ts
  │   ├── audit.service.ts
  │   ├── audit.interceptor.ts     ← interceptor global que salva raw responses
  │   └── display-snapshot.service.ts
  ├── health/
  │   ├── health.module.ts
  │   └── health.controller.ts
  └── admin/
      ├── admin.module.ts
      └── admin.controller.ts      ← painel de auditoria (Fase 5)
```

### Endpoints REST

```
# Politicos
GET /api/v1/politicians                      → PoliticiansSnapshot mais recente
GET /api/v1/politicians/deputies             → Ranking de deputados
GET /api/v1/politicians/deputies/:id         → Detalhe de um deputado
GET /api/v1/politicians/senators             → Ranking de senadores
GET /api/v1/politicians/parties              → Resumo por partido
GET /api/v1/politicians/amendments           → Top autores de emendas
GET /api/v1/politicians/travels              → Viagens recentes
GET /api/v1/politicians/corporate-cards      → Cartao corporativo

# Gastos
GET /api/v1/spending/summary?year=2026       → SpendingSnapshot mais recente
GET /api/v1/spending/by-ministry?year=2026   → Breakdown por orgao
GET /api/v1/spending/contracts?days=30       → Contratos recentes

# Health
GET /api/v1/health                           → Status de banco, Redis, APIs externas

# Admin (protegido)
GET /api/v1/admin/sync-jobs                  → Ultimos 50 sync jobs
GET /api/v1/admin/sync-jobs/:id              → Detalhes de um job
GET /api/v1/admin/raw-responses/:id          → JSON bruto de uma resposta
GET /api/v1/admin/display-snapshots          → O que esteve no ar em qual periodo
```

### Estrategia de Crons (SEM LIMITE DE DURACAO)

| Job | Schedule | Duracao Estimada | Descricao |
|-----|----------|------------------|-----------|
| `sync-deputies` | `0 5 * * *` | 25-35 min | **513 deputados** em batches de 10, delay 2s entre batches |
| `sync-senators` | `0 5 * * *` | 2-3 min | ~81 senadores, API Codante (rapida) |
| `sync-spending` | `0 6 * * *` | 3-5 min | 16 orgaos, delay 300ms |
| `sync-contracts` | `0 6 * * *` | 2-3 min | 8 orgaos, ultimos 30 dias |
| `sync-amendments` | `0 6 * * *` | 1-2 min | Emendas parlamentares (3 paginas) |
| `sync-travels` | `0 6 * * *` | 1-2 min | Viagens oficiais (30 dias) |
| `sync-cards` | `0 6 * * *` | 1-2 min | Cartao corporativo (3 meses) |
| `sync-mapa` | `0 7 * * 1` | 5-10 min | SICONFI (82 requests, futuro) |
| `health-check` | `*/15 * * * *` | 10s | Ping banco + Redis + APIs |

**Diferenca crucial**: O cron atual (`cron/politicians/route.ts`) roda TUDO em uma unica funcao de 300s. No NestJS, cada sync e um job independente com seu proprio `SyncJob` no banco.

### Sync Job Architecture

```typescript
// Pseudo-code do orquestrador
class SyncService {
  async runPoliticiansSync() {
    const job = await this.createSyncJob('politicians')

    try {
      // Fase 1: Fetch raw data (salva em raw_responses)
      const deputados = await this.deputiesSync.fetchAll(job.id)  // 513 deps
      const senadores = await this.senatorsSync.fetchAll(job.id)
      const partidos = await this.partiesSync.fetchAll(job.id)
      const emendas = await this.amendmentsSync.fetchAll(job.id)
      const viagens = await this.travelsSync.fetchAll(job.id)
      const cartoes = await this.cardsSync.fetchAll(job.id)

      // Fase 2: Process (cria snapshot versionado)
      const snapshot = await this.buildPoliticiansSnapshot(...)

      // Fase 3: Publish (marca como isLatest, invalida anterior)
      await this.publishSnapshot(snapshot)

      await this.completeSyncJob(job.id, 'completed')
    } catch (error) {
      await this.completeSyncJob(job.id, 'failed', error.message)
    }
  }
}
```

### Deploy do NestJS

**Recomendacao: Railway** ($5/mes free credit)

Razoes:
- Deploy com Dockerfile automatico
- Processo persistente (nao serverless)
- Suporte nativo a crons via `@nestjs/schedule`
- GitHub integration com auto-deploy
- Logs acessiveis pelo dashboard

```dockerfile
# apps/api/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx nx build api

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist/apps/api ./
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3001
CMD ["node", "main.js"]
```

**Variaveis de ambiente do NestJS**:
```
DATABASE_URL=postgresql://...@db.supabase.co:5432/postgres
REDIS_URL=redis://...@upstash.io:6379
TRANSPARENCY_API_KEY=...
ADMIN_PASSWORD=...      ← basicauth para /admin
CORS_ORIGIN=https://raioxdogoverno.com
PORT=3001
```

### Criterio de Conclusao
- [ ] `nx serve api` inicia sem erro
- [ ] `GET /api/v1/health` retorna 200 com status de banco e Redis
- [ ] Pelo menos um sync job completa e persiste dados no banco
- [ ] Endpoints REST retornam dados do banco (nao das APIs direto)

---

## Fase 4 — Refatoracao do Next.js

### O Que Muda

O Next.js para de chamar APIs do governo. Em vez disso, chama o NestJS:

```typescript
// ANTES (apps/web/src/app/page.tsx)
const data = await getSpendingData(currentYear)  // chama Portal da Transparencia

// DEPOIS
const res = await fetch(`${process.env.API_URL}/api/v1/spending/summary?year=${currentYear}`)
const data = await res.json()  // chama NestJS que retorna do banco
```

### Mapa de Alteracoes no Frontend

| Arquivo | Alteracao | Complexidade |
|---------|-----------|-------------|
| `apps/web/src/app/page.tsx` (465 linhas) | Trocar `getSpendingData()` por fetch ao NestJS | MEDIA |
| `apps/web/src/app/ranking/page.tsx` (330 linhas) | Idem | MEDIA |
| `apps/web/src/app/carrinho/page.tsx` (279 linhas) | Trocar `getRecentContracts()` por fetch ao NestJS | BAIXA |
| `apps/web/src/app/gerador/page.tsx` (64 linhas) | Trocar `getSpendingData()` + `getRecentContracts()` por fetch ao NestJS | BAIXA |
| `apps/web/src/app/politicos/page.tsx` (28 linhas) | Trocar data source | BAIXA |
| `apps/web/src/app/politicos/deputados/[id]/page.tsx` (172 linhas) | Fetch individual do NestJS | MEDIA |
| `apps/web/src/app/politicos/congresso/page.tsx` (159 linhas) | Trocar data source | BAIXA |
| `apps/web/src/app/politicos/partidos/page.tsx` (177 linhas) | Trocar data source | BAIXA |
| `apps/web/src/components/ui/spending-poller.tsx` (184 linhas) | Polling aponta para NestJS (via proxy route) | BAIXA |
| `apps/web/src/components/ui/politicians-content.tsx` (429 linhas) | useQuery aponta para novo endpoint | BAIXA |

### O Que NAO Muda

- `apps/web/src/app/api/og/route.tsx` — MANTEM no Next.js (edge runtime, nao faz sentido no NestJS)
- `apps/web/src/components/providers.tsx` — React Query continua para client-side polling
- `apps/web/src/app/gerador/_components/impact-generator.tsx` — componente client, sem data source direto
- Todos os componentes de layout (`top-nav`, `side-nav`, `bottom-nav`, `footer`)
- Estilos (`globals.css`, Tailwind CSS 4)
- Fontes (Epilogue, Public Sans, Space Grotesk)

### O Que REMOVE do Next.js

```
DELETAR:
  apps/web/src/app/api/spending/route.ts        → moveu para NestJS
  apps/web/src/app/api/politicians/route.ts      → moveu para NestJS
  apps/web/src/app/api/cron/politicians/route.ts → moveu para NestJS
  apps/web/src/lib/services/*                    → moveram para NestJS
  apps/web/src/lib/api/cache.ts                  → moveu para lib shared

REMOVER DO package.json:
  @upstash/redis  → cache agora no NestJS
```

### Proxy Route (Transicao)

Durante a migracao, manter um proxy fino no Next.js para nao quebrar o frontend:

```typescript
// apps/web/src/app/api/spending/route.ts (transitorio)
export async function GET() {
  const year = new Date().getFullYear()
  const res = await fetch(`${process.env.API_URL}/api/v1/spending/summary?year=${year}`)
  const data = await res.json()
  return Response.json(data, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' }
  })
}
```

### Variaveis de Ambiente do Next.js (pos-migracao)

```
API_URL=https://api.raioxdogoverno.com    ← URL do NestJS
NEXT_PUBLIC_SITE_URL=https://raioxdogoverno.com
```

### Criterio de Conclusao
- [ ] Todas as paginas carregam dados do NestJS
- [ ] SpendingPoller faz polling via proxy que consulta NestJS
- [ ] PoliticiansContent carrega via React Query → NestJS
- [ ] Zero chamadas diretas a APIs do governo no Next.js
- [ ] Build passa, testes passam
- [ ] OG image generation continua funcionando no edge

---

## Fase 5 — Auditoria na Pratica (Ano Eleitoral)

### Painel `/admin/audit`

Protegido por basicauth (HTTP 401 sem credentials). Nao precisa de autenticacao elaborada — e interno.

**Telas:**

1. **Dashboard de Sync Jobs**
   - Tabela: ultimos 50 jobs com status (ok/partial/failed), duracao, contagem de registros
   - Filtro por tipo (politicians/spending/contracts)
   - Cor: verde/amarelo/vermelho por status

2. **Detalhe de um Sync Job**
   - Metadados: tipo, inicio, fim, duracao
   - Lista de raw responses com: endpoint, status HTTP, hash SHA-256, tamanho
   - Link para visualizar JSON bruto de cada response
   - Snapshot gerado pelo job (se houver)

3. **Rastreamento de Dados Exibidos**
   - "Qual dado esteve no ar em `/politicos` no dia 15/03/2026?"
   - Busca por rota + data → mostra o snapshot que estava ativo
   - Link para o sync job que gerou, link para os raw responses fonte

4. **Diff de Snapshots**
   - Compara versao N com versao N-1 de qualquer snapshot
   - Mostra campos que mudaram, valores antigos vs novos
   - Util para explicar "por que o numero mudou de ontem para hoje"

### Fluxo de Defesa

```
Questionamento: "Voce mostrou que o Deputado X gastou R$ 500.000 no dia 10/03"
                              |
                              v
1. Buscar display_snapshots WHERE pageRoute = '/politicos' AND servedAt <= '2026-03-10'
                              |
                              v
2. Encontrar dataSnapshotId → politicians_snapshots.id
                              |
                              v
3. Ver syncJobId → sync_jobs.id
                              |
                              v
4. Listar raw_responses WHERE syncJobId = job.id AND source = 'camara'
                              |
                              v
5. Abrir responseBody → JSON exato que a API da Camara retornou
                              |
                              v
6. Mostrar: "No dia 09/03 as 05:32, a API da Camara retornou este JSON
    com hash SHA-256 abc123. Nosso processamento gerou o ranking que ficou
    no ar de 09/03 05:33 ate 10/03 05:31."
```

Tempo de resposta: < 2 minutos.

---

## Fase 6 — Mapa Orcamentario (SICONFI + IBGE)

Este e o plano ja documentado em `.claude/plan/mapa-orcamentario.md`, agora integrado no NestJS:

### O Que Muda com NestJS

- O cron `sync-mapa` roda no NestJS (sem limite de 300s do Vercel)
- Os dados do SICONFI sao salvos como `MapaSnapshot` no banco (com raw responses)
- O Next.js consome `GET /api/v1/mapa/data` do NestJS
- GeoJSON dos estados fica em `public/geo/br-states.json` no Next.js

### Novos Modulos NestJS

```
apps/api/src/
  ├── mapa/
  │   ├── mapa.module.ts
  │   ├── mapa.controller.ts       ← GET /api/v1/mapa/data
  │   └── mapa.service.ts          ← le do banco
  └── sync/
      └── mapa-sync.service.ts     ← cron semanal, 82 requests SICONFI
```

### Novas Libs

```
libs/api-clients/
  ├── siconfi/src/client.ts        ← fetchEntes, fetchRREO
  └── ibge/src/client.ts           ← fetchPopulacao, fetchMalhas
```

---

## Fase 7 — Migracao Gradual (Timeline)

### Semana 1: Monorepo Nx + Libs

**Objetivo**: Mover o Next.js para `apps/web/` sem alterar comportamento. Extrair libs.

| Dia | Tarefa |
|-----|--------|
| 1 | `npx create-nx-workspace raio-x-do-governo --preset=empty` |
| 1 | Mover Next.js para `apps/web/`, ajustar configs |
| 2 | Extrair `libs/shared/types/` e `libs/shared/utils/` |
| 2 | Atualizar imports no Next.js para `@raio-x/*` |
| 3 | Extrair `libs/api-clients/*` (4 clients) |
| 3 | Extrair `libs/data-access/cache/` |
| 4 | Rodar todos os 8 testes existentes — devem passar |
| 5 | Configurar CI (build + test para ambos apps) |

**Gate**: `nx build web` + `nx test web` passam. Zero mudanca visivel.

### Semana 2: NestJS + Banco + SpendingModule

**Objetivo**: NestJS rodando com sync de gastos. Next.js ainda usa Route Handlers proprios.

| Dia | Tarefa |
|-----|--------|
| 1 | `nx generate @nx/nest:application api` |
| 2 | Configurar Prisma + criar schema (Fase 2) |
| 2 | `prisma migrate dev` no Supabase |
| 3 | Implementar SyncModule + SpendingSyncService |
| 3 | Implementar AuditModule + AuditInterceptor |
| 4 | Implementar SpendingModule (controller + service) |
| 4 | Testar: cron roda, dados no banco, endpoint retorna |
| 5 | Deploy NestJS no Railway |

**Gate**: `GET /api/v1/spending/summary` retorna dados do banco. Cron roda diariamente.

### Semana 3: Migrar `/politicos` para NestJS

**Objetivo**: A pagina com 503 agora consome dados pre-processados. 513 deputados.

| Dia | Tarefa |
|-----|--------|
| 1 | Migrar `cron/politicians/route.ts` para `PoliticiansSyncService` |
| 1 | Remover `slice(0, 40)` — buscar TODOS os 513 deputados |
| 2 | Implementar PoliticiansModule (controller + service) |
| 2 | Implementar batch processing (10 deps/batch, 2s delay) |
| 3 | Refatorar paginas `/politicos/*` no Next.js para consumir NestJS |
| 3 | Refatorar `PoliticiansContent` para novo endpoint |
| 4 | Testar fluxo completo: cron → banco → API → frontend |
| 5 | Verificar: 503 resolvido, dados de 513 deputados disponiveis |

**Gate**: `/politicos` carrega em < 2s com dados de TODOS os deputados. Zero 503.

### Semana 4: Contratos + Ranking + Admin

| Dia | Tarefa |
|-----|--------|
| 1 | Migrar ContractsService para NestJS |
| 2 | Refatorar `/ranking` e `/carrinho` no Next.js |
| 3 | Implementar AdminModule (painel de auditoria) |
| 4 | Remover Route Handlers antigos do Next.js |
| 5 | Remover `@upstash/redis` do Next.js |

**Gate**: Todas as paginas consomem NestJS. Painel de auditoria funcional.

### Semanas 5+: Mapa + Extras

- SICONFI + IBGE clients
- Sync de mapa (semanal)
- Pagina `/mapa` com react-simple-maps
- TSE integration (patrimonio declarado, futuro)

---

## Estrategia de Testes

### Testes Existentes (8 arquivos, manter funcionando)

```
src/__tests__/unit/api/transparency.test.ts  → mover para libs/api-clients/transparencia/
src/__tests__/unit/format.test.ts            → mover para libs/shared/utils/
src/__tests__/unit/api/types.test.ts         → mover para libs/shared/types/
src/__tests__/unit/equivalences.test.ts      → mover para libs/shared/utils/
src/__tests__/unit/aggregate-orgaos.test.ts  → mover para libs/shared/utils/
src/__tests__/unit/share.test.ts             → mover para libs/shared/utils/
src/__tests__/unit/api/cache.test.ts         → mover para libs/data-access/cache/
src/__tests__/unit/api/cache-redis-fallback.test.ts → idem
```

### Novos Testes Necessarios

| Modulo | Tipo | O Que Testar |
|--------|------|-------------|
| SyncService | Integration | Job cria, executa, persiste, completa |
| AuditInterceptor | Unit | Raw response salva com hash correto |
| PoliticiansController | E2E | Endpoint retorna snapshot mais recente |
| SpendingController | E2E | Endpoint retorna dados formatados |
| Prisma migrations | Integration | Schema aplica sem erro |
| Display snapshots | Unit | Registro correto de rota + timestamp |

### Cobertura Minima: 80%

---

## Checklist de Decisoes (JA RESPONDIDAS)

| # | Decisao | Resposta |
|---|---------|----------|
| 1 | Onde NestJS roda? | **Railway** ($5/mes free credit) |
| 2 | Supabase novo? | **Sim, projeto separado** |
| 3 | Redis compartilhado? | **Sim, Upstash free tier** (NestJS usa para cache de leitura) |
| 4 | Auth do `/admin`? | **Basicauth** (HTTP 401) |
| 5 | Geracao de tipos? | **Gerar uma vez e commitar** (openapi-generator-cli uma vez, depois manual) |
| 6 | ORM? | **Prisma** (schema-first, melhor para Supabase) |

---

## Riscos e Mitigacoes

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|---------------|---------|-----------|
| Nx + Next.js 16 incompativel | MEDIA | ALTO | Testar na Semana 1 antes de qualquer migracao |
| Supabase free tier storage insuficiente (~1.5GB/mes) | ALTA | ALTO | Supabase Pro ($25/mes) OU particionar + comprimir raw_responses |
| Railway free tier insuficiente | BAIXA | MEDIO | Upgrade para $5/mes se necessario |
| API da Camara rate limit para 513 deps | MEDIA | ALTO | Batch de 10, delay 2s, retry com backoff |
| Tempo de sync > 1 hora | BAIXA | BAIXO | Jobs independentes, nao bloqueiam uns aos outros |
| Regressao visual no frontend | MEDIA | MEDIO | Testes E2E com Playwright nas 4 paginas principais |
| CORS entre Next.js e NestJS | BAIXA | BAIXO | Configurar CORS_ORIGIN no NestJS |
| Downtime durante migracao | BAIXA | ALTO | Migracao gradual — Route Handlers do Next.js continuam ate NestJS estar pronto |

---

## Addendum: Insights dos Agentes Arquitetos

### Backend Architect — Descobertas Criticas

**1. BullMQ para sync jobs (RECOMENDACAO FORTE)**
O sync de 513 deputados precisa de controle de concorrencia profissional. `@nestjs/schedule` dispara o job, mas BullMQ gerencia a fila:
- Concurrency: 10 jobs simultaneos (vs 5 sequenciais atuais)
- Retry automatico: 3 tentativas com backoff
- Dead letter queue: jobs que falham 3x vao para DLQ para analise
- Progress tracking: visibilidade em tempo real do % completado
- Adicionar ao NestJS: `@nestjs/bullmq` + Redis como broker

**2. Codigo duplicado identificado**
- `parseBRNumber` duplicado em `transparency.ts:39` E `cron/politicians/route.ts:35` → extrair para `@raio-x/shared-utils`
- `buildDeputadosLite` em `politicians/route.ts:55-107` e copia de `buildDeputadosRanking` do cron → unificar em `DeputadosService.buildRanking(limit)`

**3. Falhas de resiliencia nos API clients**
- `camara.ts`: ZERO retry, ZERO timeout, ZERO abort controller. Um request travado bloqueia o batch inteiro
- `senado.ts`: Silenciosamente engole erros com `catch { continue }`. Sem log.
- `camara.ts:42`: `while (true)` com guard `if (batch.length < 100) break` (linha 52) — funciona para dados finitos mas sem maxPages explicito como safety net
- Correcao: `HttpRetryInterceptor` generico no NestJS que aplica retry + timeout + circuit breaker a todos os clients

**4. Cache Redis re-instanciado a cada chamada**
`cache.ts:15-19`: `getRedisClient()` cria nova instancia do `Redis` via dynamic import a cada request. No NestJS, o `RedisModule` injeta uma unica conexao compartilhada.

**5. Codante (Senado) e SPOF**
A API `apis.codante.io` e um proxy educacional de terceiros, NAO a API oficial do Senado. Risco: se Codante sair do ar, senadores somem. Mitigacao: migrar para API oficial do Senado Federal no futuro.

**6. Estimativa de storage revisada (com 513 deputados)**
| Categoria | Diario | Mensal |
|-----------|--------|--------|
| raw_responses (deputados) | ~46 MB | ~1.4 GB |
| raw_responses (outros) | ~3 MB | ~90 MB |
| processed_data | ~1 MB | ~30 MB |
| display_snapshots | ~0.5 MB | ~15 MB |
| **TOTAL** | **~50 MB/dia** | **~1.5 GB/mes** |

**Impacto**: Supabase free tier (500MB) NAO suporta. Opcoes:
- Plano Pro Supabase ($25/mes, 8GB)
- Particionar `raw_responses` por mes, arquivar partições > 3 meses
- Ou: salvar raw_responses comprimidos (gzip do JSON antes de inserir)

### Frontend Architect — Descobertas Criticas

**7. Tres padroes de data fetching distintos**
| Padrao | Paginas | Impacto na migracao |
|--------|---------|-------------------|
| SSR + ISR (Server Component) | `/`, `/ranking`, `/carrinho`, `/gerador` | Trocar service call por fetch NestJS |
| Client polling (React Query) | SpendingPoller, PoliticiansContent | Manter proxy route no Next.js |
| Client-only (zero SSR) | `/politicos/deputados/[id]`, `/congresso`, `/partidos` | Usam `initialDataUpdatedAt: 0` (sempre stale), forcam client fetch |

**Insight**: As 3 paginas de politicos (deputado detalhe, congresso, partidos) NAO tem SSR real — usam `EMPTY_POLITICIANS_DATA` como initialData. Com NestJS servindo dados pre-processados, podemos melhorar isso para SSR real.

**8. Proxy route e a opcao correta (nao chamada direta)**
| Criterio | Proxy (recomendado) | Direto |
|----------|-------------------|--------|
| CORS | Nenhum | NestJS precisa configurar |
| CDN cache | Same-origin funciona | Precisa CDN separado |
| Latencia extra | Negligivel (polling 5min) | Menor |
| Complexidade | Baixa | Media |

**9. share.ts e browser-only — EXCECAO**
`share.ts` usa `window.open()` e `document.createElement()`. NAO pode ir para shared lib. Fica em `apps/web/`.

**10. Tailwind CSS 4 no monorepo**
- Extrair `@theme inline` do `globals.css` para `libs/design-tokens/theme.css`
- Fontes via `next/font` ficam no layout do Next.js
- Remover declaracoes duplicadas de font-family no theme CSS
- Custom utility `@utility hard-shadow` precisa estar no CSS do app consumidor

**11. Nx 21.x minimo necessario**
Next.js 16 + React 19 requerem `@nx/next` 21+ e `@nx/react` 21+. Versoes anteriores NAO suportam.

**12. Respostas do NestJS devem preservar o envelope atual**
O frontend usa `source: 'live' | 'cached' | 'error'` e `status: 'ok' | 'partial' | 'error'` para renderizacao condicional. Se o NestJS retornar o MESMO formato, ZERO codigo de UI precisa mudar.

**13. Rollback strategy (feature flag)**
```
Fase A: NestJS roda em paralelo (1-2 semanas)
Fase B: Next.js usa NestJS com fallback para Route Handlers proprios (1 semana)
Fase C: Cutover total, desabilitar Vercel cron
Rollback: Reabilitar cron + flip feature flag (~5 minutos)
Fase D: Cleanup apos 2 semanas estavel
```

**14. React Query config pos-migracao**
Adicionar ao `providers.tsx`:
- `retry: 2` como default global (atualmente so `PoliticiansContent` tem retry)
- `gcTime` >= TTL do NestJS para manter stale data durante falhas de rede

---

## SESSION_ID
- CODEX_SESSION: N/A (codeagent-wrapper nao disponivel)
- GEMINI_SESSION: N/A (codeagent-wrapper nao disponivel)
- BACKEND_ARCHITECT: a8ca6588ffda0d8dc (completed, 232s, 59K tokens)
- FRONTEND_ARCHITECT: a99b47235e3dfaf28 (completed, 204s, 97K tokens)
