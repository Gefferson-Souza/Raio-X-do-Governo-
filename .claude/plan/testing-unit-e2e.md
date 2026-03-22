# Plano: Testes Unitarios NestJS + Testes E2E Playwright

## Task Type
- [x] Backend (testes unitarios NestJS com Vitest)
- [x] Frontend (testes E2E Playwright nas paginas criticas)
- [x] Fullstack

---

## Estado Atual

### Testes existentes (apps/web)
- 8 arquivos de teste, 75 testes, todos passam
- Cobertura: ~70% nos utils, ~55% no transparency.ts, ~96% no cache.ts
- Framework: Vitest + jsdom + @testing-library/react

### Testes inexistentes (apps/api)
- ZERO testes para o NestJS API
- 21 arquivos source sem nenhum .spec.ts
- Logica critica sem cobertura: parseBRNumber (agora em shared), snapshot versioning, audit hash

### E2E
- ZERO testes E2E
- Playwright NAO instalado
- 8 paginas sem cobertura de fluxo completo

---

## Parte 1 — Testes Unitarios NestJS

### Estrategia

Usar **Vitest** (mesmo framework do web) para consistencia no monorepo.
NestJS normalmente usa Jest, mas Vitest e compativel e ja esta configurado.

### Arquivos a criar

```
apps/api/src/
  __tests__/
    audit.service.spec.ts          ← AuditService (criar job, salvar raw response, completar job)
    spending.service.spec.ts       ← SpendingService (snapshot vazio, snapshot existente)
    spending.controller.spec.ts    ← SpendingController (validacao year, NaN, range)
    politicians.service.spec.ts    ← PoliticiansService (snapshot vazio, snapshot existente)
    contracts.service.spec.ts      ← ContractsService (snapshot vazio, snapshot existente)
    spending-sync.service.spec.ts  ← SpendingSyncService (sync completo, falha API, parseBRNumber)
    politicians-sync.service.spec.ts ← PoliticiansSyncService (deputies, senators, partial)
    health.controller.spec.ts      ← HealthController (banco ok, banco down)
```

### Prioridade por risco

| Arquivo | Risco | Linhas de Logica | Prioridade |
|---------|-------|------------------|-----------|
| `audit.service.spec.ts` | ALTO | SHA-256 hash, job lifecycle | P0 |
| `spending.controller.spec.ts` | ALTO | Validacao de input (NaN, range) | P0 |
| `spending.service.spec.ts` | MEDIO | Query snapshot, fallback error | P1 |
| `politicians.service.spec.ts` | MEDIO | Query snapshot, empty fallback | P1 |
| `contracts.service.spec.ts` | MEDIO | Query snapshot | P1 |
| `spending-sync.service.spec.ts` | ALTO | Fetch + parse + snapshot + audit | P0 |
| `politicians-sync.service.spec.ts` | ALTO | Batch processing, 513 deps | P0 |
| `health.controller.spec.ts` | BAIXO | Simple DB ping | P2 |

### O que cada teste cobre

#### audit.service.spec.ts (P0)
```
describe('AuditService')
  describe('saveRawResponse')
    - salva response com SHA-256 hash correto
    - calcula responseSizeBytes corretamente
    - associa ao syncJobId quando fornecido
    - salva sem syncJobId (null)
  describe('createSyncJob')
    - cria job com status "running"
    - cria job com jobType correto
  describe('completeSyncJob')
    - atualiza status para "completed"
    - atualiza status para "failed" com errorMessage
    - calcula durationMs corretamente (Date.now() - startedAt)
    - passa recordsFetched corretamente ao update
```

#### spending.controller.spec.ts (P0)
```
describe('SpendingController')
  describe('GET /spending/summary')
    - retorna dados quando snapshot existe
    - usa ano atual quando year nao fornecido
    - parseia year string para number
    - retorna 400 quando year=abc (NaN)
    - retorna 400 quando year=1999 (fora do range)
    - retorna 400 quando year=2101 (fora do range)
```

#### spending-sync.service.spec.ts (P0)
```
describe('SpendingSyncService')
  describe('syncAll')
    - cria SyncJob antes de iniciar
    - busca dados de todos os 16 orgaos
    - salva raw responses via AuditService
    - cria SpendingSnapshot com totais corretos
    - marca snapshot anterior como isLatest=false
    - incrementa version corretamente
    - completa job com status "completed" quando OK
    - completa job com status "failed" quando API key ausente
    - continua mesmo quando um orgao falha (graceful degradation)
    - respeita delay de 300ms entre requests (usar vi.useFakeTimers + vi.advanceTimersByTime)
```

#### politicians-sync.service.spec.ts (P0)
```
describe('PoliticiansSyncService')
  describe('syncAll')
    - busca todos os deputados (paginado)
    - busca despesas em batches de 10
    - busca senadores da API Codante
    - calcula status 'ok' quando tudo sucede
    - calcula status 'partial' quando parte falha
    - calcula status 'error' quando tudo falha
    - salva ranking completo (nao truncado)
  # fetchDeputadosRanking e fetchSenadoresRanking sao private — testar indiretamente via syncAll():
    - para apos maxPages (mock fetch retorna < 100 items na pagina 2)
    - calcula totalGasto por deputado corretamente
    - ordena ranking por totalGasto descrescente
    - gera topDespesas com top 5 tipos por deputado
    - senadores: tenta ano atual, fallback ano anterior
    - senadores: loga warning quando fetch de despesas falha
```

### Mock Strategy

```typescript
// Mock do PrismaService (DEVE incluir findFirst em syncJob — usado em completeSyncJob e sync services)
const mockPrisma = {
  syncJob: { create: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
  rawResponse: { create: vi.fn() },
  spendingSnapshot: { findFirst: vi.fn(), updateMany: vi.fn(), create: vi.fn() },
  politiciansSnapshot: { findFirst: vi.fn(), updateMany: vi.fn(), create: vi.fn() },
  contractSnapshot: { findFirst: vi.fn(), updateMany: vi.fn(), create: vi.fn() },
  $queryRaw: vi.fn(),
}

// Mock do fetch global (para sync services)
const mockFetch = vi.fn()
global.fetch = mockFetch

// Fake timers para testar delays (300ms, 2000ms) sem espera real
// Usar vi.useFakeTimers() no beforeEach e vi.advanceTimersByTime() nos testes de delay
```

### Configuracao Vitest para API

Criar `apps/api/vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import swc from 'unplugin-swc'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    // SWC necessario para emitDecoratorMetadata do NestJS (@Injectable, @Controller, etc.)
    swc.vite({ module: { type: 'es6' } }),
  ],
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/__tests__/**', 'src/main.ts'],
    },
  },
  resolve: {
    alias: {
      '@raio-x/utils': resolve(__dirname, '../../libs/shared/utils/src/index.ts'),
      '@raio-x/types': resolve(__dirname, '../../libs/shared/types/src/index.ts'),
    },
  },
})
```

Criar `apps/api/src/__tests__/setup.ts`:
```typescript
import 'reflect-metadata'
```

Instalar dependencia:
```bash
npm install --save-dev unplugin-swc @swc/core
```

Adicionar script ao package.json:
```json
"test:api": "vitest run --config apps/api/vitest.config.ts"
```

### Cobertura minima esperada: 80%

---

## Parte 2 — Testes E2E com Playwright

### Instalacao

```bash
npm install --save-dev @playwright/test
npx playwright install chromium
```

### Paginas a testar (por prioridade)

| Pagina | URL | Prioridade | O que testar |
|--------|-----|-----------|-------------|
| Home | `/` | P0 | Counter hero renderiza, stats bar visivel, contratos listados |
| Ranking | `/ranking` | P0 | Podium cards renderizam, execution bars visiveis |
| Politicos | `/politicos` | P0 | Lista de politicos carrega (via React Query), tabs funcionam |
| Carrinho | `/carrinho` | P1 | Contratos agrupados por fornecedor |
| Gerador | `/gerador` | P1 | Formulario funciona, preview do card gerado |
| Deputado detalhe | `/politicos/deputados/[id]` | P2 | Dados do deputado carregam |
| Congresso | `/politicos/congresso` | P2 | Analytics carregam |
| Partidos | `/politicos/partidos` | P2 | Breakdown por partido |

### Estrutura de testes E2E

```
e2e/
  playwright.config.ts
  tests/
    home.spec.ts              ← Dashboard principal
    ranking.spec.ts           ← Ranking de ministerios
    politicos.spec.ts         ← Hub de politicos
    carrinho.spec.ts          ← Contratos
    gerador.spec.ts           ← Gerador de impacto
    navigation.spec.ts        ← Navegacao entre paginas (top-nav, bottom-nav, side-nav)
  fixtures/
    base.fixture.ts           ← Fixture: intercepta /api/spending e /api/politicians com mock data,
                                 aguarda hydration do React Query, helpers de navegacao
```

### Cenarios E2E detalhados

#### home.spec.ts (P0)
```
describe('Home Page')
  - pagina carrega sem erro (status 200)
  - header com texto "RAIO-X" visivel (verificar texto exato no top-nav, pode nao ser "DO GOVERNO")
  - counter hero mostra valor em R$ (nao zero, nao NaN)
  - stats bar mostra "Empenhado", "Liquidado", "Pago"
  - pelo menos 1 contrato listado com valor
  - data source banner visivel ("DADOS AO VIVO" ou "ATUALIZADO EM")
  - CTA banner "GERADOR DE IMPACTO" visivel
  - equivalencias KPI renderizam (salarios minimos, cestas basicas)
```

#### ranking.spec.ts (P0)
```
describe('Ranking Page')
  - pagina carrega sem erro
  - podium com 3 ministerios (ouro, prata, bronze)
  - cada podium card mostra nome e valor
  - execution bars visiveis para ministerios 4-7
  - timeline de contratos recentes visivel
```

#### politicos.spec.ts (P0)
```
describe('Politicos Page')
  # IMPORTANTE: usar page.route() para interceptar /api/politicians e retornar dados mock
  # Sem isso, a pagina depende de dados reais que podem nao existir em dev
  - pagina carrega sem erro
  - interceptar /api/politicians com mock data → lista aparece
  - pelo menos 1 deputado com nome e partido visivel
  - navegacao para /politicos/congresso funciona
  - navegacao para /politicos/partidos funciona
```

#### navigation.spec.ts (P0)
```
describe('Navigation')
  - top-nav tem links para todas as paginas
  - bottom-nav visivel em mobile (viewport 375px)
  - side-nav visivel em desktop (viewport 1280px)
  - navegacao entre paginas nao quebra
  - todas as paginas retornam 200
```

#### gerador.spec.ts (P1)
```
describe('Gerador de Impacto')
  - formulario renderiza com orgaos reais
  - selecionar orgao atualiza valor
  - preview do card mostra equivalencia
  - botao "Compartilhar no WhatsApp" visivel
  - botao "Baixar Imagem" visivel
```

### Configuracao Playwright

```typescript
// e2e/playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: process.env.CI ? 'npm run build && npm run start' : 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
```

### Scripts no package.json

```json
"test:e2e": "playwright test --config=e2e/playwright.config.ts",
"test:e2e:ui": "playwright test --config=e2e/playwright.config.ts --ui",
"test:e2e:headed": "playwright test --config=e2e/playwright.config.ts --headed"
```

---

## Ordem de Execucao

### Fase 1: Infra de testes (30 min)
1. Criar `apps/api/vitest.config.ts`
2. Instalar Playwright + criar `e2e/playwright.config.ts`
3. Criar fixtures base
4. Adicionar scripts ao package.json

### Fase 2: Testes unitarios NestJS — P0 (2h)
5. `audit.service.spec.ts` — 10 testes
6. `spending.controller.spec.ts` — 6 testes
7. `spending-sync.service.spec.ts` — 10 testes (com mock fetch)
8. `politicians-sync.service.spec.ts` — 12 testes (com mock fetch)

### Fase 3: Testes unitarios NestJS — P1 (1h)
9. `spending.service.spec.ts` — 4 testes
10. `politicians.service.spec.ts` — 4 testes
11. `contracts.service.spec.ts` — 4 testes

### Fase 4: Testes E2E — P0 (1.5h)
12. `home.spec.ts` — 8 testes
13. `ranking.spec.ts` — 5 testes
14. `politicos.spec.ts` — 5 testes
15. `navigation.spec.ts` — 5 testes

### Fase 5: Testes E2E — P1 (1h)
16. `gerador.spec.ts` — 5 testes
17. `carrinho.spec.ts` — 3 testes

### Gate de qualidade
- [ ] `npm run test:api` — todos passam
- [ ] `npm run test:run` — 8 arquivos existentes + novos passam
- [ ] `npm run test:e2e` — desktop + mobile passam
- [ ] Cobertura API >= 80%
- [ ] Screenshots de falha salvos em `e2e/test-results/`

---

## Estimativa de testes

| Categoria | Arquivos | Testes | Status |
|-----------|----------|--------|--------|
| Unit (web) existentes | 8 | 75 | OK |
| Unit (API) novos | 8 | ~50 | A CRIAR |
| E2E novos | 6 | ~31 | A CRIAR |
| **TOTAL** | **22** | **~156** | |

---

## Key Files

| File | Operation | Description |
|------|-----------|-------------|
| `apps/api/vitest.config.ts` | Create | Config Vitest para NestJS |
| `apps/api/src/__tests__/audit.service.spec.ts` | Create | Testes AuditService (P0) |
| `apps/api/src/__tests__/spending.controller.spec.ts` | Create | Testes validacao input (P0) |
| `apps/api/src/__tests__/spending.service.spec.ts` | Create | Testes snapshot query (P1) |
| `apps/api/src/__tests__/spending-sync.service.spec.ts` | Create | Testes sync gastos (P0) |
| `apps/api/src/__tests__/politicians.service.spec.ts` | Create | Testes snapshot politicos (P1) |
| `apps/api/src/__tests__/politicians-sync.service.spec.ts` | Create | Testes sync politicos (P0) |
| `apps/api/src/__tests__/contracts.service.spec.ts` | Create | Testes snapshot contratos (P1) |
| `apps/api/src/__tests__/health.controller.spec.ts` | Create | Testes health check (P2) |
| `e2e/playwright.config.ts` | Create | Config Playwright |
| `e2e/tests/home.spec.ts` | Create | E2E dashboard (P0) |
| `e2e/tests/ranking.spec.ts` | Create | E2E ranking (P0) |
| `e2e/tests/politicos.spec.ts` | Create | E2E politicos (P0) |
| `e2e/tests/navigation.spec.ts` | Create | E2E navegacao (P0) |
| `e2e/tests/gerador.spec.ts` | Create | E2E gerador (P1) |
| `e2e/tests/carrinho.spec.ts` | Create | E2E carrinho (P1) |
| `package.json` | Modify | Adicionar scripts test:api, test:e2e |

## Risks and Mitigation

| Risk | Mitigation |
|------|------------|
| E2E flakey por dados da API | Usar `expect.soft()` para dados dinamicos, verificar apenas estrutura |
| Next.js dev server lento para E2E | `reuseExistingServer: true` no Playwright |
| Mock do fetch complexo nos sync tests | Criar helper `mockFetchResponse()` reutilizavel |
| Prisma mock verboso | Criar `createMockPrisma()` factory |

## SESSION_ID
- CODEX_SESSION: N/A
- GEMINI_SESSION: N/A
