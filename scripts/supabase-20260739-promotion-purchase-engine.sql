-- ═══════════════════════════════════════════════════════════════════════════
-- FASE E5 · Promotion Subscription & Purchase Engine — versión IDEMPOTENTE
-- Ejecutar en el editor SQL de Supabase. Segura de correr más de una vez:
-- solo crea lo que falte. Al final imprime una verificación (12 filas OK).
-- Incluye el bucket de storage `promociones` (imágenes por archivo).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Enums ────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "ProductoComercialTipo" AS ENUM ('PROMOCION', 'MEMBRESIA');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CompraEstado" AS ENUM
    ('SOLICITADA', 'PENDIENTE_PAGO', 'EN_VALIDACION', 'APROBADA', 'ACTIVA',
     'RECHAZADA', 'CONSUMIDA', 'EXPIRADA', 'CANCELADA');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Promociones: venta directa + restricciones + imágenes ────────────────────
ALTER TABLE "promociones"
  ADD COLUMN IF NOT EXISTS "esComprable" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "precio" DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "usosPorCompra" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "beneficioVigenciaDias" INTEGER,
  ADD COLUMN IF NOT EXISTS "beneficioVigenciaHasta" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "diasPermitidos" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  ADD COLUMN IF NOT EXISTS "horaDesde" TEXT,
  ADD COLUMN IF NOT EXISTS "horaHasta" TEXT,
  ADD COLUMN IF NOT EXISTS "imagenes" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- ── QR: el mismo sistema sirve a membresías y compras de promoción ───────────
ALTER TABLE "qr_tokens" ADD COLUMN IF NOT EXISTS "compraId" TEXT;
ALTER TABLE "qr_tokens" ALTER COLUMN "membresiaId" DROP NOT NULL;

-- ── Tabla de compras (Productos Comerciales) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS "producto_compras" (
    "id" TEXT NOT NULL,
    "tipo" "ProductoComercialTipo" NOT NULL DEFAULT 'PROMOCION',
    "estado" "CompraEstado" NOT NULL DEFAULT 'SOLICITADA',
    "companyId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "promocionId" TEXT,
    "metodoPagoId" TEXT,
    "precioCongelado" DECIMAL(10,2),
    "montoPagado" DECIMAL(10,2),
    "pagoConfirmado" BOOLEAN NOT NULL DEFAULT false,
    "comprobanteUrl" TEXT,
    "comprobanteNota" TEXT,
    "transferenciaFecha" TIMESTAMP(3),
    "rechazadoReason" TEXT,
    "adminNota" TEXT,
    "aprobadaPorId" TEXT,
    "usosIncluidos" INTEGER NOT NULL DEFAULT 1,
    "usosRestantes" INTEGER NOT NULL DEFAULT 0,
    "fechaActivacion" TIMESTAMP(3),
    "fechaVencimiento" TIMESTAMP(3),
    "consumidaAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "producto_compras_pkey" PRIMARY KEY ("id")
);

-- Bitácora inmutable de estados de cada compra
CREATE TABLE IF NOT EXISTS "producto_compra_transiciones" (
    "id" TEXT NOT NULL,
    "compraId" TEXT NOT NULL,
    "desde" "CompraEstado",
    "hacia" "CompraEstado" NOT NULL,
    "motivo" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "producto_compra_transiciones_pkey" PRIMARY KEY ("id")
);

-- ── Índices ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "producto_compras_companyId_estado_idx" ON "producto_compras"("companyId", "estado");
CREATE INDEX IF NOT EXISTS "producto_compras_clienteId_estado_idx" ON "producto_compras"("clienteId", "estado");
CREATE INDEX IF NOT EXISTS "producto_compras_promocionId_estado_idx" ON "producto_compras"("promocionId", "estado");
CREATE INDEX IF NOT EXISTS "producto_compras_companyId_createdAt_idx" ON "producto_compras"("companyId", "createdAt");
CREATE INDEX IF NOT EXISTS "producto_compra_transiciones_compraId_createdAt_idx"
  ON "producto_compra_transiciones"("compraId", "createdAt");
CREATE INDEX IF NOT EXISTS "qr_tokens_compraId_idx" ON "qr_tokens"("compraId");

-- ── Foreign keys (duplicate_object si ya existen) ────────────────────────────
DO $$ BEGIN
  ALTER TABLE "producto_compras" ADD CONSTRAINT "producto_compras_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "producto_compras" ADD CONSTRAINT "producto_compras_clienteId_fkey"
    FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "producto_compras" ADD CONSTRAINT "producto_compras_promocionId_fkey"
    FOREIGN KEY ("promocionId") REFERENCES "promociones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "producto_compras" ADD CONSTRAINT "producto_compras_metodoPagoId_fkey"
    FOREIGN KEY ("metodoPagoId") REFERENCES "metodos_pago"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "producto_compras" ADD CONSTRAINT "producto_compras_aprobadaPorId_fkey"
    FOREIGN KEY ("aprobadaPorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "producto_compra_transiciones" ADD CONSTRAINT "producto_compra_transiciones_compraId_fkey"
    FOREIGN KEY ("compraId") REFERENCES "producto_compras"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "producto_compra_transiciones" ADD CONSTRAINT "producto_compra_transiciones_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "qr_tokens" ADD CONSTRAINT "qr_tokens_compraId_fkey"
    FOREIGN KEY ("compraId") REFERENCES "producto_compras"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Storage: bucket `promociones` (imágenes subidas por archivo) ─────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('promociones', 'promociones', true, 5242880,
        ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
  SET public = true,
      file_size_limit = 5242880,
      allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Políticas del bucket (mismo patrón que logos/avatars/comprobantes)
DO $$ BEGIN
  CREATE POLICY "pase_promos_public_read" ON storage.objects
    FOR SELECT USING (bucket_id = 'promociones');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "pase_promos_authenticated_insert" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (bucket_id = 'promociones');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "pase_promos_authenticated_update" ON storage.objects
    FOR UPDATE TO authenticated USING (bucket_id = 'promociones');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "pase_promos_authenticated_delete" ON storage.objects
    FOR DELETE TO authenticated USING (bucket_id = 'promociones');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Verificación: las 12 filas deben decir OK ────────────────────────────────
SELECT 'enum ProductoComercialTipo' AS objeto,
       CASE WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProductoComercialTipo')
            THEN 'OK' ELSE 'FALTA' END AS estado
UNION ALL
SELECT 'enum CompraEstado',
       CASE WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CompraEstado')
            THEN 'OK' ELSE 'FALTA' END
UNION ALL
SELECT 'tabla producto_compras',
       CASE WHEN to_regclass('public.producto_compras') IS NOT NULL THEN 'OK' ELSE 'FALTA' END
UNION ALL
SELECT 'tabla producto_compra_transiciones',
       CASE WHEN to_regclass('public.producto_compra_transiciones') IS NOT NULL THEN 'OK' ELSE 'FALTA' END
UNION ALL
SELECT 'promociones.esComprable',
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.columns
          WHERE table_name = 'promociones' AND column_name = 'esComprable')
            THEN 'OK' ELSE 'FALTA' END
UNION ALL
SELECT 'promociones.precio',
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.columns
          WHERE table_name = 'promociones' AND column_name = 'precio')
            THEN 'OK' ELSE 'FALTA' END
UNION ALL
SELECT 'promociones.imagenes',
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.columns
          WHERE table_name = 'promociones' AND column_name = 'imagenes')
            THEN 'OK' ELSE 'FALTA' END
UNION ALL
SELECT 'qr_tokens.compraId',
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.columns
          WHERE table_name = 'qr_tokens' AND column_name = 'compraId')
            THEN 'OK' ELSE 'FALTA' END
UNION ALL
SELECT 'qr_tokens.membresiaId opcional',
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.columns
          WHERE table_name = 'qr_tokens' AND column_name = 'membresiaId'
            AND is_nullable = 'YES')
            THEN 'OK' ELSE 'FALTA' END
UNION ALL
SELECT 'FK producto_compras→promociones',
       CASE WHEN EXISTS (
         SELECT 1 FROM pg_constraint WHERE conname = 'producto_compras_promocionId_fkey')
            THEN 'OK' ELSE 'FALTA' END
UNION ALL
SELECT 'bucket promociones',
       CASE WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'promociones')
            THEN 'OK' ELSE 'FALTA' END
UNION ALL
SELECT 'policy pase_promos_public_read',
       CASE WHEN EXISTS (
         SELECT 1 FROM pg_policies
          WHERE schemaname = 'storage' AND policyname = 'pase_promos_public_read')
            THEN 'OK' ELSE 'FALTA' END;
