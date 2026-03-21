<!-- Generated: 2026-03-20 | Files scanned: 56 | Token estimate: ~800 -->

# Data

## No Database

All data sourced from external government APIs and cached ephemerally (Redis or in-memory).

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

## Politician Types (src/lib/api/camara-types.ts)

```
PoliticiansData {
  deputados: DeputadoResumo[]
  senadores: SenadorResumo[]
  partidos: PartidoResumo[]
  atualizadoEm: string       ISO timestamp
  fonte: 'live' | 'cached' | 'error'
}

DeputadoResumo {
  id, nome, siglaPartido, siglaUf: string
  urlFoto: string
  email: string
  despesaTotal: number
  despesasPorTipo: { tipoDespesa: string, valorTotal: number }[]
}

SenadorResumo {
  codigo, nome, siglaPartido, siglaUf: string
  urlFoto: string
  despesaTotal: number
}

PartidoResumo {
  sigla: string
  nome: string
  totalDeputados: number
  totalSenadores: number
  despesaTotal: number
}
```

## Cache Keys

| Key Pattern | TTL | Content |
|-------------|-----|---------|
| `spending-{year}` | 300s | SpendingSummary |
| `contracts-recent-{days}` | 600s | Contrato[] |
| `politicians-data` | 3600s | PoliticiansData |
| `politicians-data` (cron) | 86400s | PoliticiansData (24h for pre-fetch) |

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
External APIs
  ├── Portal da Transparência → transparency.ts (retry 3x, 300ms delay, 15s timeout)
  ├── Câmara dos Deputados    → camara.ts (paginated, bulk expense fetch)
  ├── Senado (Codante)        → senado.ts (bulk expenses + party summary)
  └── TSE                     → tse.ts (reserved, not actively used)
        │
        ▼
  cache.ts (Redis/in-memory, keyed by year/days/type)
        │
        ▼
  Services (spending-service, contracts-service, politicians-service)
        │
        ▼
  Server Components (page.tsx files) → SSR HTML
        │
        ▼
  Client Components (SpendingPoller, PoliticiansContent → poll API routes)
```
