-- FASE A (Membership Engine universal). Solo AÑADE: enums MembershipPlanType /
-- MembershipPeriodicity / MembershipInstanceStatus y tablas membership_plans,
-- membership_instances, membership_usage. No altera ninguna tabla existente (el
-- modelo `Membership`/`memberships` de Car Wash queda intacto). Multi-tenant por
-- companyId. Ningún flujo de la app consume estas tablas todavía.

-- CreateEnum
CREATE TYPE "MembershipPlanType" AS ENUM ('UNLIMITED', 'CREDITS', 'HYBRID', 'TIER', 'FAMILY', 'FLEET', 'CORPORATE', 'SEASONAL', 'PREMIUM', 'MAINTENANCE', 'PAY_PER_VISIT', 'LOYALTY', 'PREPAID', 'VIP', 'REWARDS', 'TRIAL', 'STUDENT', 'DRIVER', 'SUBSCRIPTION_BOX', 'CUSTOM');

-- CreateEnum
CREATE TYPE "MembershipPeriodicity" AS ENUM ('NONE', 'ONE_TIME', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'ANNUAL', 'SEASONAL');

-- CreateEnum
CREATE TYPE "MembershipInstanceStatus" AS ENUM ('PENDING', 'ACTIVE', 'PAUSED', 'SUSPENDED', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "membership_plans" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" "MembershipPlanType" NOT NULL,
    "precio" DECIMAL(10,2) NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'DOP',
    "periodicidad" "MembershipPeriodicity" NOT NULL DEFAULT 'MONTHLY',
    "duracionDias" INTEGER,
    "creditos" INTEGER,
    "ilimitado" BOOLEAN NOT NULL DEFAULT false,
    "templateKey" TEXT,
    "config" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "membership_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_instances" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "subscriberKind" TEXT NOT NULL DEFAULT 'CLIENT',
    "status" "MembershipInstanceStatus" NOT NULL DEFAULT 'PENDING',
    "inicioEn" TIMESTAMP(3),
    "finEn" TIMESTAMP(3),
    "renuevaEn" TIMESTAMP(3),
    "autoRenovar" BOOLEAN NOT NULL DEFAULT false,
    "creditosRestantes" INTEGER,
    "vehiculos" JSONB NOT NULL DEFAULT '[]',
    "config" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "membership_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_usage" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "servicio" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "vehiculo" TEXT,
    "usadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "meta" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "membership_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "membership_plans_companyId_tipo_idx" ON "membership_plans"("companyId", "tipo");

-- CreateIndex
CREATE INDEX "membership_plans_companyId_status_idx" ON "membership_plans"("companyId", "status");

-- CreateIndex
CREATE INDEX "membership_instances_companyId_status_idx" ON "membership_instances"("companyId", "status");

-- CreateIndex
CREATE INDEX "membership_instances_planId_idx" ON "membership_instances"("planId");

-- CreateIndex
CREATE INDEX "membership_instances_subscriberId_idx" ON "membership_instances"("subscriberId");

-- CreateIndex
CREATE INDEX "membership_usage_instanceId_usadoEn_idx" ON "membership_usage"("instanceId", "usadoEn");

-- CreateIndex
CREATE INDEX "membership_usage_companyId_usadoEn_idx" ON "membership_usage"("companyId", "usadoEn");

-- AddForeignKey
ALTER TABLE "membership_plans" ADD CONSTRAINT "membership_plans_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_instances" ADD CONSTRAINT "membership_instances_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_instances" ADD CONSTRAINT "membership_instances_planId_fkey" FOREIGN KEY ("planId") REFERENCES "membership_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_usage" ADD CONSTRAINT "membership_usage_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "membership_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

