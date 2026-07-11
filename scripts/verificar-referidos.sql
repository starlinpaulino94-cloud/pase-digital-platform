-- ═══════════════════════════════════════════════════════════════════════════
-- FASE E6 · Auditoría de métricas del Referral Engine
-- Cada métrica del dashboard tiene aquí su query fuente EXACTA: ejecutar en
-- el editor SQL de Supabase y contrastar contra lo que muestra el panel.
-- Reemplaza :companyId por el id de la empresa a auditar (o quita el filtro).
-- ═══════════════════════════════════════════════════════════════════════════

-- 1) Embudo (mismas fuentes que el dashboard, una por etapa)
SELECT 'links generados' AS metrica, count(*) FROM "referral_events"
 WHERE "companyId" = :companyId AND tipo = 'LINK'
UNION ALL
SELECT 'compartidos', count(*) FROM "referral_events"
 WHERE "companyId" = :companyId AND tipo = 'SHARE'
UNION ALL
SELECT 'clics totales', count(*) FROM "referral_events"
 WHERE "companyId" = :companyId AND tipo = 'CLICK'
UNION ALL
SELECT 'visitantes únicos', count(DISTINCT "visitorId") FROM "referral_events"
 WHERE "companyId" = :companyId AND tipo = 'CLICK' AND "visitorId" IS NOT NULL
UNION ALL
SELECT 'registros iniciados', count(*) FROM "referral_events"
 WHERE "companyId" = :companyId AND tipo = 'REGISTRO_INICIADO'
UNION ALL
SELECT 'registros completados (legítimos)', count(*) FROM "referidos"
 WHERE "companyId" = :companyId AND sospechoso = false
UNION ALL
SELECT 'verificados', count(*) FROM "referral_events"
 WHERE "companyId" = :companyId AND tipo = 'VERIFICADO'
UNION ALL
SELECT 'compras realizadas', count(*) FROM "referral_events"
 WHERE "companyId" = :companyId AND tipo = 'COMPRA'
UNION ALL
SELECT 'referidos válidos (convertidos)', count(*) FROM "referidos"
 WHERE "companyId" = :companyId AND estado = 'COMPLETADO' AND sospechoso = false
UNION ALL
SELECT 'recompensas entregadas', count(*) FROM "referral_recompensas"
 WHERE "companyId" = :companyId AND estado = 'ENTREGADA'
UNION ALL
SELECT 'recompensas pendientes', count(*) FROM "referral_recompensas"
 WHERE "companyId" = :companyId AND estado = 'PENDIENTE'
UNION ALL
SELECT 'sospechosos', count(*) FROM "referidos"
 WHERE "companyId" = :companyId AND sospechoso = true
UNION ALL
SELECT 'eventos de fraude', count(*) FROM "referral_events"
 WHERE "companyId" = :companyId AND tipo = 'FRAUDE';

-- 2) Ingresos por referidos (solo legítimos convertidos, pagos confirmados)
SELECT COALESCE(sum(m."montoPagado"), 0) AS ingresos_referidos
  FROM "memberships" m
 WHERE m."pagoConfirmado" = true
   AND EXISTS (
     SELECT 1 FROM "referidos" r
      WHERE r."referidoClienteId" = m."clienteId"
        AND r.estado = 'COMPLETADO' AND r.sospechoso = false
        AND r."companyId" = :companyId
   );

-- 3) Tiempo promedio a conversión (días)
SELECT round(avg(EXTRACT(EPOCH FROM ("completadoEn" - "createdAt")) / 86400)::numeric, 1)
       AS dias_promedio_conversion
  FROM "referidos"
 WHERE "companyId" = :companyId AND estado = 'COMPLETADO'
   AND sospechoso = false AND "completadoEn" IS NOT NULL;

-- 4) Recorrido completo de UN referido (línea de tiempo auditable)
--    Reemplaza :referidoClienteId.
SELECT e."createdAt", e.tipo, e.canal, e.puntos, e."visitorId"
  FROM "referral_events" e
 WHERE e."referidoClienteId" = :referidoClienteId
    OR e."visitorId" = (
      SELECT "visitorId" FROM "referral_events"
       WHERE tipo = 'REGISTRO' AND "referidoClienteId" = :referidoClienteId
       LIMIT 1
    )
 ORDER BY e."createdAt";

-- 5) Consistencia interna (deben devolver 0 filas si todo está sano)
-- 5a. Referidos COMPLETADOS que son sospechosos (no debería ocurrir post-E6)
SELECT id, "referidoClienteId" FROM "referidos"
 WHERE estado = 'COMPLETADO' AND sospechoso = true;
-- 5b. Recompensas duplicadas por referente+regla (bloqueadas por unique)
SELECT "referenteClienteId", "reglaId", count(*) FROM "referral_recompensas"
 GROUP BY 1, 2 HAVING count(*) > 1;
-- 5c. Conversiones sin evento COMPRA asociado (post-E6 no debería ocurrir)
SELECT r.id FROM "referidos" r
 WHERE r.estado = 'COMPLETADO' AND r."completadoEn" > now() - interval '30 days'
   AND NOT EXISTS (
     SELECT 1 FROM "referral_events" e
      WHERE e.tipo = 'COMPRA' AND e."referidoClienteId" = r."referidoClienteId"
   );
