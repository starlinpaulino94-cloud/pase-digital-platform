-- Share Engine: textos editables al compartir una promoción
-- (JSON { ogTitulo?, ogDescripcion? }; NULL = usar título/descripción base).
-- Idempotente: se puede correr más de una vez sin efecto.

ALTER TABLE "promociones" ADD COLUMN IF NOT EXISTS "shareConfig" JSONB;
