<!-- Generated: 2026-03-20 | Files scanned: 56 | Token estimate: ~650 -->

# Dependencies

## External Services

| Service | Purpose | Auth | Env Vars |
|---------|---------|------|----------|
| Portal da Transparência API | Federal spending + contracts | API key header | `TRANSPARENCY_API_KEY` |
| Câmara dos Deputados API | Deputy roster + expenses | None (open) | — |
| Senate API (Codante) | Senator expenses + party data | None (open) | — |
| TSE API | Campaign financing (reserved) | None (open) | — |
| Upstash Redis (optional) | Distributed cache | REST token | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| Google Fonts CDN | Material Symbols icon font | None | — |
| falabr.cgu.gov.br | External link (whistleblowing) | None | — |

## API Endpoints Used

```
Portal da Transparência (api.portaldatransparencia.gov.br/api-de-dados):
  GET /despesas/por-orgao?ano=&codigoOrgaoSuperior=&pagina=
  GET /contratos?dataInicial=&dataFinal=&codigoOrgao=&pagina=
  GET /ceis?pagina=  (sanctioned companies, defined but not used in pages)

Câmara dos Deputados (dadosabertos.camara.leg.br/api/v2):
  GET /deputados?itens=&pagina=
  GET /deputados/{id}/despesas?ano=&itens=&pagina=

Senate / Codante (apis.codante.io):
  GET /senator-expenses
  GET /senator-expenses/parties

TSE (divulgacandcontas.tse.jus.br — reserved):
  GET /divulga/rest/v1/...
```

## Runtime Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| next | 16.2.0 | Framework (SSR, ISR, API routes, edge) |
| react / react-dom | 19.2.4 | UI library |
| @tanstack/react-query | ^5.91.2 | Client-side data fetching + polling |
| framer-motion | ^12.38.0 | Counter animation (CounterHero) |
| nuqs | ^2.8.9 | URL query state |
| recharts | ^3.8.0 | Charts |
| @upstash/redis | ^1.37.0 | Redis cache client |

## Dev Dependencies

| Package | Purpose |
|---------|---------|
| vitest + @vitest/coverage-v8 | Test runner + coverage |
| @testing-library/react + jest-dom | Component testing utilities |
| typescript ^5 | Type checking |
| tailwindcss ^4 | Styling (with @theme, @utility directives) |
| eslint ^9 + eslint-config-next | Linting |

## Infrastructure

| Tool | Config File | Purpose |
|------|-------------|---------|
| Vercel | vercel.json | Hosting + cron trigger (daily 6am) |
| SonarQube | docker-compose.sonar.yml + sonar-project.properties | Static analysis |
| Vitest | vitest.config.ts | Unit tests (jsdom) |
| ESLint | eslint.config.mjs | Linting (flat config) |
| PostCSS | postcss.config.mjs | Tailwind CSS processing |

## Environment Variables

```
TRANSPARENCY_API_KEY       (mandatory) Portal da Transparência auth
UPSTASH_REDIS_REST_URL     (optional)  Redis cache URL
UPSTASH_REDIS_REST_TOKEN   (optional)  Redis cache token
CRON_SECRET                (optional)  Cron endpoint verification
```
