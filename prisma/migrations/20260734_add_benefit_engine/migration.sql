-- FASE C (Benefit Engine). Solo AÑADE: enums BenefitType / BenefitGrantStatus
-- y tablas benefits + benefit_grants. No altera ninguna tabla existente.
-- Multi-tenant por companyId. Ningún flujo de la app consume estas tablas aún.

-- CreateEnum
CREATE TYPE "BenefitType" AS ENUM ('SERVICE_FREE', 'DISCOUNT', 'UPGRADE', 'PRODUCT', 'POINTS', 'CREDIT', 'TIME', 'EXPERIENCE', 'ACCESS', 'CUSTOM');

-- CreateEnum
CREATE TYPE "BenefitGrantStatus" AS ENUM ('GRANTED', 'REDEEMED', 'EXPIRED', 'REVOKED');

-- CreateTable
CREATE TABLE "benefits" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" TEXT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "categoria" TEXT NOT NULL,
    "tipo" "BenefitType" NOT NULL,
    "valorPercibido" DECIMAL(10,2),
    "costoReal" DECIMAL(10,2),
    "templateKey" TEXT,
    "config" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "benefits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "benefit_grants" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "benefitId" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "subscriberKind" TEXT NOT NULL DEFAULT 'CLIENT',
    "sourceModule" TEXT NOT NULL,
    "status" "BenefitGrantStatus" NOT NULL DEFAULT 'GRANTED',
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "redeemedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "meta" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "benefit_grants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "benefits_companyId_status_idx" ON "benefits"("companyId", "status");

-- CreateIndex
CREATE INDEX "benefits_companyId_categoria_idx" ON "benefits"("companyId", "categoria");

-- CreateIndex
CREATE INDEX "benefits_companyId_tipo_idx" ON "benefits"("companyId", "tipo");

-- CreateIndex
CREATE INDEX "benefit_grants_companyId_status_idx" ON "benefit_grants"("companyId", "status");

-- CreateIndex
CREATE INDEX "benefit_grants_benefitId_status_idx" ON "benefit_grants"("benefitId", "status");

-- CreateIndex
CREATE INDEX "benefit_grants_subscriberId_idx" ON "benefit_grants"("subscriberId");

-- CreateIndex
CREATE INDEX "benefit_grants_companyId_sourceModule_idx" ON "benefit_grants"("companyId", "sourceModule");

-- AddForeignKey
ALTER TABLE "benefits" ADD CONSTRAINT "benefits_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefit_grants" ADD CONSTRAINT "benefit_grants_benefitId_fkey" FOREIGN KEY ("benefitId") REFERENCES "benefits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
