# Regras Estritas do Projeto

## Dados e Transparencia

- **PROIBIDO** usar dados mock, placeholder ou hardcoded em producao ou preview
- **PROIBIDO** exibir secao sem dados reais - use renderizacao condicional
- **OBRIGATORIO** mostrar periodo de referencia em todo dado publico (ex: "Jan-Dez 2024")
- **OBRIGATORIO** mostrar a fonte dos dados (ex: "Portal da Transparencia")
- **OBRIGATORIO** tratar estados vazios com mensagem clara ("Dados indisponiveis para este periodo")

## Arquitetura NestJS (apps/api)

- Cada feature em seu proprio modulo: `<feature>.module.ts`, `<feature>.controller.ts`, `<feature>.service.ts`
- Controllers delegam para services - ZERO logica de negocio em controllers
- Services recebem dependencias via constructor injection do NestJS DI
- Prisma access SOMENTE via `PrismaService` injetado - nunca instanciar `PrismaClient` diretamente
- DTOs validados com class-validator ou Zod em pipes
- Retornos seguem formato envelope: `{ data, meta?, error? }`

## Arquitetura Next.js (apps/web)

- **Ler `node_modules/next/dist/docs/` antes de usar qualquer API do Next.js 16**
- Server Components por padrao - `'use client'` somente quando necessario (interatividade, hooks, browser APIs)
- Route handlers em `app/api/` sao BFF thin - delegam para `apps/api`
- Componentes de UI reutilizaveis em `components/ui/`
- Data fetching via React Query (`@tanstack/react-query`) no client, `fetch` no server
- URL state com `nuqs` - nao usar `useState` para filtros/paginacao que devem ser compartilhaveis

## Monorepo (Nx)

- Tipos compartilhados em `libs/shared/types/`
- Utils compartilhados em `libs/shared/utils/`
- **PROIBIDO** importar diretamente entre apps (`apps/web` nao importa de `apps/api` e vice-versa)
- Comunicacao entre apps SOMENTE via HTTP (API REST)
- Imports de libs usam path aliases definidos em `tsconfig.base.json`

## Banco de Dados (Prisma)

- Schema em `apps/api/prisma/schema.prisma` - fonte unica de verdade
- Migracoes via `make prisma-migrate` - NUNCA alterar banco manualmente
- Usar `@@map("snake_case")` para nomes de tabelas e `@map("snake_case")` para colunas
- Indexes obrigatorios em foreign keys e campos usados em WHERE/ORDER BY frequentes
- Dados da API do Portal da Transparencia armazenados em snapshots com `SyncJob` de rastreabilidade

## Testes

- Vitest para unit tests (web + api) - config em `apps/*/vitest.config.ts`
- Playwright para E2E - config em `e2e/playwright.config.ts`
- Cobertura minima: 80%
- Rodar com `make test` (unit) ou `npm run test:e2e` (E2E)
- Mocks somente para APIs externas - banco de testes real para integration tests

## Performance

- Componentes pesados com `lazy()` + `Suspense`
- Listas grandes com virtualizacao ou paginacao server-side
- Imagens com `next/image` e dimensoes explicitas
- Cache Redis para respostas da API do Portal da Transparencia (TTL minimo 1h)
- Prisma queries com `select` explicito - NUNCA `findMany()` sem filtros em tabelas grandes

## Estilo de Codigo

- TypeScript strict mode - sem `any`, sem `as` desnecessario
- Nomes de variaveis e funcoes em ingles
- Comentarios de UI em portugues (labels, textos, acessibilidade)
- Max 400 linhas por arquivo, 50 linhas por funcao
- Early returns para evitar nesting profundo (max 3 niveis)
- Formatacao com ESLint config do projeto - sem overrides locais
