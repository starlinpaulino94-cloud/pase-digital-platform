-- Migration: add notificaciones table
-- Run this in the Supabase SQL editor

CREATE TYPE "NotifTipo" AS ENUM (
  'PAGO_APROBADO',
  'PAGO_RECHAZADO',
  'NUEVO_COMPROBANTE',
  'MEMBRESIA_POR_VENCER',
  'MEMBRESIA_ACTIVADA',
  'SISTEMA'
);

CREATE TABLE IF NOT EXISTS "notificaciones" (
  "id"        TEXT         NOT NULL,
  "userId"    TEXT         NOT NULL,
  "tipo"      "NotifTipo"  NOT NULL,
  "titulo"    TEXT         NOT NULL,
  "mensaje"   TEXT         NOT NULL,
  "href"      TEXT,
  "leida"     BOOLEAN      NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "notificaciones_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "notificaciones_userId_leida_idx"   ON "notificaciones"("userId", "leida");
CREATE INDEX IF NOT EXISTS "notificaciones_userId_createdAt_idx" ON "notificaciones"("userId", "createdAt" DESC);
