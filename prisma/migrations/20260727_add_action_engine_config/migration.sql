-- FASE 3 (Motor Universal de Acciones): configuración de acciones por datos.
-- Solo AÑADE columnas con DEFAULT a rule_actions (obligatoria, maxReintentos,
-- activa, version) para configurar cada acción sin código. Seguro sobre filas
-- existentes; no altera semántica previa. Ningún flujo de la app lo consume aún.

-- AlterTable
ALTER TABLE "rule_actions" ADD COLUMN     "activa" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "maxReintentos" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "obligatoria" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

