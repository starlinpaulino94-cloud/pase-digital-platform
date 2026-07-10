-- ============================================================================
-- Limpieza de eventos de referido inflados (bots de preview + doble conteo)
-- ============================================================================
-- Antes del fix, los bots de vista previa de WhatsApp/Telegram contaban como
-- clics y un mismo gesto de compartir podía contar dos veces. Este script
-- colapsa las ráfagas: si hay varios eventos del mismo tipo y cliente con
-- menos de 60 segundos entre sí, conserva el primero y borra el resto.
-- Los puntos se corrigen solos (se calculan contando eventos).
--
-- PASO 1 · VISTA PREVIA (no borra nada): cuántos eventos se eliminarían.
-- ============================================================================
WITH ordenados AS (
  SELECT id, tipo, "clienteId", "createdAt",
         LAG("createdAt") OVER (
           PARTITION BY "clienteId", tipo ORDER BY "createdAt"
         ) AS anterior
  FROM "referral_events"
  WHERE tipo IN ('CLICK', 'SHARE')
)
SELECT tipo, count(*) AS a_eliminar
FROM ordenados
WHERE anterior IS NOT NULL
  AND "createdAt" - anterior < interval '60 seconds'
GROUP BY tipo;

-- ============================================================================
-- PASO 2 · LIMPIEZA (ejecutar después de revisar el paso 1).
-- ============================================================================
WITH ordenados AS (
  SELECT id, tipo, "clienteId", "createdAt",
         LAG("createdAt") OVER (
           PARTITION BY "clienteId", tipo ORDER BY "createdAt"
         ) AS anterior
  FROM "referral_events"
  WHERE tipo IN ('CLICK', 'SHARE')
)
DELETE FROM "referral_events"
WHERE id IN (
  SELECT id FROM ordenados
  WHERE anterior IS NOT NULL
    AND "createdAt" - anterior < interval '60 seconds'
);
