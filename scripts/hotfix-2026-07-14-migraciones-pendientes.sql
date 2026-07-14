-- ============================================================================
-- HOTFIX 2026-07-14 · Migraciones pendientes en producción
-- ============================================================================
-- SÍNTOMA: "Error de autenticación" al registrarse (membego.com/registro/...).
-- CAUSA: el deploy de hoy incluye código Prisma que lee columnas/tablas nuevas
--   (Company.engagementConfig, CampanaInvitacion.usarBanner, ruleta, marketing
--   campaigns) que aún no existen en la base de datos de producción. Cualquier
--   query sin `select` sobre esos modelos revienta (ej. la página de registro).
--
-- CÓMO USAR: pegar TODO este script en el SQL Editor de Supabase (proyecto de
--   PRODUCCIÓN) y ejecutarlo UNA vez. Es 100% idempotente: si algo ya existe,
--   lo salta sin error. Al terminar, correr el bloque de VERIFICACIÓN final.
-- ============================================================================

-- ── 0) DIAGNÓSTICO (opcional: ejecutar primero para ver qué falta) ─────────
-- SELECT column_name FROM information_schema.columns
--  WHERE table_name = 'companies' AND column_name = 'engagementConfig';
-- SELECT column_name FROM information_schema.columns
--  WHERE table_name = 'campanas_invitacion' AND column_name = 'usarBanner';
-- SELECT table_name FROM information_schema.tables
--  WHERE table_name IN ('marketing_campaigns','ruleta_premios','ruleta_jugadas');

-- ── 1) Fase 7 · Company.engagementConfig (LA QUE ROMPE EL REGISTRO) ────────
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "engagementConfig" JSONB;

-- ── 2) CampanaInvitacion.usarBanner (rompe landings /invita/[slug]) ────────
ALTER TABLE "campanas_invitacion"
  ADD COLUMN IF NOT EXISTS "usarBanner" BOOLEAN NOT NULL DEFAULT false;

-- ── 3) Fase 2 · Marketing Campaigns ─────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "MarketingCampaignTipo" AS ENUM ('FLASH_SALE','OFERTA_DIA','FIN_DE_SEMANA','HAPPY_HOUR','PRIMERA_COMPRA','BIENVENIDA','REGRESO','CUMPLEANOS','POR_VENCER','PERSONALIZADA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "MarketingCampaignEstado" AS ENUM ('BORRADOR','ACTIVA','PAUSADA','FINALIZADA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "marketing_campaigns" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tipo" "MarketingCampaignTipo" NOT NULL DEFAULT 'FLASH_SALE',
    "estado" "MarketingCampaignEstado" NOT NULL DEFAULT 'BORRADOR',
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "imagenUrl" TEXT,
    "bannerUrl" TEXT,
    "ctaTexto" TEXT,
    "ctaHref" TEXT,
    "colorPrimario" TEXT,
    "colorSecundario" TEXT,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "horaInicioMin" INTEGER,
    "horaFinMin" INTEGER,
    "diasSemana" INTEGER[],
    "prioridad" INTEGER NOT NULL DEFAULT 0,
    "destacada" BOOLEAN NOT NULL DEFAULT false,
    "maxReclamos" INTEGER,
    "reclamosCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "marketing_campaigns_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "marketing_campaigns_companyId_estado_fechaInicio_fechaFin_idx"
  ON "marketing_campaigns"("companyId", "estado", "fechaInicio", "fechaFin");
CREATE INDEX IF NOT EXISTS "marketing_campaigns_estado_fechaFin_idx"
  ON "marketing_campaigns"("estado", "fechaFin");

DO $$ BEGIN
  ALTER TABLE "marketing_campaigns" ADD CONSTRAINT "marketing_campaigns_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 4) Fase 6B · Ruleta de premios ──────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "RuletaPremioTipo" AS ENUM ('PROMOCION','NADA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "ruleta_premios" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "RuletaPremioTipo" NOT NULL DEFAULT 'PROMOCION',
    "promocionId" TEXT,
    "probabilidad" INTEGER NOT NULL DEFAULT 1,
    "color" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ruleta_premios_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ruleta_jugadas" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "costoPuntos" INTEGER NOT NULL,
    "premioId" TEXT,
    "premioNombre" TEXT NOT NULL,
    "gano" BOOLEAN NOT NULL DEFAULT false,
    "productoCompraId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ruleta_jugadas_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ruleta_premios_companyId_activo_idx" ON "ruleta_premios"("companyId", "activo");
CREATE INDEX IF NOT EXISTS "ruleta_jugadas_companyId_clienteId_idx" ON "ruleta_jugadas"("companyId", "clienteId");
CREATE INDEX IF NOT EXISTS "ruleta_jugadas_clienteId_createdAt_idx" ON "ruleta_jugadas"("clienteId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "ruleta_premios" ADD CONSTRAINT "ruleta_premios_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ruleta_premios" ADD CONSTRAINT "ruleta_premios_promocionId_fkey"
    FOREIGN KEY ("promocionId") REFERENCES "promociones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ruleta_jugadas" ADD CONSTRAINT "ruleta_jugadas_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ruleta_jugadas" ADD CONSTRAINT "ruleta_jugadas_clienteId_fkey"
    FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ruleta_jugadas" ADD CONSTRAINT "ruleta_jugadas_premioId_fkey"
    FOREIGN KEY ("premioId") REFERENCES "ruleta_premios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 5) VERIFICACIÓN (debe devolver 2 filas de columnas y 3 tablas) ─────────
SELECT 'columna' AS tipo, table_name, column_name AS nombre
  FROM information_schema.columns
 WHERE (table_name = 'companies' AND column_name = 'engagementConfig')
    OR (table_name = 'campanas_invitacion' AND column_name = 'usarBanner')
UNION ALL
SELECT 'tabla', table_name, table_name
  FROM information_schema.tables
 WHERE table_name IN ('marketing_campaigns','ruleta_premios','ruleta_jugadas');
