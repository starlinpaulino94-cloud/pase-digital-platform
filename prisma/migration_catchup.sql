-- ============================================================
-- CATCH-UP MIGRATION — columnas y enums faltantes
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Columnas faltantes en memberships
ALTER TABLE "memberships"
  ADD COLUMN IF NOT EXISTS "pagoConfirmado" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "montoPagado"    DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "adminNota"      TEXT;

-- 2. Enum values faltantes en AuditAccion
ALTER TYPE "AuditAccion" ADD VALUE IF NOT EXISTS 'QR_USADO';
ALTER TYPE "AuditAccion" ADD VALUE IF NOT EXISTS 'REFERIDO_COMPLETADO';
ALTER TYPE "AuditAccion" ADD VALUE IF NOT EXISTS 'RECOMPENSA_OTORGADA';
ALTER TYPE "AuditAccion" ADD VALUE IF NOT EXISTS 'NOTA_INTERNA';

-- 3. Enum values faltantes en MembershipEstado
ALTER TYPE "MembershipEstado" ADD VALUE IF NOT EXISTS 'PENDIENTE_PAGO';
ALTER TYPE "MembershipEstado" ADD VALUE IF NOT EXISTS 'RECHAZADA';

-- 4. Columnas faltantes en companies (CRM fields)
ALTER TABLE "companies"
  ADD COLUMN IF NOT EXISTS "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS "email"      TEXT,
  ADD COLUMN IF NOT EXISTS "telefono"   TEXT,
  ADD COLUMN IF NOT EXISTS "direccion"  TEXT,
  ADD COLUMN IF NOT EXISTS "ciudad"     TEXT,
  ADD COLUMN IF NOT EXISTS "categoria"  TEXT,
  ADD COLUMN IF NOT EXISTS "website"    TEXT;

-- 5. Columnas faltantes en memberships (fase A)
ALTER TABLE "memberships"
  ADD COLUMN IF NOT EXISTS "metodoPagoId"    TEXT,
  ADD COLUMN IF NOT EXISTS "comprobanteUrl"  TEXT,
  ADD COLUMN IF NOT EXISTS "comprobanteNota" TEXT,
  ADD COLUMN IF NOT EXISTS "rechazadoReason" TEXT;

-- 6. Columnas faltantes en plans
ALTER TABLE "plans"
  ADD COLUMN IF NOT EXISTS "vigenciaDias" INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS "condiciones"  TEXT,
  ADD COLUMN IF NOT EXISTS "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT now();

-- 7. Columnas faltantes en visits
ALTER TABLE "visits"
  ADD COLUMN IF NOT EXISTS "sucursalId" TEXT,
  ADD COLUMN IF NOT EXISTS "ipAddress"  TEXT,
  ADD COLUMN IF NOT EXISTS "userAgent"  TEXT;

-- 8. Columnas faltantes en clientes
ALTER TABLE "clientes"
  ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;

-- 9. Indexes de rendimiento
CREATE INDEX IF NOT EXISTS "memberships_estado_idx" ON "memberships"("estado");
CREATE INDEX IF NOT EXISTS "memberships_clienteId_idx" ON "memberships"("clienteId");
CREATE INDEX IF NOT EXISTS "qr_tokens_clienteId_activo_idx" ON "qr_tokens"("clienteId", "activo");

-- 10. Tablas nuevas (si no existen)
-- Sucursales
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

-- Metodos de pago
DO $$ BEGIN
  CREATE TYPE "MetodoPagoTipo" AS ENUM ('TRANSFERENCIA', 'PRESENCIAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

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

-- Audit logs
CREATE TABLE IF NOT EXISTS "audit_logs" (
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
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "audit_logs_companyId_idx"              ON "audit_logs"("companyId");
CREATE INDEX IF NOT EXISTS "audit_logs_userId_idx"                 ON "audit_logs"("userId");
CREATE INDEX IF NOT EXISTS "audit_logs_accion_idx"                 ON "audit_logs"("accion");
CREATE INDEX IF NOT EXISTS "audit_logs_entidadTipo_entidadId_idx"  ON "audit_logs"("entidadTipo","entidadId");
CREATE INDEX IF NOT EXISTS "audit_logs_createdAt_idx"              ON "audit_logs"("createdAt");

-- Comprobantes
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
  CONSTRAINT "comprobantes_numero_key"  UNIQUE ("numero")
);

-- FKs que pueden faltar (ignora si ya existen)
DO $$ BEGIN
  ALTER TABLE "memberships"
    ADD CONSTRAINT "memberships_metodoPagoId_fkey"
    FOREIGN KEY ("metodoPagoId") REFERENCES "metodos_pago"("id")
    ON DELETE SET NULL ON UPDATE CASCADE NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "visits"
    ADD CONSTRAINT "visits_sucursalId_fkey"
    FOREIGN KEY ("sucursalId") REFERENCES "sucursales"("id")
    ON DELETE SET NULL ON UPDATE CASCADE NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- FIN — Esta migración es idempotente (IF NOT EXISTS en todo)
-- ============================================================
