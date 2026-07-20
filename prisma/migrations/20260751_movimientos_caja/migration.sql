-- ═══════════════════════════════════════════════════════════════════════════
-- CONTROL DE COMPROBANTES · Fase 4 — Movimientos de caja intra-turno (G9)
-- IDEMPOTENTE. Ejecutar en el editor SQL de Supabase. Seguro de correr más de
-- una vez. Añade movimientos de efectivo (entradas/salidas) por sesión de caja.
-- NO toca datos existentes.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1) Enum nuevo (solo si no existe).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MovimientoCajaTipo') THEN
    CREATE TYPE "MovimientoCajaTipo" AS ENUM ('ENTRADA','SALIDA');
  END IF;
END $$;

-- 1b) Nuevos valores del enum de auditoría (idempotente).
ALTER TYPE "AuditAccion" ADD VALUE IF NOT EXISTS 'CAJA_MOVIMIENTO';
ALTER TYPE "AuditAccion" ADD VALUE IF NOT EXISTS 'TRANSACCION_ANULADA';

-- 2) Tabla de movimientos de caja.
CREATE TABLE IF NOT EXISTS "movimientos_caja" (
  "id"              TEXT NOT NULL,
  "companyId"       TEXT NOT NULL,
  "cajaSesionId"    TEXT NOT NULL,
  "tipo"            "MovimientoCajaTipo" NOT NULL,
  "monto"           DECIMAL(10,2) NOT NULL,
  "concepto"        TEXT NOT NULL,
  "registradoPorId" TEXT,
  "registradoPor"   TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "movimientos_caja_pkey" PRIMARY KEY ("id")
);

-- 3) FK a la sesión de caja (con borrado en cascada).
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'movimientos_caja_cajaSesionId_fkey'
  ) THEN
    ALTER TABLE "movimientos_caja"
      ADD CONSTRAINT "movimientos_caja_cajaSesionId_fkey"
      FOREIGN KEY ("cajaSesionId") REFERENCES "caja_sesiones"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- 4) Índices.
CREATE INDEX IF NOT EXISTS "movimientos_caja_cajaSesionId_idx"
  ON "movimientos_caja"("cajaSesionId");
CREATE INDEX IF NOT EXISTS "movimientos_caja_companyId_createdAt_idx"
  ON "movimientos_caja"("companyId","createdAt");
