-- ============================================================================
-- Migración manual: Módulo "Comunicación y Soporte"
-- Ejecutar en el SQL Editor de Supabase (o vía `prisma db push`).
-- Es IDEMPOTENTE: se puede correr varias veces sin error.
-- ============================================================================

-- 1) Nuevos valores del enum de notificaciones -------------------------------
ALTER TYPE "NotifTipo" ADD VALUE IF NOT EXISTS 'TICKET_NUEVO';
ALTER TYPE "NotifTipo" ADD VALUE IF NOT EXISTS 'TICKET_RESPUESTA';
ALTER TYPE "NotifTipo" ADD VALUE IF NOT EXISTS 'TICKET_ACTUALIZADO';

-- 2) Nuevos enums de tickets -------------------------------------------------
DO $$ BEGIN
  CREATE TYPE "TicketEstado" AS ENUM ('NUEVO','EN_PROCESO','ESPERANDO_CLIENTE','RESUELTO','CERRADO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "TicketCategoria" AS ENUM ('PAGO','MEMBRESIA','BENEFICIOS','APP','OTRO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "TicketAutor" AS ENUM ('CLIENTE','ADMIN','SISTEMA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3) Nuevas columnas en whatsapp_config --------------------------------------
ALTER TABLE "whatsapp_config" ADD COLUMN IF NOT EXISTS "codigoPais" TEXT NOT NULL DEFAULT '+1';
ALTER TABLE "whatsapp_config" ADD COLUMN IF NOT EXISTS "correoSoporte" TEXT;
ALTER TABLE "whatsapp_config" ADD COLUMN IF NOT EXISTS "horaInicio" TEXT;
ALTER TABLE "whatsapp_config" ADD COLUMN IF NOT EXISTS "horaCierre" TEXT;
ALTER TABLE "whatsapp_config" ADD COLUMN IF NOT EXISTS "diasLaborales" TEXT;

-- 4) Tabla faq_items ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS "faq_items" (
  "id"        TEXT PRIMARY KEY,
  "companyId" TEXT NOT NULL REFERENCES "companies"("id"),
  "pregunta"  TEXT NOT NULL,
  "respuesta" TEXT NOT NULL,
  "orden"     INTEGER NOT NULL DEFAULT 0,
  "activo"    BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX IF NOT EXISTS "faq_items_companyId_activo_idx" ON "faq_items"("companyId","activo");

-- 5) Tabla support_tickets ---------------------------------------------------
CREATE TABLE IF NOT EXISTS "support_tickets" (
  "id"         TEXT PRIMARY KEY,
  "companyId"  TEXT NOT NULL REFERENCES "companies"("id"),
  "clienteId"  TEXT NOT NULL REFERENCES "clientes"("id"),
  "asunto"     TEXT NOT NULL,
  "categoria"  "TicketCategoria" NOT NULL DEFAULT 'OTRO',
  "estado"     "TicketEstado" NOT NULL DEFAULT 'NUEVO',
  "adjuntoUrl" TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL
);
CREATE INDEX IF NOT EXISTS "support_tickets_companyId_estado_idx" ON "support_tickets"("companyId","estado");
CREATE INDEX IF NOT EXISTS "support_tickets_clienteId_idx" ON "support_tickets"("clienteId");

-- 6) Tabla ticket_mensajes ---------------------------------------------------
CREATE TABLE IF NOT EXISTS "ticket_mensajes" (
  "id"            TEXT PRIMARY KEY,
  "ticketId"      TEXT NOT NULL REFERENCES "support_tickets"("id") ON DELETE CASCADE,
  "autorTipo"     "TicketAutor" NOT NULL,
  "autorNombre"   TEXT NOT NULL,
  "cuerpo"        TEXT NOT NULL,
  "esNotaInterna" BOOLEAN NOT NULL DEFAULT false,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "ticket_mensajes_ticketId_idx" ON "ticket_mensajes"("ticketId");
