-- ═══════════════════════════════════════════════════════════════════════════
-- FASE E8 · Tipo unificado de Beneficio Digital — IDEMPOTENTE
-- Ejecutar en el editor SQL de Supabase. Seguro de correr más de una vez.
--
-- Toda promoción pasa a ser un "Beneficio Digital" con un tipo. Hoy todas son
-- PROMOTION; el enum ya deja listos MEMBERSHIP/COUPON/VOUCHER/GIFT/EVENT para
-- que membresías, cupones, bonos, gift cards y entradas compartan el mismo
-- ciclo (adquirir → QR → canjear) sin rediseñar la tabla.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1) Enum BeneficioTipo (crear solo si no existe).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BeneficioTipo') THEN
    CREATE TYPE "BeneficioTipo" AS ENUM
      ('PROMOTION', 'MEMBERSHIP', 'COUPON', 'VOUCHER', 'GIFT', 'EVENT');
  END IF;
END$$;

-- 2) Columna promociones.beneficioTipo (default PROMOTION para lo existente).
ALTER TABLE "promociones"
  ADD COLUMN IF NOT EXISTS "beneficioTipo" "BeneficioTipo" NOT NULL DEFAULT 'PROMOTION';

-- Verificación (2 filas OK)
SELECT 'enum BeneficioTipo' AS objeto,
       CASE WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BeneficioTipo')
            THEN 'OK' ELSE 'FALTA — corre supabase-20260743' END AS estado
UNION ALL
SELECT 'promociones.beneficioTipo' AS objeto,
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.columns
          WHERE table_name = 'promociones' AND column_name = 'beneficioTipo'
       ) THEN 'OK' ELSE 'FALTA — corre supabase-20260743' END AS estado;
