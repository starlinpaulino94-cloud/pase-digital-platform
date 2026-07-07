-- Referidos 2.0: eventos del embudo (compartir/clic/registro/membresía) con
-- puntos, y código corto para enlaces /r/XXXXXX. Todo aditivo.

CREATE TYPE "ReferralEventTipo" AS ENUM ('SHARE', 'CLICK', 'REGISTRO', 'MEMBRESIA');

CREATE TABLE "referral_events" (
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

CREATE INDEX "referral_events_clienteId_companyId_idx" ON "referral_events"("clienteId", "companyId");
CREATE INDEX "referral_events_companyId_tipo_createdAt_idx" ON "referral_events"("companyId", "tipo", "createdAt");

ALTER TABLE "clientes" ADD COLUMN "codigoCorto" TEXT;
CREATE UNIQUE INDEX "clientes_codigoCorto_key" ON "clientes"("codigoCorto");
