-- ============================================================================
-- F4.2 · Promociones 2.0: visibilidad, stock, prioridad y archivo
-- ============================================================================
-- Ejecutar en el SQL Editor de Supabase. Idempotente.
ALTER TABLE "promociones" ADD COLUMN IF NOT EXISTS "visibilidad" TEXT NOT NULL DEFAULT 'publica';
ALTER TABLE "promociones" ADD COLUMN IF NOT EXISTS "maxCanjes" INTEGER;
ALTER TABLE "promociones" ADD COLUMN IF NOT EXISTS "canjes" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "promociones" ADD COLUMN IF NOT EXISTS "prioridad" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "promociones" ADD COLUMN IF NOT EXISTS "archivada" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS "promociones_visibilidad_archivada_idx" ON "promociones"("visibilidad", "archivada");
