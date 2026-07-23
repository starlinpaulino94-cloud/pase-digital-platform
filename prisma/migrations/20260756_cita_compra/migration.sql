-- Cita antes del QR (docs/SEGUIMIENTO-BENEFICIOS.md): las recompensas GRATIS
-- exigen agendar una cita para habilitar su QR. La cita guarda qué compra
-- viene a canjear el cliente.
-- Idempotente: se puede correr más de una vez sin efecto.

ALTER TABLE "citas" ADD COLUMN IF NOT EXISTS "compraId" TEXT;
CREATE INDEX IF NOT EXISTS "citas_compraId_idx" ON "citas" ("compraId");

DO $$ BEGIN
  ALTER TABLE "citas"
    ADD CONSTRAINT "citas_compraId_fkey"
    FOREIGN KEY ("compraId") REFERENCES "producto_compras"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
