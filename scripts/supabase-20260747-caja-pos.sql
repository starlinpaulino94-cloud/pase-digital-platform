-- ═══════════════════════════════════════════════════════════════════════════
-- CAJA (POS) · Fase 1 — IDEMPOTENTE
-- Ejecutar en el editor SQL de Supabase. Seguro de correr más de una vez.
-- Añade: sesiones de caja por sucursal (apertura/cierre/arqueo), referencia
-- única y sucursal de pago en órdenes (membresías y compras de promoción),
-- monto/método/caja en las transacciones y nuevas acciones de auditoría.
-- NO toca datos existentes.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1) Enums nuevos (solo si no existen).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CajaSesionEstado') THEN
    CREATE TYPE "CajaSesionEstado" AS ENUM ('ABIERTA','CERRADA');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MetodoCobroTipo') THEN
    CREATE TYPE "MetodoCobroTipo" AS ENUM ('EFECTIVO','TRANSFERENCIA','OTRO');
  END IF;
END $$;

-- 2) Nuevos valores del enum de auditoría (idempotente).
ALTER TYPE "AuditAccion" ADD VALUE IF NOT EXISTS 'CAJA_ABIERTA';
ALTER TYPE "AuditAccion" ADD VALUE IF NOT EXISTS 'CAJA_CERRADA';
ALTER TYPE "AuditAccion" ADD VALUE IF NOT EXISTS 'COBRO_REGISTRADO';

-- 3) Tabla de sesiones de caja.
CREATE TABLE IF NOT EXISTS "caja_sesiones" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "sucursalId" TEXT NOT NULL,
    "estado" "CajaSesionEstado" NOT NULL DEFAULT 'ABIERTA',
    "abiertaPorId" TEXT NOT NULL,
    "cerradaPorId" TEXT,
    "turno" TEXT,
    "balanceInicial" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "balanceFinal" DECIMAL(10,2),
    "balanceEsperado" DECIMAL(10,2),
    "diferencia" DECIMAL(10,2),
    "observaciones" TEXT,
    "abiertaAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cerradaAt" TIMESTAMP(3),
    CONSTRAINT "caja_sesiones_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'caja_sesiones_companyId_fkey') THEN
    ALTER TABLE "caja_sesiones" ADD CONSTRAINT "caja_sesiones_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'caja_sesiones_sucursalId_fkey') THEN
    ALTER TABLE "caja_sesiones" ADD CONSTRAINT "caja_sesiones_sucursalId_fkey"
      FOREIGN KEY ("sucursalId") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'caja_sesiones_abiertaPorId_fkey') THEN
    ALTER TABLE "caja_sesiones" ADD CONSTRAINT "caja_sesiones_abiertaPorId_fkey"
      FOREIGN KEY ("abiertaPorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'caja_sesiones_cerradaPorId_fkey') THEN
    ALTER TABLE "caja_sesiones" ADD CONSTRAINT "caja_sesiones_cerradaPorId_fkey"
      FOREIGN KEY ("cerradaPorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "caja_sesiones_sucursalId_estado_idx" ON "caja_sesiones"("sucursalId", "estado");
CREATE INDEX IF NOT EXISTS "caja_sesiones_companyId_abiertaAt_idx" ON "caja_sesiones"("companyId", "abiertaAt");

-- 4) Órdenes: referencia única + sucursal de pago (pago presencial).
ALTER TABLE "memberships" ADD COLUMN IF NOT EXISTS "referencia" TEXT;
ALTER TABLE "memberships" ADD COLUMN IF NOT EXISTS "sucursalPagoId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "memberships_referencia_key" ON "memberships"("referencia");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'memberships_sucursalPagoId_fkey') THEN
    ALTER TABLE "memberships" ADD CONSTRAINT "memberships_sucursalPagoId_fkey"
      FOREIGN KEY ("sucursalPagoId") REFERENCES "sucursales"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "producto_compras" ADD COLUMN IF NOT EXISTS "referencia" TEXT;
ALTER TABLE "producto_compras" ADD COLUMN IF NOT EXISTS "sucursalPagoId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "producto_compras_referencia_key" ON "producto_compras"("referencia");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'producto_compras_sucursalPagoId_fkey') THEN
    ALTER TABLE "producto_compras" ADD CONSTRAINT "producto_compras_sucursalPagoId_fkey"
      FOREIGN KEY ("sucursalPagoId") REFERENCES "sucursales"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- 5) Transacciones: caja, monto y método de cobro (arqueo y reportes).
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "cajaSesionId" TEXT;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "monto" DECIMAL(10,2);
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "metodoCobro" "MetodoCobroTipo";
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_cajaSesionId_fkey') THEN
    ALTER TABLE "transactions" ADD CONSTRAINT "transactions_cajaSesionId_fkey"
      FOREIGN KEY ("cajaSesionId") REFERENCES "caja_sesiones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS "transactions_cajaSesionId_idx" ON "transactions"("cajaSesionId");

-- Verificación rápida (opcional):
-- SELECT count(*) FROM "caja_sesiones";
-- SELECT column_name FROM information_schema.columns WHERE table_name='memberships' AND column_name IN ('referencia','sucursalPagoId');
