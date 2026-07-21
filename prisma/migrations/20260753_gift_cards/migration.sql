-- ═══════════════════════════════════════════════════════════════════════════
-- GIFT CARDS DE MONTO ABIERTO (Regalos P2P · extensión de R4) — IDEMPOTENTE
-- Ejecutar en el editor SQL de Supabase ANTES de desplegar el código.
-- Seguro de correr más de una vez. NO toca datos existentes.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1) Enum de estado (solo si no existe).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GiftCardEstado') THEN
    CREATE TYPE "GiftCardEstado" AS ENUM ('PENDIENTE_PAGO','ACTIVA','AGOTADA','CANCELADA');
  END IF;
END $$;

-- 2) Tabla de gift cards.
CREATE TABLE IF NOT EXISTS "gift_cards" (
  "id"                    TEXT NOT NULL,
  "companyId"             TEXT NOT NULL,
  "codigo"                TEXT NOT NULL,
  "estado"                "GiftCardEstado" NOT NULL DEFAULT 'PENDIENTE_PAGO',
  "monto"                 DECIMAL(10,2) NOT NULL,
  "saldo"                 DECIMAL(10,2) NOT NULL,
  "compradorClienteId"    TEXT NOT NULL,
  "destinatarioClienteId" TEXT,
  "destinatarioContacto"  TEXT,
  "mensaje"               TEXT,
  "metodoCobro"           "MetodoCobroTipo",
  "txVentaId"             TEXT,
  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "activadaAt"            TIMESTAMP(3),
  "resueltoAt"            TIMESTAMP(3),
  CONSTRAINT "gift_cards_pkey" PRIMARY KEY ("id")
);

-- 3) Código único + FK a la empresa.
CREATE UNIQUE INDEX IF NOT EXISTS "gift_cards_codigo_key" ON "gift_cards"("codigo");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'gift_cards_companyId_fkey') THEN
    ALTER TABLE "gift_cards" ADD CONSTRAINT "gift_cards_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- 4) Índices.
CREATE INDEX IF NOT EXISTS "gift_cards_companyId_estado_createdAt_idx" ON "gift_cards"("companyId","estado","createdAt");
CREATE INDEX IF NOT EXISTS "gift_cards_destinatarioClienteId_estado_idx" ON "gift_cards"("destinatarioClienteId","estado");
CREATE INDEX IF NOT EXISTS "gift_cards_compradorClienteId_createdAt_idx" ON "gift_cards"("compradorClienteId","createdAt");
