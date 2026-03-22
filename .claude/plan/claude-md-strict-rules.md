# Plan: Melhorar CLAUDE.md e definir regras estritas

## Task Type
- [x] Fullstack

## Mudancas Realizadas

### 1. CLAUDE.md (reescrito)
- Documentacao completa do stack com versoes
- Mapa da arquitetura (apps/web, apps/api, libs)
- Descricao de cada modulo NestJS e estrutura Next.js
- Schema do banco de dados e models principais
- Todos os comandos Make uteis
- 8 regras absolutas do projeto

### 2. `.claude/rules/project-rules.md` (novo)
Regras estritas organizadas por dominio:
- **Dados e Transparencia**: zero mock, periodos obrigatorios, fontes explicitas
- **NestJS**: modulos, DI, Prisma via service, formato envelope
- **Next.js 16**: server components, React Query, nuqs, BFF thin
- **Monorepo**: isolamento de apps, libs compartilhadas
- **Prisma**: schema como fonte de verdade, migracoes via Make
- **Testes**: 80% cobertura, Vitest + Playwright
- **Performance**: lazy loading, cache Redis, select explicito
- **Estilo**: strict TS, max 400 linhas, early returns

### Arquivos Modificados
| Arquivo | Operacao | Descricao |
|---------|----------|-----------|
| CLAUDE.md | Reescrito | Documentacao completa do projeto |
| .claude/rules/project-rules.md | Criado | Regras estritas por dominio |
