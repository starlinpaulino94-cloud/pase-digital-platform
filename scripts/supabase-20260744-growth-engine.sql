-- ═══════════════════════════════════════════════════════════════════════════
-- GROWTH ENGINE 3.0 · Sistema viral de referidos — IDEMPOTENTE
-- Ejecutar en el editor SQL de Supabase. Seguro de correr más de una vez.
-- Añade: enlaces por invitación (GrowthLink), configuración por empresa,
-- reglas de recompensa por evento, ledger de recompensas y wallet de puntos/
-- créditos. NO toca el motor de referidos vivo (ReferralEvent/Referido).
-- ═══════════════════════════════════════════════════════════════════════════

-- 1) Enums nuevos (solo si no existen).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GrowthTrigger') THEN
    CREATE TYPE "GrowthTrigger" AS ENUM
      ('LINK_ABIERTO','REGISTRO','VERIFICADO','MEMBRESIA','COMPRA','PRIMER_USO','N_REFERIDOS');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GrowthRewardTipo') THEN
    CREATE TYPE "GrowthRewardTipo" AS ENUM
      ('PUNTOS','CREDITOS','BENEFICIO','LAVADOS_GRATIS','DESCUENTO_PORCENTAJE','DESCUENTO_MONTO');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GrowthBeneficiario') THEN
    CREATE TYPE "GrowthBeneficiario" AS ENUM ('REFERENTE','REFERIDO','AMBOS');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GrowthRewardEstado') THEN
    CREATE TYPE "GrowthRewardEstado" AS ENUM ('PENDIENTE','ENTREGADA','RECHAZADA');
  END IF;
END $$;

-- 2) Nuevos valores del enum de eventos (idempotente).
ALTER TYPE "ReferralEventTipo" ADD VALUE IF NOT EXISTS 'LANDING_VIEW';
ALTER TYPE "ReferralEventTipo" ADD VALUE IF NOT EXISTS 'PRIMER_USO';

-- 3) Columna de atribución por enlace en el motor de eventos vivo.
ALTER TABLE "referral_events" ADD COLUMN IF NOT EXISTS "growthLinkId" TEXT;

-- 4) Tablas nuevas.
CREATE TABLE IF NOT EXISTS "growth_links" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "promocionId" TEXT,
    "campanaId" TEXT,
    "titulo" TEXT,
    "mensaje" TEXT,
    "canal" TEXT,
    "duracionHoras" INTEGER,
    "expiresAt" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "growth_links_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "growth_configs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "landingActiva" BOOLEAN NOT NULL DEFAULT true,
    "duracionHorasDefault" INTEGER NOT NULL DEFAULT 24,
    "premiaClic" BOOLEAN NOT NULL DEFAULT false,
    "premiaRegistro" BOOLEAN NOT NULL DEFAULT true,
    "premiaMembresia" BOOLEAN NOT NULL DEFAULT true,
    "premiaCompra" BOOLEAN NOT NULL DEFAULT true,
    "premiaRenovacion" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "growth_configs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "growth_rules" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "campanaId" TEXT,
    "nombre" TEXT NOT NULL,
    "trigger" "GrowthTrigger" NOT NULL,
    "valorCondicion" INTEGER NOT NULL DEFAULT 1,
    "planId" TEXT,
    "beneficiario" "GrowthBeneficiario" NOT NULL DEFAULT 'REFERENTE',
    "recompensaTipo" "GrowthRewardTipo" NOT NULL,
    "recompensaValor" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "recompensaPromocionId" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "growth_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "growth_rewards" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "growthLinkId" TEXT,
    "referidoId" TEXT,
    "trigger" "GrowthTrigger" NOT NULL,
    "tipo" "GrowthRewardTipo" NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "estado" "GrowthRewardEstado" NOT NULL DEFAULT 'PENDIENTE',
    "productoCompraId" TEXT,
    "entregadaAt" TIMESTAMP(3),
    "motivoRechazo" TEXT,
    "dedupeKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "growth_rewards_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "growth_wallets" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "puntos" INTEGER NOT NULL DEFAULT 0,
    "creditos" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "growth_wallets_pkey" PRIMARY KEY ("id")
);

-- 5) Índices (idempotentes).
CREATE UNIQUE INDEX IF NOT EXISTS "growth_links_code_key" ON "growth_links"("code");
CREATE INDEX IF NOT EXISTS "growth_links_companyId_clienteId_idx" ON "growth_links"("companyId","clienteId");
CREATE INDEX IF NOT EXISTS "growth_links_campanaId_idx" ON "growth_links"("campanaId");
CREATE UNIQUE INDEX IF NOT EXISTS "growth_configs_companyId_key" ON "growth_configs"("companyId");
CREATE INDEX IF NOT EXISTS "growth_rules_companyId_activo_idx" ON "growth_rules"("companyId","activo");
CREATE INDEX IF NOT EXISTS "growth_rules_companyId_trigger_activo_idx" ON "growth_rules"("companyId","trigger","activo");
CREATE UNIQUE INDEX IF NOT EXISTS "growth_rewards_dedupeKey_key" ON "growth_rewards"("dedupeKey");
CREATE INDEX IF NOT EXISTS "growth_rewards_companyId_estado_idx" ON "growth_rewards"("companyId","estado");
CREATE INDEX IF NOT EXISTS "growth_rewards_clienteId_idx" ON "growth_rewards"("clienteId");
CREATE INDEX IF NOT EXISTS "growth_rewards_growthLinkId_idx" ON "growth_rewards"("growthLinkId");
CREATE UNIQUE INDEX IF NOT EXISTS "growth_wallets_companyId_clienteId_key" ON "growth_wallets"("companyId","clienteId");
CREATE INDEX IF NOT EXISTS "growth_wallets_companyId_idx" ON "growth_wallets"("companyId");
CREATE INDEX IF NOT EXISTS "referral_events_growthLinkId_tipo_idx" ON "referral_events"("growthLinkId","tipo");

-- 6) Claves foráneas (solo si no existen).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'referral_events_growthLinkId_fkey') THEN
    ALTER TABLE "referral_events" ADD CONSTRAINT "referral_events_growthLinkId_fkey"
      FOREIGN KEY ("growthLinkId") REFERENCES "growth_links"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'growth_links_companyId_fkey') THEN
    ALTER TABLE "growth_links" ADD CONSTRAINT "growth_links_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'growth_links_clienteId_fkey') THEN
    ALTER TABLE "growth_links" ADD CONSTRAINT "growth_links_clienteId_fkey"
      FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'growth_links_promocionId_fkey') THEN
    ALTER TABLE "growth_links" ADD CONSTRAINT "growth_links_promocionId_fkey"
      FOREIGN KEY ("promocionId") REFERENCES "promociones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'growth_links_campanaId_fkey') THEN
    ALTER TABLE "growth_links" ADD CONSTRAINT "growth_links_campanaId_fkey"
      FOREIGN KEY ("campanaId") REFERENCES "campanas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'growth_configs_companyId_fkey') THEN
    ALTER TABLE "growth_configs" ADD CONSTRAINT "growth_configs_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'growth_rules_companyId_fkey') THEN
    ALTER TABLE "growth_rules" ADD CONSTRAINT "growth_rules_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'growth_rules_campanaId_fkey') THEN
    ALTER TABLE "growth_rules" ADD CONSTRAINT "growth_rules_campanaId_fkey"
      FOREIGN KEY ("campanaId") REFERENCES "campanas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'growth_rules_recompensaPromocionId_fkey') THEN
    ALTER TABLE "growth_rules" ADD CONSTRAINT "growth_rules_recompensaPromocionId_fkey"
      FOREIGN KEY ("recompensaPromocionId") REFERENCES "promociones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'growth_rewards_ruleId_fkey') THEN
    ALTER TABLE "growth_rewards" ADD CONSTRAINT "growth_rewards_ruleId_fkey"
      FOREIGN KEY ("ruleId") REFERENCES "growth_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'growth_rewards_clienteId_fkey') THEN
    ALTER TABLE "growth_rewards" ADD CONSTRAINT "growth_rewards_clienteId_fkey"
      FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'growth_rewards_growthLinkId_fkey') THEN
    ALTER TABLE "growth_rewards" ADD CONSTRAINT "growth_rewards_growthLinkId_fkey"
      FOREIGN KEY ("growthLinkId") REFERENCES "growth_links"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'growth_wallets_clienteId_fkey') THEN
    ALTER TABLE "growth_wallets" ADD CONSTRAINT "growth_wallets_clienteId_fkey"
      FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Verificación (6 filas OK)
SELECT t AS objeto,
       CASE WHEN to_regclass('public.' || t) IS NOT NULL THEN 'OK'
            ELSE 'FALTA — corre supabase-20260744' END AS estado
FROM (VALUES ('growth_links'),('growth_configs'),('growth_rules'),
             ('growth_rewards'),('growth_wallets')) AS v(t)
UNION ALL
SELECT 'referral_events.growthLinkId',
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns
              WHERE table_name='referral_events' AND column_name='growthLinkId')
            THEN 'OK' ELSE 'FALTA — corre supabase-20260744' END;
