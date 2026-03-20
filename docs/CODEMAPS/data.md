<!-- Generated: 2026-03-20 | Files scanned: 42 | Token estimate: ~600 -->

# Data

## No Database

This project has no persistent database. All data is sourced from the Portal da Transparência API
and cached ephemerally (Redis or in-memory).

## Core Types (src/lib/api/types.ts)

```
SpendingSummary {
  totalPago: number           Total spending (R$)
  totalEmpenhado: number      Total committed budget
  totalLiquidado: number      Total settled
  totalOrcamento: number      Total budget approved
  porOrgao: DespesaPorOrgao[] Per-ministry breakdown
  updatedAt: string           ISO timestamp
  source: 'live' | 'cached' | 'error'
}

DespesaPorOrgao {
  codigo, codigoOrgaoSuperior: number
  orgaoSuperior: string       Ministry name
  despesaPaga: number         Paid amount
  despesaEmpenhada: number    Committed
  despesaLiquidada: number    Settled
  orcamentoRealizado: number  Budget executed
}

Contrato {
  id: string
  dataVigenciaInicio/Fim: string
  valorInicialCompra: number
  valorFinalCompra: number
  objeto: string              Contract description
  compra: { numero, tipo }
  fornecedor: { nome, cnpjFormatado }
  unidadeGestora: { orgaoVinculado: { codigoSIAFI, nome } }
}
```

## Cache Keys

| Key Pattern | TTL | Content |
|-------------|-----|---------|
| `spending-{year}` | 300s | SpendingSummary |
| `contracts-recent-{days}` | 600s | Contrato[] |

## Reference Constants (src/lib/utils/constants.ts)

```
REFERENCES = {
  salarioMinimo:     1_621        R$/month (2025)
  cestaBasica:       680          R$/month
  escolaFNDE:        5_000_000    R$/school
  consultaSUS:       10           R$/consultation
  populacaoBR:       213_400_000  people
  familiaMedia:      3.3          people/family
  casaPopular:       200_000      R$/house
  vacinaDose:        50           R$/dose
  onibus:            800_000      R$/bus
  quadraEsportiva:   500_000      R$/court
  wifiEscolar:       20_000       R$/school
}
```

## Data Flow Summary

```
Portal da Transparência API
  │
  ▼
transparency.ts (parse BR numbers, retry, rate limit)
  │
  ▼
cache.ts (Redis/in-memory, keyed by year/days)
  │
  ▼
services (spending-service, contracts-service)
  │
  ▼
Server Components (page.tsx) → SSR HTML
  │
  ▼
Client Components (SpendingPoller → /api/spending → same service chain)
```
