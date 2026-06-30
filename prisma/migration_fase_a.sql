-- ============================================================
-- FASE A — Migración PASE Digital (versión corregida)
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. NUEVOS VALORES EN EL ENUM MembershipEstado
ALTER TYPE "MembershipEstado" ADD VALUE IF NOT EXISTS 'PENDIENTE_PAGO';
ALTER TYPE "MembershipEstado" ADD VALUE IF NOT EXISTS 'RECHAZADA';

-- 2. NUEVO ENUM MetodoPagoTipo
DO $$ BEGIN
  CREATE TYPE "MetodoPagoTipo" AS ENUM ('TRANSFERENCIA', 'PRESENCIAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. NUEVO ENUM AuditAccion
DO $$ BEGIN
  CREATE TYPE "AuditAccion" AS ENUM (
    'VISITA_CONFIRMADA',
    'PAGO_APROBADO',
    'PAGO_RECHAZADO',
    'MEMBRESIA_CANCELADA',
    'MEMBRESIA_RENOVADA',
    'QR_GENERADO',
    'COMPROBANTE_IMPRESO'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. TABLA sucursales
CREATE TABLE IF NOT EXISTS "sucursales" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "companyId" TEXT NOT NULL,
  "nombre"    TEXT NOT NULL,
  "direccion" TEXT,
  "telefono"  TEXT,
  "activa"    BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sucursales_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "sucursales_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 5. TABLA metodos_pago
CREATE TABLE IF NOT EXISTS "metodos_pago" (
  "id"            TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "companyId"     TEXT NOT NULL,
  "tipo"          "MetodoPagoTipo" NOT NULL,
  "nombre"        TEXT NOT NULL,
  "titular"       TEXT,
  "numeroCuenta"  TEXT,
  "tipoCuenta"    TEXT,
  "instrucciones" TEXT,
  "activo"        BOOLEAN NOT NULL DEFAULT true,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "metodos_pago_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "metodos_pago_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 6. TABLA audit_logs (recrear limpia si existe con schema viejo)
--    La tabla vieja tiene columnas "event"/"entityType"/"entityId".
--    La nueva usa "accion"/"entidadTipo"/"entidadId".
--    Como es solo auditoría, se puede recrear sin perder datos críticos.
DROP TABLE IF EXISTS "audit_logs" CASCADE;

CREATE TABLE "audit_logs" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "companyId"   TEXT,
  "userId"      TEXT,
  "accion"      "AuditAccion" NOT NULL,
  "entidadTipo" TEXT NOT NULL,
  "entidadId"   TEXT NOT NULL,
  "payload"     JSONB NOT NULL DEFAULT '{}',
  "ipAddress"   TEXT,
  "userAgent"   TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "audit_logs_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id")
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "audit_logs_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "audit_logs_companyId_idx"              ON "audit_logs"("companyId");
CREATE INDEX "audit_logs_userId_idx"                 ON "audit_logs"("userId");
CREATE INDEX "audit_logs_accion_idx"                 ON "audit_logs"("accion");
CREATE INDEX "audit_logs_entidadTipo_entidadId_idx"  ON "audit_logs"("entidadTipo","entidadId");
CREATE INDEX "audit_logs_createdAt_idx"              ON "audit_logs"("createdAt");

-- 7. NUEVAS COLUMNAS EN memberships
ALTER TABLE "memberships"
  ADD COLUMN IF NOT EXISTS "metodoPagoId"    TEXT,
  ADD COLUMN IF NOT EXISTS "comprobanteUrl"  TEXT,
  ADD COLUMN IF NOT EXISTS "comprobanteNota" TEXT,
  ADD COLUMN IF NOT EXISTS "rechazadoReason" TEXT;

-- FK solo si no existe ya
DO $$ BEGIN
  ALTER TABLE "memberships"
    ADD CONSTRAINT "memberships_metodoPagoId_fkey"
    FOREIGN KEY ("metodoPagoId") REFERENCES "metodos_pago"("id")
    ON DELETE SET NULL ON UPDATE CASCADE NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 8. NUEVAS COLUMNAS EN plans
ALTER TABLE "plans"
  ADD COLUMN IF NOT EXISTS "vigenciaDias" INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS "condiciones"  TEXT,
  ADD COLUMN IF NOT EXISTS "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 9. NUEVAS COLUMNAS EN visits
ALTER TABLE "visits"
  ADD COLUMN IF NOT EXISTS "sucursalId" TEXT,
  ADD COLUMN IF NOT EXISTS "ipAddress"  TEXT,
  ADD COLUMN IF NOT EXISTS "userAgent"  TEXT;

DO $$ BEGIN
  ALTER TABLE "visits"
    ADD CONSTRAINT "visits_sucursalId_fkey"
    FOREIGN KEY ("sucursalId") REFERENCES "sucursales"("id")
    ON DELETE SET NULL ON UPDATE CASCADE NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 10. NUEVA COLUMNA EN clientes
ALTER TABLE "clientes"
  ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;

-- 11. TABLA comprobantes
CREATE TABLE IF NOT EXISTS "comprobantes" (
  "id"              TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "visitId"         TEXT NOT NULL,
  "membershipId"    TEXT NOT NULL,
  "numero"          TEXT NOT NULL,
  "impresiones"     INTEGER NOT NULL DEFAULT 0,
  "ultimaImpresion" TIMESTAMP(3),
  "creadoPorId"     TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "comprobantes_pkey"        PRIMARY KEY ("id"),
  CONSTRAINT "comprobantes_visitId_key" UNIQUE ("visitId"),
  CONSTRAINT "comprobantes_numero_key"  UNIQUE ("numero"),
  CONSTRAINT "comprobantes_visitId_fkey"
    FOREIGN KEY ("visitId") REFERENCES "visits"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "comprobantes_membershipId_fkey"
    FOREIGN KEY ("membershipId") REFERENCES "memberships"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "comprobantes_creadoPorId_fkey"
    FOREIGN KEY ("creadoPorId") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

-- ============================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================
