# Implementation Plan: Real Data Integration

## Overview

Migrar todas as paginas de mock data para dados reais do Portal da Transparencia, com fallback gracioso, rate limiting, e indicadores de fonte de dados no UI.

---

## Task Type
- [x] Backend (Service layer, rate limiter, API fixes)
- [x] Frontend (Async Server Components, data source indicators)
- [x] Fullstack

---

## Seguranca

O token da API **NUNCA** vai para o frontend. Toda comunicacao com o Portal da Transparencia acontece server-side via:
- Next.js Server Components (renderizam no servidor)
- Next.js Route Handlers (executam no servidor)
- A variavel `TRANSPARENCY_API_KEY` nao tem prefixo `NEXT_PUBLIC_`, entao o Next.js **garante** que ela nao e incluida no bundle do browser.

### Rate Limits da API (regras oficiais)

| Horario | Limite |
|---------|--------|
| 00:00 - 06:00 | 700 req/min |
| 06:00 - 00:00 | 400 req/min |
| APIs restritas | 180 req/min |

**APIs restritas** (que NAO usamos, mas documentar):
- `/despesas/documentos-por-favorecido`
- `/bolsa-familia-*`
- `/auxilio-emergencial-*`
- `/seguro-defeso-codigo`

Exceder o limite = token suspenso por 0 hora (imediatamente, sem penalidade longa).

### Obtencao da Chave

1. Acessar `https://portaldatransparencia.gov.br/api-de-dados/cadastrar-email`
2. Autenticar via Gov.br com conta Nivel Verificado (Prata) ou Comprovado (Ouro), OU CPF/Senha com 2FA habilitado
3. Token enviado para o email cadastrado na conta Gov.br

---

## Problemas Identificados (Architect Review)

### CRITICAL
1. **Ano inconsistente**: mock-data usa 2026, route.ts usa 2025, pagina diz "2026"
2. **Paginacao sem limite**: `fetchSpendingSummary` faz loop infinito de paginas
3. **Mock data silencioso**: Plataforma de transparencia mostrando dados falsos sem aviso

### HIGH
4. **Paginas importam mock direto**: Nenhuma pagina chama a API real
5. **Sem validacao de runtime**: Respostas da API nao sao validadas (sem Zod)
6. **Dois mock data sources**: route.ts (trilhoes) vs mock-data.ts (milhoes) — valores incompativeis
7. **React Query instalado mas nao usado**: Dead weight no bundle

### MEDIUM
8. **Formato de data incorreto**: API espera DD/MM/YYYY, codigo nao converte
9. **In-memory cache nao sobrevive deploys**: Sem Redis, cada cold start = API calls
10. **Sem `.env.example`**: Devs nao sabem quais vars configurar

---

## Arquitetura Alvo

```
Pages (async Server Components)
    |
    v
Service Layer (spending-service.ts, contracts-service.ts)
  - Returns { data, source: 'live' | 'stale' | 'mock' }
  - Fallback chain: cache -> API -> stale -> mock
    |
    v
Rate Limiter (rate-limiter.ts)
  - Token bucket, time-aware (400/700 req/min)
    |
    v
Cache Layer (cache.ts) — ja existe
  - Redis (Upstash) + in-memory fallback
    |
    v
API Client (transparency.ts) — ja existe, precisa fixes
  - fetchWithRetry, bounded pagination
    |
    v
Portal da Transparencia API
```

---

## Implementation Steps

### Fase 1: Fixes criticos no API client

1. **Centralizar ano**: Criar constante `getCurrentYear()` em constants.ts
2. **Limitar paginacao**: Adicionar `MAX_PAGES = 50` em `fetchSpendingSummary`, com delay entre requests
3. **Formato de data**: Criar `formatDateForApi(iso: string): string` que converte YYYY-MM-DD → DD/MM/YYYY
4. **Consolidar mock data**: Remover mock inline do route.ts, importar de mock-data.ts
5. **Testes**: Atualizar testes existentes para cobrir os fixes

### Fase 2: Rate limiter

6. **Criar `src/lib/api/rate-limiter.ts`**: Token bucket com awareness de horario
   - 06:00-00:00: max 6 req/s (400/min)
   - 00:00-06:00: max 11 req/s (700/min)
   - Metodo `acquire()` que retorna Promise (aguarda slot disponivel)
7. **Integrar rate limiter** no `fetchWithRetry` do transparency.ts
8. **Testes**: Rate limiter unit tests

### Fase 3: Service layer

9. **Criar `src/lib/services/spending-service.ts`**:
   ```typescript
   export async function getSpendingData(year: number): Promise<{
     data: SpendingSummary
     source: 'live' | 'stale' | 'mock'
     cachedAt: string | null
   }>
   ```
   - Cache hit → return cached, source='live'
   - Cache miss + API key → fetch, cache, return source='live'
   - API error + stale cache → return stale, source='stale'
   - No cache + no API → return mock, source='mock'

10. **Criar `src/lib/services/contracts-service.ts`**:
    ```typescript
    export async function getRecentContracts(days: number): Promise<{
      data: Contrato[]
      source: 'live' | 'stale' | 'mock'
    }>
    ```

11. **Testes**: Service layer integration tests com mock fetch

### Fase 4: Migrar paginas para dados reais

12. **Homepage** (`page.tsx`): Converter para `async`, chamar `getSpendingData()` e `getRecentContracts()`, remover import de mock-data
13. **Ranking** (`ranking/page.tsx`): Idem — async, service layer, remover mock
14. **API Route** (`api/spending/route.ts`): Usar `getSpendingData()` ao inves de logica duplicada
15. **Carrinho**: Manter conteudo editorial, mas adicionar stats reais no header se API disponivel

### Fase 5: Data source indicators no UI

16. **Criar `src/components/ui/data-source-banner.tsx`**:
    - source='live': Badge verde "DADOS AO VIVO" com timestamp
    - source='stale': Badge amarelo "DADOS DE [timestamp]" com aviso
    - source='mock': Banner vermelho "DADOS ILUSTRATIVOS - Conecte a API para dados reais"

17. **Adicionar banner** no topo de cada pagina baseado no `source` retornado pelo service

### Fase 6: Environment e documentacao

18. **Criar `.env.example`** com todas as variaveis documentadas
19. **Criar `.env.local`** placeholder (sem valores reais, com instrucoes)
20. **Adicionar ISR config**: `export const revalidate = 300` nas paginas

### Fase 7: Cleanup

21. **Remover `@tanstack/react-query`** do package.json (nao e necessario para server-side fetching)
22. **Remover `nuqs`** (nao utilizado atualmente)
23. **Manter mock-data.ts** apenas como fallback, nao como import direto

---

## Key Files

| File | Operation | Description |
|------|-----------|-------------|
| `src/lib/api/transparency.ts` | Modify | Bounded pagination, rate limiter integration, date format |
| `src/lib/api/rate-limiter.ts` | Create | Token bucket rate limiter time-aware |
| `src/lib/services/spending-service.ts` | Create | Spending data with fallback chain |
| `src/lib/services/contracts-service.ts` | Create | Contracts data with fallback chain |
| `src/app/page.tsx` | Modify | Async Server Component, service layer |
| `src/app/ranking/page.tsx` | Modify | Async Server Component, service layer |
| `src/app/api/spending/route.ts` | Modify | Use service layer, fix year |
| `src/components/ui/data-source-banner.tsx` | Create | Live/stale/mock indicator |
| `.env.example` | Create | Documentacao de env vars |
| `src/lib/utils/constants.ts` | Modify | Add getCurrentYear() |

---

## Risks and Mitigation

| Risk | Prob | Impact | Mitigation |
|------|------|--------|------------|
| API retorna formato diferente do esperado | Media | Alto | Validacao com try/catch no service, fallback para mock |
| Rate limit excedido | Baixa | Medio | Token bucket + ISR (1 revalidation serves todos) |
| Token suspenso | Baixa | Alto | Rate limiter conservador, health check |
| Cold start sem cache | Media | Medio | ISR previne maioria dos cold starts |
| API fora do ar | Media | Medio | Fallback stale → mock com banner visivel |

---

## Decisoes

1. **Server-side only** (sem React Query) — mais simples, seguro, SEO-friendly
2. **ISR 5min** — balance entre freshness e rate limit
3. **Fallback explicito** — NUNCA mostrar mock silenciosamente
4. **Carrinho editorial** — manter conteudo curado, so enriquecer com stats reais
5. **Sem Zod v1** — validacao com try/catch por agora, Zod em v2

---

## SESSION_ID
- CODEX_SESSION: N/A
- GEMINI_SESSION: N/A
- ARCHITECT_REVIEW: ad88b84228f7893ca (completed)
