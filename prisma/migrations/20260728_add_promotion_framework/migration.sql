-- FASE 4 (Framework Universal de Promociones). Solo AÑADE: enum PromotionStatus
-- y tablas promotions, promotion_rules, promotion_actions, promotion_restrictions,
-- promotion_versions, promotion_audits. No altera ninguna tabla existente (el
-- modelo `Promocion`/`promociones` del marketplace queda intacto). Multi-tenant
-- por companyId. Ningún flujo de la app consume estas tablas todavía.

-- CreateEnum
CREATE TYPE "PromotionStatus" AS ENUM ('DRAFT', 'PENDING', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'SUSPENDED', 'ENDED', 'ARCHIVED', 'CANCELLED');

-- CreateTable
CREATE TABLE "promotions" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "categoria" TEXT,
    "status" "PromotionStatus" NOT NULL DEFAULT 'DRAFT',
    "prioridad" INTEGER NOT NULL DEFAULT 0,
    "inicioEn" TIMESTAMP(3),
    "finEn" TIMESTAMP(3),
    "config" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL DEFAULT 1,
    "creadoPorId" TEXT,
    "editadoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_rules" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotion_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_actions" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "params" JSONB NOT NULL DEFAULT '{}',
    "orden" INTEGER NOT NULL DEFAULT 0,
    "obligatoria" BOOLEAN NOT NULL DEFAULT true,
    "maxReintentos" INTEGER NOT NULL DEFAULT 0,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotion_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_restrictions" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "valor" INTEGER,
    "config" JSONB NOT NULL DEFAULT '{}',
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotion_restrictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_versions" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "resumen" TEXT,
    "creadoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotion_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_audits" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT,
    "accion" TEXT NOT NULL,
    "estadoAnterior" "PromotionStatus",
    "estadoNuevo" "PromotionStatus",
    "cambios" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotion_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "promotions_companyId_status_idx" ON "promotions"("companyId", "status");

-- CreateIndex
CREATE INDEX "promotions_companyId_prioridad_idx" ON "promotions"("companyId", "prioridad");

-- CreateIndex
CREATE INDEX "promotions_companyId_status_inicioEn_finEn_idx" ON "promotions"("companyId", "status", "inicioEn", "finEn");

-- CreateIndex
CREATE INDEX "promotion_rules_ruleId_idx" ON "promotion_rules"("ruleId");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_rules_promotionId_ruleId_key" ON "promotion_rules"("promotionId", "ruleId");

-- CreateIndex
CREATE INDEX "promotion_actions_promotionId_orden_idx" ON "promotion_actions"("promotionId", "orden");

-- CreateIndex
CREATE INDEX "promotion_restrictions_promotionId_idx" ON "promotion_restrictions"("promotionId");

-- CreateIndex
CREATE INDEX "promotion_versions_promotionId_idx" ON "promotion_versions"("promotionId");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_versions_promotionId_version_key" ON "promotion_versions"("promotionId", "version");

-- CreateIndex
CREATE INDEX "promotion_audits_promotionId_createdAt_idx" ON "promotion_audits"("promotionId", "createdAt");

-- CreateIndex
CREATE INDEX "promotion_audits_companyId_createdAt_idx" ON "promotion_audits"("companyId", "createdAt");

-- AddForeignKey
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_rules" ADD CONSTRAINT "promotion_rules_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_rules" ADD CONSTRAINT "promotion_rules_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_actions" ADD CONSTRAINT "promotion_actions_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_restrictions" ADD CONSTRAINT "promotion_restrictions_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_versions" ADD CONSTRAINT "promotion_versions_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_audits" ADD CONSTRAINT "promotion_audits_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_audits" ADD CONSTRAINT "promotion_audits_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

