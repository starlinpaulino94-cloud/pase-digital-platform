-- Onboarding Fase 2C: invitaciones de equipo. Aditivo e idempotente.

DO $$ BEGIN
  CREATE TYPE "InvitacionEstado" AS ENUM ('PENDIENTE', 'ACEPTADA', 'CANCELADA', 'EXPIRADA');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "invitaciones" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "rol" "AppRole" NOT NULL,
  "token" TEXT NOT NULL,
  "estado" "InvitacionEstado" NOT NULL DEFAULT 'PENDIENTE',
  "invitadoPor" TEXT,
  "expiraEn" TIMESTAMP(3) NOT NULL,
  "aceptadaEn" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "invitaciones_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "invitaciones_token_key" ON "invitaciones"("token");
CREATE INDEX IF NOT EXISTS "invitaciones_companyId_estado_idx" ON "invitaciones"("companyId", "estado");
CREATE INDEX IF NOT EXISTS "invitaciones_email_idx" ON "invitaciones"("email");

DO $$ BEGIN
  ALTER TABLE "invitaciones" ADD CONSTRAINT "invitaciones_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
