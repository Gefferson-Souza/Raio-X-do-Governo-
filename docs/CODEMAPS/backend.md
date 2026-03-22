<!-- Generated: 2026-03-22 | Files scanned: 26 | Token estimate: ~800 -->

# Backend

## NestJS API Routes (prefix: /api/v1)

```
GET  /api/v1/health
  → HealthController.check → PrismaService.$queryRaw('SELECT 1')
  → { status: 'ok'|'degraded', checks: { database } }

GET  /api/v1/spending/summary?year=2026
  → SpendingController.getSummary → SpendingService.getLatestSnapshot(year)
  → PrismaService: spendingSnapshot.findFirst({ where: { ano, isLatest: true } })
  → { totalPago, totalEmpenhado, totalLiquidado, porOrgao[] }

GET  /api/v1/politicians
  → PoliticiansController.getAll → PoliticiansService.getLatestSnapshot()
  → PrismaService: politiciansSnapshot.findFirst({ where: { isLatest: true } })
  → { periodo, deputados, senadores, emendas, viagens, cartoes }

GET  /api/v1/spending/contracts
  → ContractsController.getRecent → ContractsService.getLatestSnapshot()
  → PrismaService: contractSnapshot.findFirst({ where: { isLatest: true } })
  → Contrato[] (last 30 days)

POST /api/v1/admin/trigger-sync/:type  (type: spending|politicians|contracts|all)
  → AdminController.triggerSync → *SyncService.syncAll()
  → Manual sync trigger (no auth — needs protection in prod)
```

## Next.js BFF Route Handlers (apps/web)

```
GET  /api/spending → spending-service.ts → fetch(NestJS /api/v1/spending/summary)
     Cache-Control: s-maxage=300, stale-while-revalidate=600

GET  /api/politicians → politicians-service.ts → fetch(NestJS /api/v1/politicians)
     Cache-Control: s-maxage=3600, stale-while-revalidate=86400

POST /api/cron/politicians → cron trigger (vercel.json daily 6am)

POST /api/og?valor=&item=&equivalencia= → edge OG image (1200x630)
```

## Sync Services (Cron: daily 5-6 AM)

```
SyncSchedulerService (@nestjs/schedule)
  5:00 AM → PoliticiansSyncService.syncAll()
    → Camara API (paginated, 10-page limit, 2s batch delay)
    → Codante API (senators + parties)
    → Creates PoliticiansSnapshot (isLatest=true, previous=false)

  6:00 AM → SpendingSyncService.syncAll()
    → Portal da Transparencia (16 agencies, 300ms delay)
    → Creates SpendingSnapshot (isLatest=true)

  6:00 AM → ContractsSyncService.syncAll()
    → Portal da Transparencia (8 agencies, 300ms delay, last 30 days)
    → Creates ContractSnapshot (isLatest=true)

All syncs:
  → AuditService.createSyncJob() at start
  → AuditService.saveRawResponse() per API call (SHA256 hash)
  → AuditService.completeSyncJob() at end (duration, counts)
```

## Module Dependency Graph

```
AppModule
  ├── ConfigModule (global, .env)
  ├── ScheduleModule (cron)
  ├── PrismaModule → PrismaService (global)
  ├── AuditModule → AuditService (global)
  ├── HealthModule → HealthController
  ├── SpendingModule → SpendingController, SpendingService
  ├── PoliticiansModule → PoliticiansController, PoliticiansService
  ├── ContractsModule → ContractsController, ContractsService
  ├── SyncModule → SpendingSyncService, PoliticiansSyncService, ContractsSyncService, SyncSchedulerService
  └── AdminModule → AdminController (imports SyncModule)
```

## Key Files (apps/api/src/)

```
main.ts              Entry: global prefix, CORS, ValidationPipe
app.module.ts        Root module, all imports
prisma.module.ts     PrismaService provider (global)
health/              Health check (DB connectivity)
spending/            Spending summary endpoint
politicians/         Politicians data endpoint
contracts/           Contracts endpoint
sync/                Cron sync services (spending, politicians, contracts)
audit/               Raw response logging, sync job tracking
admin/               Manual sync trigger
__tests__/           Vitest specs (audit, spending, sync)
```
