<!-- Generated: 2026-03-22 | Files scanned: 12 | Token estimate: ~700 -->

# Data

## Database (PostgreSQL 16 via Prisma 7)

Schema: `apps/api/prisma/schema.prisma`

### Tables

```
sync_jobs
  id (uuid PK), jobType, status, startedAt, completedAt, durationMs
  recordsFetched, recordsFailed, errorMessage, metadata (JSON)
  → has many: raw_responses, politicians_snapshots, spending_snapshots, contract_snapshots
  Indexes: [jobType, status], [startedAt]

raw_responses
  id (uuid PK), source, endpointUrl, httpMethod, httpStatus
  responseHash (SHA256), responseBody (JSON), responseSizeBytes
  fetchedAt, durationMs, syncJobId (FK → sync_jobs)
  Indexes: [source, fetchedAt], [syncJobId], [responseHash]

politicians_snapshots
  id (uuid PK), version, periodo, deputados (JSON), senadores (JSON)
  emendas (JSON), viagens (JSON), cartoes (JSON)
  status, syncJobId (FK), createdAt, isLatest (bool)

spending_snapshots
  id (uuid PK), version, ano, totalPago, totalEmpenhado, totalLiquidado
  porOrgao (JSON), syncJobId (FK), createdAt, isLatest (bool)
  Index: [ano, isLatest]

contract_snapshots
  id (uuid PK), version, contratos (JSON), periodoInicio, periodoFim
  syncJobId (FK), createdAt, isLatest (bool)

display_snapshots
  id (uuid PK), pageRoute, componentName, dataType, dataSnapshotId
  servedAt, invalidatedAt
  Indexes: [pageRoute, servedAt], [dataType, dataSnapshotId]
```

## Shared Types (@raio-x/types)

```
SpendingSummary { totalPago, totalEmpenhado, totalLiquidado, porOrgao[], updatedAt, source }
DespesaPorOrgao { codigo, orgaoSuperior, despesaPaga, despesaEmpenhada, despesaLiquidada }
Contrato { id, dataVigencia*, valor*, objeto, fornecedor { nome, cnpj }, unidadeGestora }
PoliticiansData { deputados[], senadores[], partidos[], atualizadoEm, fonte }
DeputadoRanking { id, nome, partido, uf, urlFoto, despesaTotal, despesasPorTipo[] }
SenadorRanking { codigo, nome, partido, uf, urlFoto, despesaTotal }
PartidoResumo { sigla, nome, totalDeputados, totalSenadores, despesaTotal }
```

## Reference Constants (@raio-x/utils)

```
REFERENCES (46 values, sources: IBGE, FNDE, DIEESE, SIGTAP, ANP, 2024-2026)
  Income:     salarioMinimo=1621, cestaBasica=680
  Education:  escolaFNDE=5M, merenda=0.57, wifiEscolar=20k
  Health:     consultaSUS=10, ambulancia=310k, respirador=35k
  Housing:    casaPopular=200k (updated 270k in some refs)
  Transport:  onibus=800k
  Security:   viaturaPolicial=300k
  Culture:    quadraEsportiva=500k

convertToEquivalences(amount) → 10 metrics (salaries, schools, consults, etc.)
pickRandomComparisons(total, count) → deterministic seeded comparisons
```

## Cache Keys (Next.js layer)

| Key | TTL | Source |
|-----|-----|--------|
| `spending-{year}` | 300s | NestJS /api/v1/spending/summary |
| `contracts-recent-{days}` | 600s | NestJS /api/v1/spending/contracts |
| `politicians-data` | 3600s | NestJS /api/v1/politicians |
| `politicians-data` (cron) | 86400s | Pre-fetch (daily) |
