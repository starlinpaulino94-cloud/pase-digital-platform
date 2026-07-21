-- ═══════════════════════════════════════════════════════════════════════════
-- REGALOS P2P · Fase R1 (docs/REGALOS-P2P.md) — IDEMPOTENTE
-- Ejecutar en el editor SQL de Supabase. Seguro de correr más de una vez.
-- Añade: enums de regalo, tabla regalos, beneficiarioClienteId en compras y
-- membresías, y regalosConfig en companies. NO toca datos existentes.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1) Enums (solo si no existen).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RegaloTipo') THEN
    CREATE TYPE "RegaloTipo" AS ENUM ('TRANSFERENCIA_USOS','REGALO_COMPRA','REGALO_MEMBRESIA');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RegaloEstado') THEN
    CREATE TYPE "RegaloEstado" AS ENUM ('PENDIENTE','ACEPTADO','RECHAZADO','EXPIRADO','CANCELADO');
  END IF;
END $$;

-- 2) Tabla de regalos.
CREATE TABLE IF NOT EXISTS "regalos" (
  "id"                   TEXT NOT NULL,
  "companyId"            TEXT NOT NULL,
  "tipo"                 "RegaloTipo" NOT NULL,
  "estado"               "RegaloEstado" NOT NULL DEFAULT 'PENDIENTE',
  "remitenteId"          TEXT NOT NULL,
  "destinatarioId"       TEXT,
  "destinatarioContacto" TEXT,
  "compraOrigenId"       TEXT,
  "membershipOrigenId"   TEXT,
  "promocionId"          TEXT,
  "planId"               TEXT,
  "usos"                 INTEGER NOT NULL DEFAULT 1,
  "mensaje"              TEXT,
  "compraDestinoId"      TEXT,
  "membershipDestinoId"  TEXT,
  "txRemitenteId"        TEXT,
  "txDestinatarioId"     TEXT,
  "expiraAt"             TIMESTAMP(3) NOT NULL,
  "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resueltoAt"           TIMESTAMP(3),
  CONSTRAINT "regalos_pkey" PRIMARY KEY ("id")
);

-- 3) FKs (con cascada donde aplica).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'regalos_companyId_fkey') THEN
    ALTER TABLE "regalos" ADD CONSTRAINT "regalos_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'regalos_remitenteId_fkey') THEN
    ALTER TABLE "regalos" ADD CONSTRAINT "regalos_remitenteId_fkey"
      FOREIGN KEY ("remitenteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'regalos_destinatarioId_fkey') THEN
    ALTER TABLE "regalos" ADD CONSTRAINT "regalos_destinatarioId_fkey"
      FOREIGN KEY ("destinatarioId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- 4) Índices.
CREATE INDEX IF NOT EXISTS "regalos_destinatarioId_estado_idx" ON "regalos"("destinatarioId","estado");
CREATE INDEX IF NOT EXISTS "regalos_remitenteId_createdAt_idx" ON "regalos"("remitenteId","createdAt");
CREATE INDEX IF NOT EXISTS "regalos_companyId_createdAt_idx" ON "regalos"("companyId","createdAt");

-- 5) Beneficiario en compras y membresías (regalos pagados, Fase R3).
ALTER TABLE "producto_compras" ADD COLUMN IF NOT EXISTS "beneficiarioClienteId" TEXT;
ALTER TABLE "memberships" ADD COLUMN IF NOT EXISTS "beneficiarioClienteId" TEXT;

-- 6) Configuración de regalos por empresa (JSON; null = defaults del código).
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "regalosConfig" JSONB;
