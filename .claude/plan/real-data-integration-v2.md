# Implementation Plan: Real Data Integration v2

## Overview

Migrar o app de mock data para dados reais do Portal da Transparencia. A chave API ja esta configurada e testada (HTTP 200). Este plano corrige tipos, parametros, e remove todo mock data.

---

## Descobertas da Verificacao da API

### Campos reais vs tipos atuais

**`/despesas/por-orgao` — resposta REAL:**
```json
{
  "ano": 2025,
  "orgao": "Secretaria Executiva - MEC",
  "codigoOrgao": "26101",
  "orgaoSuperior": "Ministério da Educação",
  "codigoOrgaoSuperior": "26000",
  "empenhado": "108.009.379.079,09",    // STRING com formato BR
  "liquidado": "95.234.567.890,12",     // STRING
  "pago": "89.123.456.789,00"           // STRING
}
```

**Nosso `types.ts` ATUAL (ERRADO):**
```typescript
interface DespesaPorOrgao {
  nomeOrgao: string          // ERRADO — API retorna "orgao"
  nomeOrgaoSuperior: string  // ERRADO — API retorna "orgaoSuperior"
  valorEmpenhado: number     // ERRADO — API retorna "empenhado" como STRING
  valorPago: number          // ERRADO — API retorna "pago" como STRING
}
```

### Parametros obrigatorios

| Endpoint | Parametros minimos |
|----------|-------------------|
| `/despesas/por-orgao` | `ano` + `pagina` + pelo menos 1 filtro adicional (ex: `orgaoSuperior`) |
| `/contratos` | `dataInicial` + `dataFinal` + `codigoOrgao` |
| `/ceis` | `pagina` (sem filtros extras obrigatorios) |

### Rate Limits (regras oficiais atualizadas)

| Horario | Limite |
|---------|--------|
| 00:00 - 06:00 | 700 req/min |
| 06:00 - 00:00 | 400 req/min |
| APIs restritas | 180 req/min |

Exceder = token suspenso imediatamente (0h).

---

## Task Type
- [x] Backend (fix types, API client, service layer)
- [x] Frontend (async pages, data source indicators)
- [x] Fullstack

---

## Implementation Steps

### Fase 1: Corrigir tipos para match com API real

**File: `src/lib/api/types.ts`**

1. Reescrever `DespesaPorOrgao` para match com resposta real:
```typescript
interface DespesaPorOrgaoRaw {
  ano: number
  orgao: string              // era "nomeOrgao"
  codigoOrgao: string
  orgaoSuperior: string      // era "nomeOrgaoSuperior"
  codigoOrgaoSuperior: string
  empenhado: string          // STRING BR "108.009.379.079,09"
  liquidado: string          // STRING BR
  pago: string               // STRING BR
}

interface DespesaPorOrgao {
  ano: number
  orgao: string
  codigoOrgao: string
  orgaoSuperior: string
  codigoOrgaoSuperior: string
  empenhado: number           // Parsed para number
  liquidado: number
  pago: number
}
```

2. Reescrever `Contrato` baseado na resposta real (campos: `id`, `numero`, `objeto`, `compra`, `situacaoContrato`, `modalidadeCompra`, `unidadeGestora`).

3. Criar funcao `parseBRNumber(value: string): number` para converter "108.009.379.079,09" → 108009379079.09

4. Criar funcao `transformDespesa(raw: DespesaPorOrgaoRaw): DespesaPorOrgao` que parseia os campos monetarios.

### Fase 2: Corrigir API client

**File: `src/lib/api/transparency.ts`**

5. Fix `fetchDespesasPorOrgao`: Estrategia para buscar TODOS os orgaos superiores:
   - Primeiro buscar lista de orgaos superiores via `/despesas/por-orgao` com filtro generico
   - OU usar abordagem alternativa: buscar `/despesas/recursos-recebidos` que pode nao ter a restricao de filtro
   - OU buscar com `codigoOrgaoSuperior` para os ~30 orgaos superiores do governo federal
   - Adicionar `MAX_PAGES = 30` guard
   - Adicionar delay de 200ms entre requests

6. Fix `fetchContratos`: Adicionar parametro obrigatorio `codigoOrgao`. Criar funcao que busca contratos de MULTIPLOS orgaos em sequencia.

7. Fix `fetchSpendingSummary`: Usar os dados corrigidos, parsear strings BR para numeros.

8. Adicionar `formatDateForApi(date: Date): string` que retorna DD/MM/YYYY.

### Fase 3: Rate limiter

**File: `src/lib/api/rate-limiter.ts`** (novo)

9. Token bucket simples:
   - Bucket com capacity baseado no horario (400 ou 700 req/min)
   - `acquire()`: aguarda slot disponivel
   - Integrar no `fetchWithRetry`

### Fase 4: Service layer

**File: `src/lib/services/spending-service.ts`** (novo)

10. `getSpendingData(year)`:
    - Retorna `{ data: SpendingSummary, source: 'live' | 'cached' | 'error' }`
    - Chain: cache → API → fallback com erro explicito
    - SEM fallback silencioso para mock

**File: `src/lib/services/contracts-service.ts`** (novo)

11. `getRecentContracts(days, orgaoCodes)`:
    - Busca contratos dos ultimos N dias para lista de orgaos
    - Retorna `{ data: Contrato[], source: 'live' | 'cached' | 'error' }`

### Fase 5: Migrar paginas

**File: `src/app/page.tsx`**

12. Converter para `async` Server Component:
    - Chamar `getSpendingData(currentYear)` e `getRecentContracts(30)`
    - Remover `import { mockSpendingSummary, mockContratos } from '@/lib/mock-data'`
    - Adicionar `export const revalidate = 300`
    - Mostrar `DataSourceBanner` baseado no `source`
    - Se `source === 'error'`: mostrar mensagem de erro amigavel, nao dados falsos

**File: `src/app/ranking/page.tsx`**

13. Idem — async, service layer, remover mock imports.

**File: `src/app/carrinho/page.tsx`**

14. A pagina Carrinho e editorial — os 6 itens de luxo sao conteudo curado, NAO vem da API. Manter o conteudo editorial. Remover referencia ao mock-data se houver. Opcionalmente, o stats bar no topo pode mostrar totais reais.

**File: `src/app/api/spending/route.ts`**

15. Simplificar: usar `getSpendingData()` do service layer. Remover MOCK_SUMMARY inline.

### Fase 6: Data source indicator

**File: `src/components/ui/data-source-banner.tsx`** (novo)

16. Componente que mostra:
    - `source='live'`: Nada ou badge discreto "DADOS AO VIVO"
    - `source='cached'`: Badge "DADOS ATUALIZADOS EM [timestamp]"
    - `source='error'`: Banner vermelho "ERRO AO CARREGAR DADOS - Tente novamente"

### Fase 7: Cleanup

17. **DELETAR** `src/lib/mock-data.ts` — zero mock data
18. **Remover** `@tanstack/react-query` e `nuqs` do package.json (nao usados)
19. **Criar** `.env.example` com documentacao
20. **Atualizar** testes para usar dados de teste locais (nao mock-data.ts)

### Fase 8: Validacao

21. Build: `npx next build` — deve passar
22. Testes: `npx vitest run` — deve passar
23. Dev server: verificar todas as 4 paginas com Playwright
24. Verificar que a API esta retornando dados reais (checar `X-Data-Source: api` header)

---

## Key Files

| File | Operation | Description |
|------|-----------|-------------|
| `src/lib/api/types.ts` | Rewrite | Match com resposta REAL da API |
| `src/lib/api/transparency.ts` | Rewrite | Fix params, add transforms, rate limit |
| `src/lib/api/rate-limiter.ts` | Create | Token bucket rate limiter |
| `src/lib/services/spending-service.ts` | Create | Spending data com fallback chain |
| `src/lib/services/contracts-service.ts` | Create | Contracts data com fallback chain |
| `src/app/page.tsx` | Modify | Async, service layer, remove mock |
| `src/app/ranking/page.tsx` | Modify | Async, service layer, remove mock |
| `src/app/carrinho/page.tsx` | Modify | Remove mock refs se houver |
| `src/app/api/spending/route.ts` | Simplify | Use service layer |
| `src/components/ui/data-source-banner.tsx` | Create | Source indicator |
| `src/lib/mock-data.ts` | DELETE | Zero mock data |
| `.env.example` | Create | Documentacao env vars |

---

## Risks

| Risk | Mitigation |
|------|------------|
| API retorna campos extras/diferentes | Transform layer + try/catch no service |
| Strings BR nao parseiam corretamente | Unit tests para parseBRNumber |
| Endpoint exige filtros nao documentados | Test all endpoints antes de integrar |
| Rate limit estourado durante dev | Rate limiter + ISR (1 request per 5min) |
| Sem dados = pagina quebra | Service retorna source='error', UI mostra mensagem |

---

## Ordem de Execucao com Revisao

1. **Fase 1-2**: Fix tipos + API client → **Agente reviewer valida**
2. **Fase 3-4**: Rate limiter + service layer → **Agente reviewer valida**
3. **Fase 5-6**: Migrar paginas + banner → **Agente reviewer valida**
4. **Fase 7-8**: Cleanup + validacao final → **Build + testes + Playwright**

Cada fase DEVE ter build verde antes de avancar.

---

## SESSION_ID
- CODEX_SESSION: N/A
- GEMINI_SESSION: N/A
