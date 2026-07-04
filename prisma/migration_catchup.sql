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

-- ============================================================
-- FIN
-- ============================================================
