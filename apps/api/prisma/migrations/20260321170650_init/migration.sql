-- CreateTable
CREATE TABLE "sync_jobs" (
    "id" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "recordsFetched" INTEGER NOT NULL DEFAULT 0,
    "recordsFailed" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "metadata" JSONB,

    CONSTRAINT "sync_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw_responses" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "endpointUrl" TEXT NOT NULL,
    "httpMethod" TEXT NOT NULL DEFAULT 'GET',
    "httpStatus" INTEGER NOT NULL,
    "responseHash" TEXT NOT NULL,
    "responseBody" JSONB NOT NULL,
    "responseSizeBytes" INTEGER NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durationMs" INTEGER NOT NULL,
    "syncJobId" TEXT,

    CONSTRAINT "raw_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "politicians_snapshots" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "periodo" JSONB NOT NULL,
    "deputados" JSONB NOT NULL,
    "senadores" JSONB NOT NULL,
    "emendas" JSONB NOT NULL,
    "viagens" JSONB NOT NULL,
    "cartoes" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ok',
    "syncJobId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isLatest" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "politicians_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spending_snapshots" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "ano" INTEGER NOT NULL,
    "totalPago" DECIMAL(18,2) NOT NULL,
    "totalEmpenhado" DECIMAL(18,2) NOT NULL,
    "totalLiquidado" DECIMAL(18,2) NOT NULL,
    "porOrgao" JSONB NOT NULL,
    "syncJobId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isLatest" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "spending_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_snapshots" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "contratos" JSONB NOT NULL,
    "periodoInicio" TIMESTAMP(3) NOT NULL,
    "periodoFim" TIMESTAMP(3) NOT NULL,
    "syncJobId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isLatest" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "contract_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "display_snapshots" (
    "id" TEXT NOT NULL,
    "pageRoute" TEXT NOT NULL,
    "componentName" TEXT NOT NULL,
    "dataType" TEXT NOT NULL,
    "dataSnapshotId" TEXT NOT NULL,
    "servedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invalidatedAt" TIMESTAMP(3),

    CONSTRAINT "display_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sync_jobs_jobType_status_idx" ON "sync_jobs"("jobType", "status");

-- CreateIndex
CREATE INDEX "sync_jobs_startedAt_idx" ON "sync_jobs"("startedAt");

-- CreateIndex
CREATE INDEX "raw_responses_source_fetchedAt_idx" ON "raw_responses"("source", "fetchedAt");

-- CreateIndex
CREATE INDEX "raw_responses_syncJobId_idx" ON "raw_responses"("syncJobId");

-- CreateIndex
CREATE INDEX "raw_responses_responseHash_idx" ON "raw_responses"("responseHash");

-- CreateIndex
CREATE INDEX "politicians_snapshots_isLatest_idx" ON "politicians_snapshots"("isLatest");

-- CreateIndex
CREATE INDEX "politicians_snapshots_syncJobId_idx" ON "politicians_snapshots"("syncJobId");

-- CreateIndex
CREATE INDEX "spending_snapshots_ano_isLatest_idx" ON "spending_snapshots"("ano", "isLatest");

-- CreateIndex
CREATE INDEX "contract_snapshots_isLatest_idx" ON "contract_snapshots"("isLatest");

-- CreateIndex
CREATE INDEX "display_snapshots_pageRoute_servedAt_idx" ON "display_snapshots"("pageRoute", "servedAt");

-- CreateIndex
CREATE INDEX "display_snapshots_dataType_dataSnapshotId_idx" ON "display_snapshots"("dataType", "dataSnapshotId");

-- AddForeignKey
ALTER TABLE "raw_responses" ADD CONSTRAINT "raw_responses_syncJobId_fkey" FOREIGN KEY ("syncJobId") REFERENCES "sync_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "politicians_snapshots" ADD CONSTRAINT "politicians_snapshots_syncJobId_fkey" FOREIGN KEY ("syncJobId") REFERENCES "sync_jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spending_snapshots" ADD CONSTRAINT "spending_snapshots_syncJobId_fkey" FOREIGN KEY ("syncJobId") REFERENCES "sync_jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_snapshots" ADD CONSTRAINT "contract_snapshots_syncJobId_fkey" FOREIGN KEY ("syncJobId") REFERENCES "sync_jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
