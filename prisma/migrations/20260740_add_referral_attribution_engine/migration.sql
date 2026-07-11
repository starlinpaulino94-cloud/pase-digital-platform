-- CreateEnum
CREATE TYPE "ReferralRecompensaEstado" AS ENUM ('PENDIENTE', 'ENTREGADA', 'RECHAZADA');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ReferralEventTipo" ADD VALUE 'LINK';
ALTER TYPE "ReferralEventTipo" ADD VALUE 'REGISTRO_INICIADO';
ALTER TYPE "ReferralEventTipo" ADD VALUE 'VERIFICADO';
ALTER TYPE "ReferralEventTipo" ADD VALUE 'COMPRA';
ALTER TYPE "ReferralEventTipo" ADD VALUE 'RECOMPENSA';
ALTER TYPE "ReferralEventTipo" ADD VALUE 'FRAUDE';

-- AlterTable
ALTER TABLE "referral_events" ADD COLUMN     "referidoClienteId" TEXT,
ADD COLUMN     "visitorId" TEXT;

-- CreateTable
CREATE TABLE "referral_recompensas" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "referenteClienteId" TEXT NOT NULL,
    "reglaId" TEXT NOT NULL,
    "estado" "ReferralRecompensaEstado" NOT NULL DEFAULT 'PENDIENTE',
    "tipo" "TipoRecompensa" NOT NULL,
    "valor" INTEGER NOT NULL,
    "descripcion" TEXT NOT NULL,
    "umbral" INTEGER NOT NULL,
    "completadosAlOtorgar" INTEGER NOT NULL,
    "entregadaAt" TIMESTAMP(3),
    "motivoRechazo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_recompensas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "referral_recompensas_companyId_estado_idx" ON "referral_recompensas"("companyId", "estado");

-- CreateIndex
CREATE INDEX "referral_recompensas_referenteClienteId_idx" ON "referral_recompensas"("referenteClienteId");

-- CreateIndex
CREATE UNIQUE INDEX "referral_recompensas_referenteClienteId_reglaId_key" ON "referral_recompensas"("referenteClienteId", "reglaId");

-- CreateIndex
CREATE INDEX "referral_events_companyId_tipo_visitorId_idx" ON "referral_events"("companyId", "tipo", "visitorId");

-- CreateIndex
CREATE INDEX "referral_events_referidoClienteId_idx" ON "referral_events"("referidoClienteId");

-- AddForeignKey
ALTER TABLE "referral_recompensas" ADD CONSTRAINT "referral_recompensas_reglaId_fkey" FOREIGN KEY ("reglaId") REFERENCES "reglas_recompensa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

