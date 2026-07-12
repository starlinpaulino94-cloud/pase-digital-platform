-- CreateEnum
CREATE TYPE "GrowthTrigger" AS ENUM ('LINK_ABIERTO', 'REGISTRO', 'VERIFICADO', 'MEMBRESIA', 'COMPRA', 'PRIMER_USO', 'N_REFERIDOS');
CREATE TYPE "GrowthRewardTipo" AS ENUM ('PUNTOS', 'CREDITOS', 'BENEFICIO', 'LAVADOS_GRATIS', 'DESCUENTO_PORCENTAJE', 'DESCUENTO_MONTO');
CREATE TYPE "GrowthBeneficiario" AS ENUM ('REFERENTE', 'REFERIDO', 'AMBOS');
CREATE TYPE "GrowthRewardEstado" AS ENUM ('PENDIENTE', 'ENTREGADA', 'RECHAZADA');

-- AlterEnum
ALTER TYPE "ReferralEventTipo" ADD VALUE IF NOT EXISTS 'LANDING_VIEW';
ALTER TYPE "ReferralEventTipo" ADD VALUE IF NOT EXISTS 'PRIMER_USO';

-- AlterTable
ALTER TABLE "referral_events" ADD COLUMN "growthLinkId" TEXT;

-- CreateTable
CREATE TABLE "growth_links" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "promocionId" TEXT,
    "campanaId" TEXT,
    "titulo" TEXT,
    "mensaje" TEXT,
    "canal" TEXT,
    "duracionHoras" INTEGER,
    "expiresAt" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "growth_links_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "growth_configs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "landingActiva" BOOLEAN NOT NULL DEFAULT true,
    "duracionHorasDefault" INTEGER NOT NULL DEFAULT 24,
    "premiaClic" BOOLEAN NOT NULL DEFAULT false,
    "premiaRegistro" BOOLEAN NOT NULL DEFAULT true,
    "premiaMembresia" BOOLEAN NOT NULL DEFAULT true,
    "premiaCompra" BOOLEAN NOT NULL DEFAULT true,
    "premiaRenovacion" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "growth_configs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "growth_rules" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "campanaId" TEXT,
    "nombre" TEXT NOT NULL,
    "trigger" "GrowthTrigger" NOT NULL,
    "valorCondicion" INTEGER NOT NULL DEFAULT 1,
    "planId" TEXT,
    "beneficiario" "GrowthBeneficiario" NOT NULL DEFAULT 'REFERENTE',
    "recompensaTipo" "GrowthRewardTipo" NOT NULL,
    "recompensaValor" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "recompensaPromocionId" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "growth_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "growth_rewards" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "growthLinkId" TEXT,
    "referidoId" TEXT,
    "trigger" "GrowthTrigger" NOT NULL,
    "tipo" "GrowthRewardTipo" NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "estado" "GrowthRewardEstado" NOT NULL DEFAULT 'PENDIENTE',
    "productoCompraId" TEXT,
    "entregadaAt" TIMESTAMP(3),
    "motivoRechazo" TEXT,
    "dedupeKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "growth_rewards_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "growth_wallets" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "puntos" INTEGER NOT NULL DEFAULT 0,
    "creditos" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "growth_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "growth_links_code_key" ON "growth_links"("code");
CREATE INDEX "growth_links_companyId_clienteId_idx" ON "growth_links"("companyId", "clienteId");
CREATE INDEX "growth_links_campanaId_idx" ON "growth_links"("campanaId");
CREATE UNIQUE INDEX "growth_configs_companyId_key" ON "growth_configs"("companyId");
CREATE INDEX "growth_rules_companyId_activo_idx" ON "growth_rules"("companyId", "activo");
CREATE INDEX "growth_rules_companyId_trigger_activo_idx" ON "growth_rules"("companyId", "trigger", "activo");
CREATE UNIQUE INDEX "growth_rewards_dedupeKey_key" ON "growth_rewards"("dedupeKey");
CREATE INDEX "growth_rewards_companyId_estado_idx" ON "growth_rewards"("companyId", "estado");
CREATE INDEX "growth_rewards_clienteId_idx" ON "growth_rewards"("clienteId");
CREATE INDEX "growth_rewards_growthLinkId_idx" ON "growth_rewards"("growthLinkId");
CREATE UNIQUE INDEX "growth_wallets_companyId_clienteId_key" ON "growth_wallets"("companyId", "clienteId");
CREATE INDEX "growth_wallets_companyId_idx" ON "growth_wallets"("companyId");
CREATE INDEX "referral_events_growthLinkId_tipo_idx" ON "referral_events"("growthLinkId", "tipo");

-- AddForeignKey
ALTER TABLE "referral_events" ADD CONSTRAINT "referral_events_growthLinkId_fkey" FOREIGN KEY ("growthLinkId") REFERENCES "growth_links"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "growth_links" ADD CONSTRAINT "growth_links_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "growth_links" ADD CONSTRAINT "growth_links_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "growth_links" ADD CONSTRAINT "growth_links_promocionId_fkey" FOREIGN KEY ("promocionId") REFERENCES "promociones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "growth_links" ADD CONSTRAINT "growth_links_campanaId_fkey" FOREIGN KEY ("campanaId") REFERENCES "campanas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "growth_configs" ADD CONSTRAINT "growth_configs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "growth_rules" ADD CONSTRAINT "growth_rules_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "growth_rules" ADD CONSTRAINT "growth_rules_campanaId_fkey" FOREIGN KEY ("campanaId") REFERENCES "campanas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "growth_rules" ADD CONSTRAINT "growth_rules_recompensaPromocionId_fkey" FOREIGN KEY ("recompensaPromocionId") REFERENCES "promociones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "growth_rewards" ADD CONSTRAINT "growth_rewards_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "growth_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "growth_rewards" ADD CONSTRAINT "growth_rewards_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "growth_rewards" ADD CONSTRAINT "growth_rewards_growthLinkId_fkey" FOREIGN KEY ("growthLinkId") REFERENCES "growth_links"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "growth_wallets" ADD CONSTRAINT "growth_wallets_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
