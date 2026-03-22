<!-- Generated: 2026-03-22 | Files scanned: 8 | Token estimate: ~600 -->

# Dependencies

## External Services

| Service | Purpose | Auth | Env Var |
|---------|---------|------|---------|
| Portal da Transparencia API | Federal spending + contracts | API key header | `TRANSPARENCY_API_KEY` |
| Camara dos Deputados API | Deputy roster + expenses | None (open) | - |
| Senate API (Codante) | Senator expenses + party data | None (open) | - |
| TSE API | Campaign financing (reserved) | None (open) | - |
| Upstash Redis (optional) | Distributed cache (prod) | REST token | `UPSTASH_REDIS_REST_URL/TOKEN` |

## API Endpoints Used

```
Portal da Transparencia (api.portaldatransparencia.gov.br/api-de-dados):
  GET /despesas/por-orgao?ano=&codigoOrgaoSuperior=&pagina=
  GET /contratos?dataInicial=&dataFinal=&codigoOrgao=&pagina=

Camara dos Deputados (dadosabertos.camara.leg.br/api/v2):
  GET /deputados?itens=&pagina=
  GET /deputados/{id}/despesas?ano=&itens=&pagina=

Senate / Codante (apis.codante.io):
  GET /senator-expenses
  GET /senator-expenses/parties
```

## Runtime Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| next | 16.2.0 | Frontend framework (SSR, ISR, App Router) |
| react / react-dom | 19.2.4 | UI library |
| @nestjs/common+core+platform-express | ^11.1.17 | Backend framework |
| @nestjs/config | ^4.0.3 | Environment config |
| @nestjs/schedule | ^6.1.1 | Cron jobs |
| @prisma/client | ^7.5.0 | Database ORM |
| @tanstack/react-query | ^5.91.2 | Client-side data fetching |
| @upstash/redis | ^1.37.0 | Redis cache client |
| framer-motion | ^12.38.0 | Animation (CounterHero) |
| nuqs | ^2.8.9 | URL query state |
| recharts | ^3.8.0 | Charts |
| rxjs | ^7.8.2 | NestJS reactive streams |

## Dev Dependencies

| Package | Purpose |
|---------|---------|
| vitest + @vitest/coverage-v8 | Test runner + coverage |
| @testing-library/react + jest-dom | Component testing |
| @playwright/test | E2E testing |
| prisma | Schema management + migrations |
| nx + @nx/next | Monorepo tooling |
| typescript ^5 | Type checking |
| tailwindcss ^4 | Styling |
| eslint ^9 + eslint-config-next | Linting |

## Infrastructure

| Tool | Config | Purpose |
|------|--------|---------|
| Docker Compose (dev) | docker-compose.dev.yml | PostgreSQL 16 (:5433) + Redis 7 (:6379) + pgAdmin + RedisInsight |
| Docker Compose (prod) | docker-compose.yml | PostgreSQL + Redis + NestJS API container |
| Vercel | vercel.json | Next.js hosting + cron |
| SonarQube | docker-compose.sonar.yml | Static analysis |
| Nx | nx.json | Monorepo build orchestration |
| Makefile | Makefile | Dev commands (dev, test, prisma, sonar, clean) |

## Environment Variables

```
DATABASE_URL              (required) PostgreSQL connection string
TRANSPARENCY_API_KEY      (required) Portal da Transparencia auth
REDIS_URL                 (required) Redis connection (local)
CORS_ORIGIN               (default: http://localhost:3000) NestJS CORS
PORT                      (default: 3001) NestJS port
API_URL                   (default: http://localhost:3001) Next.js → NestJS
UPSTASH_REDIS_REST_URL    (optional) Upstash Redis for prod
UPSTASH_REDIS_REST_TOKEN  (optional) Upstash Redis token
ADMIN_PASSWORD            (optional) Admin endpoint auth
CRON_SECRET               (optional) Cron endpoint verification
```
