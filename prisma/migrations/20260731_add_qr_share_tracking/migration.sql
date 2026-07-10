-- Compartir el QR (WhatsApp, etc.). Solo AÑADE: un valor al enum AuditAccion
-- (QR_COMPARTIDO) y dos columnas de seguimiento en qr_tokens. NO cambia el
-- mecanismo de un solo uso del token; compartir no lo consume, solo lo registra.

-- AlterEnum
ALTER TYPE "AuditAccion" ADD VALUE 'QR_COMPARTIDO';

-- AlterTable
ALTER TABLE "qr_tokens" ADD COLUMN     "compartidoCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "ultimoCompartido" TIMESTAMP(3);
