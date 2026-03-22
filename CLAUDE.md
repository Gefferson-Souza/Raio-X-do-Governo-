# Raio-X do Governo

Plataforma de transparencia governamental brasileira. Dados 100% reais da API do Portal da Transparencia.

## Stack

| Camada | Tecnologia | Versao |
|--------|-----------|--------|
| Frontend | Next.js (App Router) + React + TailwindCSS | 16.x / 19.x / 4.x |
| Backend | NestJS + Prisma ORM | 11.x / 7.x |
| Database | PostgreSQL | 16 |
| Cache | Redis (local) / Upstash (prod) | - |
| Monorepo | Nx | 22.x |
| Testes | Vitest (unit) + Playwright (E2E) | 4.x / 1.x |
| Qualidade | SonarQube + ESLint | - |

## Arquitetura

```
raio-x-do-governo/
  apps/
    web/          # Next.js 16 (App Router) - porta 3000
    api/          # NestJS - porta 3001
  libs/
    shared/types/ # Tipos compartilhados
    shared/utils/ # Utilitarios compartilhados
  e2e/            # Testes E2E (Playwright)
```

### API (NestJS) - `apps/api/`

Modulos: `health`, `politicians`, `spending`, `contracts`, `audit`, `sync`

Cada modulo segue: `module.ts` + `controller.ts` + `service.ts`

Sync services (`sync/`) fazem ingestao periodica da API do Portal da Transparencia.

### Web (Next.js) - `apps/web/`

```
src/
  app/           # Pages (App Router)
    api/         # Route handlers (cron, og, politicians, spending)
    politicos/   # Paginas de politicos (deputados, partidos, congresso)
    ranking/     # Rankings
    gerador/     # Gerador de cards
  components/    # Componentes React (ui/, layout/, icons/)
  lib/           # Servicos, utils, API clients
  __tests__/     # Testes unitarios
```

### Banco de Dados

Schema Prisma em `apps/api/prisma/schema.prisma`. Models principais: `SyncJob`, `RawResponse`, `PoliticiansSnapshot`, `SpendingSnapshot`, `ContractSnapshot`.

## Comandos

```bash
make dev              # Sobe infra (Postgres+Redis) + instrucoes dev
make test             # Roda testes
make test-coverage    # Testes com cobertura
make build            # Build web + api
make prisma-migrate   # Rodar migracoes Prisma
make prisma-generate  # Gerar Prisma Client
make prisma-studio    # Abrir Prisma Studio
make sonar-scan       # SonarQube scan
make clean            # Limpar artefatos
```

## Regras Absolutas

1. **ZERO dados mock** - Todo dado exibido vem da API do Portal da Transparencia ou do banco. Secoes sem dados reais nao devem ser renderizadas.
2. **Next.js 16 nao e o que voce conhece** - Leia `node_modules/next/dist/docs/` antes de usar qualquer API. Convencoes e APIs podem diferir do training data.
3. **Imutabilidade** - NUNCA mude objetos in-place. Sempre crie novos.
4. **Periodo e fonte obrigatorios** - Todo dado publico deve mostrar o periodo de referencia e a fonte (ex: "Portal da Transparencia, Jan-Dez 2024").
5. **Mobile-first** - Publico-alvo: brasileiro medio, mobile, WhatsApp. Design para telas pequenas primeiro.
6. **Prisma para tudo** - Nao use SQL raw exceto para queries que Prisma nao suporta (ex: `CREATE INDEX CONCURRENTLY`).
7. **Validacao com Zod** - Toda entrada externa (API, user input) deve ser validada com schema Zod.
8. **Sem secrets no codigo** - Use variaveis de ambiente. Consulte `.env.example` para referencia.

@AGENTS.md
