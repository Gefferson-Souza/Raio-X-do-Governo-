-- CreateTable
CREATE TABLE "politicians" (
    "externalId" INTEGER NOT NULL,
    "house" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "partido" TEXT NOT NULL,
    "uf" TEXT NOT NULL,
    "foto" TEXT NOT NULL DEFAULT '',
    "email" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "politicians_pkey" PRIMARY KEY ("externalId","house")
);

-- CreateTable
CREATE TABLE "politician_expenses" (
    "id" TEXT NOT NULL,
    "politicianExtId" INTEGER NOT NULL,
    "politicianHouse" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "mes" INTEGER,
    "tipoDespesa" TEXT,
    "valor" DECIMAL(14,2) NOT NULL,
    "syncJobId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "politician_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "politicians_partido_idx" ON "politicians"("partido");

-- CreateIndex
CREATE INDEX "politicians_uf_idx" ON "politicians"("uf");

-- CreateIndex
CREATE INDEX "politicians_nome_idx" ON "politicians"("nome");

-- CreateIndex
CREATE INDEX "politicians_house_idx" ON "politicians"("house");

-- CreateIndex
CREATE INDEX "politician_expenses_politicianExtId_politicianHouse_ano_idx" ON "politician_expenses"("politicianExtId", "politicianHouse", "ano");

-- CreateIndex
CREATE INDEX "politician_expenses_ano_mes_idx" ON "politician_expenses"("ano", "mes");

-- CreateIndex
CREATE INDEX "politician_expenses_tipoDespesa_idx" ON "politician_expenses"("tipoDespesa");

-- AddForeignKey
ALTER TABLE "politician_expenses" ADD CONSTRAINT "politician_expenses_politicianExtId_politicianHouse_fkey" FOREIGN KEY ("politicianExtId", "politicianHouse") REFERENCES "politicians"("externalId", "house") ON DELETE RESTRICT ON UPDATE CASCADE;
