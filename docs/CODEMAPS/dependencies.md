<!-- Generated: 2026-03-20 | Files scanned: 42 | Token estimate: ~500 -->

# Dependencies

## External Services

| Service | Purpose | Auth | Env Vars |
|---------|---------|------|----------|
| Portal da Transparência API | Federal spending + contracts data | API key header | `TRANSPARENCY_API_KEY` |
| Upstash Redis (optional) | Distributed cache | REST token | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| Google Fonts CDN | Material Symbols icon font | None | — |
| falabr.cgu.gov.br | External link (whistleblowing) | None | — |

## API Endpoints Used

```
Portal da Transparência (api.portaldatransparencia.gov.br/api-de-dados):
  GET /despesas/por-orgao?ano=&codigoOrgaoSuperior=&pagina=
  GET /contratos?dataInicial=&dataFinal=&codigoOrgao=&pagina=
  GET /ceis?pagina=  (sanctioned companies, defined but not actively used in pages)
```

## Runtime Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| next | 16.2.0 | Framework (SSR, ISR, API routes, edge) |
| react / react-dom | 19.2.4 | UI library |
| @tanstack/react-query | ^5.91.2 | Client-side data fetching + polling |
| framer-motion | ^12.38.0 | Counter animation (CounterHero) |
| nuqs | ^2.8.9 | URL query state (not actively used yet) |
| recharts | ^3.8.0 | Charts (not actively used yet) |
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
| SonarQube | docker-compose.sonar.yml + sonar-project.properties | Static analysis |
| Vitest | vitest.config.ts | Unit tests (jsdom) |
| ESLint | eslint.config.mjs | Linting (flat config) |
| PostCSS | postcss.config.mjs | Tailwind CSS processing |
