-- Referidos 2.0 (idempotente, para el SQL Editor de Supabase):
-- tabla de eventos del embudo + código corto de enlace.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ReferralEventTipo') THEN
    CREATE TYPE "ReferralEventTipo" AS ENUM ('SHARE', 'CLICK', 'REGISTRO', 'MEMBRESIA');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "referral_events" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "companyId" TEXT NOT NULL,
  "clienteId" TEXT NOT NULL,
  "tipo" "ReferralEventTipo" NOT NULL,
  "puntos" INTEGER NOT NULL DEFAULT 0,
  "canal" TEXT,
  "meta" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "referral_events_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id"),
  CONSTRAINT "referral_events_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id")
);

CREATE INDEX IF NOT EXISTS "referral_events_clienteId_companyId_idx" ON "referral_events"("clienteId", "companyId");
CREATE INDEX IF NOT EXISTS "referral_events_companyId_tipo_createdAt_idx" ON "referral_events"("companyId", "tipo", "createdAt");

ALTER TABLE "clientes" ADD COLUMN IF NOT EXISTS "codigoCorto" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "clientes_codigoCorto_key" ON "clientes"("codigoCorto");
