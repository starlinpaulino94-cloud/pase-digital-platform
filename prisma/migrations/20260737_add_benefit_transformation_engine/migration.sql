
-- CreateEnum
CREATE TYPE "TransformationType" AS ENUM ('UPGRADE', 'DOWNGRADE', 'EXCHANGE', 'REPLACEMENT', 'CUSTOMIZATION', 'SPLIT', 'MERGE');

-- CreateEnum
CREATE TYPE "TransformationStatus" AS ENUM ('REQUESTED', 'RESOLVING', 'RESOLVED', 'PENDING_APPROVAL', 'APPROVED', 'PENDING_PAYMENT', 'EXECUTING', 'COMPLETED', 'REJECTED', 'CANCELLED', 'FAILED');

-- CreateTable
CREATE TABLE "benefit_transformations" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "subscriberKind" TEXT NOT NULL DEFAULT 'CLIENT',
    "type" "TransformationType" NOT NULL,
    "status" "TransformationStatus" NOT NULL DEFAULT 'REQUESTED',
    "sourceBenefitId" TEXT NOT NULL,
    "sourceGrantId" TEXT,
    "targetBenefitId" TEXT,
    "targetGrantId" TEXT,
    "sourceValue" DECIMAL(10,2),
    "targetValue" DECIMAL(10,2),
    "differenceAmount" DECIMAL(10,2),
    "resolvedAmount" DECIMAL(10,2),
    "resolution" JSONB NOT NULL DEFAULT '{}',
    "policyId" TEXT,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "sucursalId" TEXT,
    "requestedById" TEXT,
    "config" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "benefit_transformations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transformation_policies" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" "TransformationType" NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "prioridad" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transformation_policies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "benefit_transformations_companyId_status_idx" ON "benefit_transformations"("companyId", "status");

-- CreateIndex
CREATE INDEX "benefit_transformations_companyId_type_idx" ON "benefit_transformations"("companyId", "type");

-- CreateIndex
CREATE INDEX "benefit_transformations_subscriberId_idx" ON "benefit_transformations"("subscriberId");

-- CreateIndex
CREATE INDEX "benefit_transformations_sourceBenefitId_idx" ON "benefit_transformations"("sourceBenefitId");

-- CreateIndex
CREATE INDEX "benefit_transformations_targetBenefitId_idx" ON "benefit_transformations"("targetBenefitId");

-- CreateIndex
CREATE INDEX "transformation_policies_companyId_tipo_activa_idx" ON "transformation_policies"("companyId", "tipo", "activa");

-- AddForeignKey
ALTER TABLE "benefit_transformations" ADD CONSTRAINT "benefit_transformations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefit_transformations" ADD CONSTRAINT "benefit_transformations_sourceBenefitId_fkey" FOREIGN KEY ("sourceBenefitId") REFERENCES "benefits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefit_transformations" ADD CONSTRAINT "benefit_transformations_targetBenefitId_fkey" FOREIGN KEY ("targetBenefitId") REFERENCES "benefits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transformation_policies" ADD CONSTRAINT "transformation_policies_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

