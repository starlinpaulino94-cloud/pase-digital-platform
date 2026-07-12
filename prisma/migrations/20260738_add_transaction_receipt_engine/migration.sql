-- CreateEnum
CREATE TYPE "TransactionTipo" AS ENUM ('MEMBERSHIP_REDEMPTION', 'PROMOTION_USE', 'BENEFIT_USE', 'REWARD_REDEMPTION', 'COUPON_USE', 'POINTS_SPEND', 'REFERRAL', 'SALE', 'PURCHASE', 'OTHER');

-- CreateEnum
CREATE TYPE "TransactionEstado" AS ENUM ('PENDING', 'VALIDATING', 'APPROVED', 'APPLIED', 'CANCELLED', 'REVERTED', 'EXPIRED', 'ERROR');

-- AlterEnum
ALTER TYPE "AuditAccion" ADD VALUE 'PLANTILLA_RECIBO_ACTUALIZADA';

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "ticketNumero" TEXT NOT NULL,
    "tipo" "TransactionTipo" NOT NULL,
    "estado" "TransactionEstado" NOT NULL DEFAULT 'PENDING',
    "companyId" TEXT NOT NULL,
    "sucursalId" TEXT,
    "clienteId" TEXT,
    "empleadoId" TEXT,
    "caja" TEXT,
    "membershipId" TEXT,
    "visitId" TEXT,
    "qrTokenUsadoId" TEXT,
    "snapshot" JSONB NOT NULL DEFAULT '{}',
    "auditoria" JSONB NOT NULL DEFAULT '{}',
    "resultado" TEXT,
    "errorDetalle" TEXT,
    "executionMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "revertedAt" TIMESTAMP(3),

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_transitions" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "desde" "TransactionEstado",
    "hacia" "TransactionEstado" NOT NULL,
    "motivo" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_transitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_counters" (
    "id" TEXT NOT NULL,
    "seq" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "transaction_counters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipt_prints" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "empleadoId" TEXT,
    "esCopia" BOOLEAN NOT NULL DEFAULT false,
    "numero" INTEGER NOT NULL,
    "motivo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receipt_prints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipt_templates" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "receipt_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transactions_codigo_key" ON "transactions"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_visitId_key" ON "transactions"("visitId");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_qrTokenUsadoId_key" ON "transactions"("qrTokenUsadoId");

-- CreateIndex
CREATE INDEX "transactions_companyId_estado_idx" ON "transactions"("companyId", "estado");

-- CreateIndex
CREATE INDEX "transactions_companyId_createdAt_idx" ON "transactions"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "transactions_clienteId_createdAt_idx" ON "transactions"("clienteId", "createdAt");

-- CreateIndex
CREATE INDEX "transactions_empleadoId_idx" ON "transactions"("empleadoId");

-- CreateIndex
CREATE INDEX "transaction_transitions_transactionId_createdAt_idx" ON "transaction_transitions"("transactionId", "createdAt");

-- CreateIndex
CREATE INDEX "receipt_prints_transactionId_idx" ON "receipt_prints"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "receipt_templates_companyId_key" ON "receipt_templates"("companyId");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "sucursales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "visits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_qrTokenUsadoId_fkey" FOREIGN KEY ("qrTokenUsadoId") REFERENCES "qr_tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_transitions" ADD CONSTRAINT "transaction_transitions_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_transitions" ADD CONSTRAINT "transaction_transitions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipt_prints" ADD CONSTRAINT "receipt_prints_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipt_prints" ADD CONSTRAINT "receipt_prints_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipt_templates" ADD CONSTRAINT "receipt_templates_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

