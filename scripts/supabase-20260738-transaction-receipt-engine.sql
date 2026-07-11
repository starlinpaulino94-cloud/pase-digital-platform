-- ═══════════════════════════════════════════════════════════════════════════
-- FASE E4 · Transaction & Receipt Engine — versión IDEMPOTENTE
-- Ejecutar en el editor SQL de Supabase. Segura de correr más de una vez:
-- solo crea lo que falte. Al final imprime una verificación (12 filas OK).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Enums (CREATE TYPE no soporta IF NOT EXISTS: se captura duplicate_object)
DO $$ BEGIN
  CREATE TYPE "TransactionTipo" AS ENUM
    ('MEMBERSHIP_REDEMPTION', 'PROMOTION_USE', 'BENEFIT_USE', 'REWARD_REDEMPTION',
     'COUPON_USE', 'POINTS_SPEND', 'REFERRAL', 'SALE', 'PURCHASE', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "TransactionEstado" AS ENUM
    ('PENDING', 'VALIDATING', 'APPROVED', 'APPLIED',
     'CANCELLED', 'REVERTED', 'EXPIRED', 'ERROR');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Nueva acción de auditoría (edición de la plantilla del comprobante)
ALTER TYPE "AuditAccion" ADD VALUE IF NOT EXISTS 'PLANTILLA_RECIBO_ACTUALIZADA';

-- ── Tablas ───────────────────────────────────────────────────────────────────

-- Registro oficial de operaciones (TX-YYYYMMDD-NNNNNN, nunca se reutiliza)
CREATE TABLE IF NOT EXISTS "transactions" (
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

-- Bitácora de transiciones de estado (cada cambio queda registrado)
CREATE TABLE IF NOT EXISTS "transaction_transitions" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "desde" "TransactionEstado",
    "hacia" "TransactionEstado" NOT NULL,
    "motivo" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_transitions_pkey" PRIMARY KEY ("id")
);

-- Contadores atómicos de secuencia (TX por día, tickets por empresa)
CREATE TABLE IF NOT EXISTS "transaction_counters" (
    "id" TEXT NOT NULL,
    "seq" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "transaction_counters_pkey" PRIMARY KEY ("id")
);

-- Impresiones/reimpresiones del comprobante (COPIA #N auditada)
CREATE TABLE IF NOT EXISTS "receipt_prints" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "empleadoId" TEXT,
    "esCopia" BOOLEAN NOT NULL DEFAULT false,
    "numero" INTEGER NOT NULL,
    "motivo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receipt_prints_pkey" PRIMARY KEY ("id")
);

-- Plantilla del comprobante por empresa (personalizable sin código)
CREATE TABLE IF NOT EXISTS "receipt_templates" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "receipt_templates_pkey" PRIMARY KEY ("id")
);

-- ── Índices ──────────────────────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS "transactions_codigo_key" ON "transactions"("codigo");
CREATE UNIQUE INDEX IF NOT EXISTS "transactions_visitId_key" ON "transactions"("visitId");
CREATE UNIQUE INDEX IF NOT EXISTS "transactions_qrTokenUsadoId_key" ON "transactions"("qrTokenUsadoId");
CREATE INDEX IF NOT EXISTS "transactions_companyId_estado_idx" ON "transactions"("companyId", "estado");
CREATE INDEX IF NOT EXISTS "transactions_companyId_createdAt_idx" ON "transactions"("companyId", "createdAt");
CREATE INDEX IF NOT EXISTS "transactions_clienteId_createdAt_idx" ON "transactions"("clienteId", "createdAt");
CREATE INDEX IF NOT EXISTS "transactions_empleadoId_idx" ON "transactions"("empleadoId");
CREATE INDEX IF NOT EXISTS "transaction_transitions_transactionId_createdAt_idx"
  ON "transaction_transitions"("transactionId", "createdAt");
CREATE INDEX IF NOT EXISTS "receipt_prints_transactionId_idx" ON "receipt_prints"("transactionId");
CREATE UNIQUE INDEX IF NOT EXISTS "receipt_templates_companyId_key" ON "receipt_templates"("companyId");

-- ── Foreign keys (duplicate_object si ya existen) ────────────────────────────
DO $$ BEGIN
  ALTER TABLE "transactions" ADD CONSTRAINT "transactions_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "transactions" ADD CONSTRAINT "transactions_sucursalId_fkey"
    FOREIGN KEY ("sucursalId") REFERENCES "sucursales"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "transactions" ADD CONSTRAINT "transactions_clienteId_fkey"
    FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "transactions" ADD CONSTRAINT "transactions_empleadoId_fkey"
    FOREIGN KEY ("empleadoId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "transactions" ADD CONSTRAINT "transactions_membershipId_fkey"
    FOREIGN KEY ("membershipId") REFERENCES "memberships"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "transactions" ADD CONSTRAINT "transactions_visitId_fkey"
    FOREIGN KEY ("visitId") REFERENCES "visits"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "transactions" ADD CONSTRAINT "transactions_qrTokenUsadoId_fkey"
    FOREIGN KEY ("qrTokenUsadoId") REFERENCES "qr_tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "transaction_transitions" ADD CONSTRAINT "transaction_transitions_transactionId_fkey"
    FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "transaction_transitions" ADD CONSTRAINT "transaction_transitions_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "receipt_prints" ADD CONSTRAINT "receipt_prints_transactionId_fkey"
    FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "receipt_prints" ADD CONSTRAINT "receipt_prints_empleadoId_fkey"
    FOREIGN KEY ("empleadoId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "receipt_templates" ADD CONSTRAINT "receipt_templates_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Verificación: las 12 filas deben decir OK ────────────────────────────────
SELECT 'enum TransactionTipo' AS objeto,
       CASE WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TransactionTipo')
            THEN 'OK' ELSE 'FALTA' END AS estado
UNION ALL
SELECT 'enum TransactionEstado',
       CASE WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TransactionEstado')
            THEN 'OK' ELSE 'FALTA' END
UNION ALL
SELECT 'AuditAccion.PLANTILLA_RECIBO_ACTUALIZADA',
       CASE WHEN EXISTS (
         SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = 'AuditAccion' AND e.enumlabel = 'PLANTILLA_RECIBO_ACTUALIZADA')
            THEN 'OK' ELSE 'FALTA' END
UNION ALL
SELECT 'tabla transactions',
       CASE WHEN to_regclass('public.transactions') IS NOT NULL THEN 'OK' ELSE 'FALTA' END
UNION ALL
SELECT 'tabla transaction_transitions',
       CASE WHEN to_regclass('public.transaction_transitions') IS NOT NULL THEN 'OK' ELSE 'FALTA' END
UNION ALL
SELECT 'tabla transaction_counters',
       CASE WHEN to_regclass('public.transaction_counters') IS NOT NULL THEN 'OK' ELSE 'FALTA' END
UNION ALL
SELECT 'tabla receipt_prints',
       CASE WHEN to_regclass('public.receipt_prints') IS NOT NULL THEN 'OK' ELSE 'FALTA' END
UNION ALL
SELECT 'tabla receipt_templates',
       CASE WHEN to_regclass('public.receipt_templates') IS NOT NULL THEN 'OK' ELSE 'FALTA' END
UNION ALL
SELECT 'índice transactions_codigo_key',
       CASE WHEN to_regclass('public.transactions_codigo_key') IS NOT NULL THEN 'OK' ELSE 'FALTA' END
UNION ALL
SELECT 'índice transactions_qrTokenUsadoId_key',
       CASE WHEN to_regclass('public."transactions_qrTokenUsadoId_key"') IS NOT NULL THEN 'OK' ELSE 'FALTA' END
UNION ALL
SELECT 'índice receipt_templates_companyId_key',
       CASE WHEN to_regclass('public."receipt_templates_companyId_key"') IS NOT NULL THEN 'OK' ELSE 'FALTA' END
UNION ALL
SELECT 'FK transactions→companies',
       CASE WHEN EXISTS (
         SELECT 1 FROM pg_constraint WHERE conname = 'transactions_companyId_fkey')
            THEN 'OK' ELSE 'FALTA' END;
