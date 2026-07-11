-- ═══════════════════════════════════════════════════════════════════════════
-- FASE E7 · Método de escaneo predeterminado por empresa — IDEMPOTENTE
-- Ejecutar en el editor SQL de Supabase. Seguro de correr más de una vez.
-- "camara" (cámara del dispositivo) | "lector" (lector físico HID USB/Bluetooth).
-- El operador puede cambiarlo en pantalla sin recargar; esto es el valor inicial.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE "companies"
  ADD COLUMN IF NOT EXISTS "escanerModo" TEXT NOT NULL DEFAULT 'camara';

-- Verificación (1 fila OK)
SELECT 'companies.escanerModo' AS objeto,
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.columns
          WHERE table_name = 'companies' AND column_name = 'escanerModo'
       ) THEN 'OK' ELSE 'FALTA' END AS estado;
