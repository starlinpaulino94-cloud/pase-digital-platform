-- Atribución de marketing (docs/ADQUISICION.md): canal por el que llegó cada
-- cliente (facebook, instagram, tiktok, tarjeta en la calle, …). Se captura
-- con la cookie mg_canal en los enlaces /?src=canal ANTES del registro.
-- NULL = registro directo o anterior a esta función.
-- Idempotente: se puede correr más de una vez sin efecto.

ALTER TABLE "clientes" ADD COLUMN IF NOT EXISTS "canalOrigen" TEXT;
CREATE INDEX IF NOT EXISTS "clientes_companyId_canalOrigen_idx"
  ON "clientes" ("companyId", "canalOrigen");
