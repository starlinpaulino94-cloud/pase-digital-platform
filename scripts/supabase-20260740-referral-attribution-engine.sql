-- ═══════════════════════════════════════════════════════════════════════════
-- FASE E6 · Referral Attribution Engine — versión IDEMPOTENTE
-- Ejecutar en el editor SQL de Supabase. Segura de correr más de una vez.
-- Al final imprime una verificación (10 filas OK).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Enum de estado de recompensas ────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "ReferralRecompensaEstado" AS ENUM ('PENDIENTE', 'ENTREGADA', 'RECHAZADA');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Eventos nuevos del embudo (attribution) ──────────────────────────────────
ALTER TYPE "ReferralEventTipo" ADD VALUE IF NOT EXISTS 'LINK';
ALTER TYPE "ReferralEventTipo" ADD VALUE IF NOT EXISTS 'REGISTRO_INICIADO';
ALTER TYPE "ReferralEventTipo" ADD VALUE IF NOT EXISTS 'VERIFICADO';
ALTER TYPE "ReferralEventTipo" ADD VALUE IF NOT EXISTS 'COMPRA';
ALTER TYPE "ReferralEventTipo" ADD VALUE IF NOT EXISTS 'RECOMPENSA';
ALTER TYPE "ReferralEventTipo" ADD VALUE IF NOT EXISTS 'FRAUDE';

-- ── Attribution tracking en el event store ───────────────────────────────────
ALTER TABLE "referral_events"
  ADD COLUMN IF NOT EXISTS "visitorId" TEXT,
  ADD COLUMN IF NOT EXISTS "referidoClienteId" TEXT;

CREATE INDEX IF NOT EXISTS "referral_events_companyId_tipo_visitorId_idx"
  ON "referral_events"("companyId", "tipo", "visitorId");
CREATE INDEX IF NOT EXISTS "referral_events_referidoClienteId_idx"
  ON "referral_events"("referidoClienteId");

-- ── Recompensas reales (estado propio, sin dobles entregas) ──────────────────
CREATE TABLE IF NOT EXISTS "referral_recompensas" (
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

CREATE INDEX IF NOT EXISTS "referral_recompensas_companyId_estado_idx"
  ON "referral_recompensas"("companyId", "estado");
CREATE INDEX IF NOT EXISTS "referral_recompensas_referenteClienteId_idx"
  ON "referral_recompensas"("referenteClienteId");
CREATE UNIQUE INDEX IF NOT EXISTS "referral_recompensas_referenteClienteId_reglaId_key"
  ON "referral_recompensas"("referenteClienteId", "reglaId");

DO $$ BEGIN
  ALTER TABLE "referral_recompensas" ADD CONSTRAINT "referral_recompensas_reglaId_fkey"
    FOREIGN KEY ("reglaId") REFERENCES "reglas_recompensa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Verificación: las 10 filas deben decir OK ────────────────────────────────
SELECT 'enum ReferralRecompensaEstado' AS objeto,
       CASE WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ReferralRecompensaEstado')
            THEN 'OK' ELSE 'FALTA' END AS estado
UNION ALL
SELECT 'evento LINK',
       CASE WHEN EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
         WHERE t.typname = 'ReferralEventTipo' AND e.enumlabel = 'LINK') THEN 'OK' ELSE 'FALTA' END
UNION ALL
SELECT 'evento REGISTRO_INICIADO',
       CASE WHEN EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
         WHERE t.typname = 'ReferralEventTipo' AND e.enumlabel = 'REGISTRO_INICIADO') THEN 'OK' ELSE 'FALTA' END
UNION ALL
SELECT 'evento VERIFICADO',
       CASE WHEN EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
         WHERE t.typname = 'ReferralEventTipo' AND e.enumlabel = 'VERIFICADO') THEN 'OK' ELSE 'FALTA' END
UNION ALL
SELECT 'evento COMPRA',
       CASE WHEN EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
         WHERE t.typname = 'ReferralEventTipo' AND e.enumlabel = 'COMPRA') THEN 'OK' ELSE 'FALTA' END
UNION ALL
SELECT 'evento FRAUDE',
       CASE WHEN EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
         WHERE t.typname = 'ReferralEventTipo' AND e.enumlabel = 'FRAUDE') THEN 'OK' ELSE 'FALTA' END
UNION ALL
SELECT 'referral_events.visitorId',
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns
         WHERE table_name = 'referral_events' AND column_name = 'visitorId') THEN 'OK' ELSE 'FALTA' END
UNION ALL
SELECT 'referral_events.referidoClienteId',
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns
         WHERE table_name = 'referral_events' AND column_name = 'referidoClienteId') THEN 'OK' ELSE 'FALTA' END
UNION ALL
SELECT 'tabla referral_recompensas',
       CASE WHEN to_regclass('public.referral_recompensas') IS NOT NULL THEN 'OK' ELSE 'FALTA' END
UNION ALL
SELECT 'unique recompensa referente+regla',
       CASE WHEN to_regclass('public."referral_recompensas_referenteClienteId_reglaId_key"') IS NOT NULL
            THEN 'OK' ELSE 'FALTA' END;
