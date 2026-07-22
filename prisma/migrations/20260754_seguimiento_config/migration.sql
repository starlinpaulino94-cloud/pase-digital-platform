-- Seguimiento de beneficios gratis · Fase S3 (docs/SEGUIMIENTO-BENEFICIOS.md).
-- Configuración por empresa del módulo /admin/seguimiento: umbral de "por
-- vencer", recordatorio automático (activo, días antes, frecuencia), plantilla
-- del mensaje y promos excluidas del rastreo. NULL = defaults del módulo.
-- Idempotente: se puede correr más de una vez sin efecto.

ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "seguimientoConfig" JSONB;
