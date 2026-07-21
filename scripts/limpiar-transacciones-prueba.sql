-- ═══════════════════════════════════════════════════════════════════════════
-- LIMPIEZA DE MONTOS DE PRUEBA — pegar en el editor SQL de Supabase.
--
-- Marca como CANCELLED (anuladas) las transacciones APLICADAS de las cuentas
-- de prueba: dejan de sumar en ganancias, cierres, cuadres y reportes AL
-- INSTANTE. No borra nada (el historial se conserva). Idempotente: correrlo
-- dos veces no hace daño.
--
-- USO: reemplaza los correos de ejemplo del paso 1 por los de TUS cuentas de
-- prueba y ejecuta los pasos en orden.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1) VISTA PREVIA — qué se anularía y cuánto suma (revisa antes de ejecutar 2).
SELECT t."codigo", t."ticketNumero", c."nombre" AS cliente, c."email",
       t."tipo", t."monto", t."createdAt"
FROM "transactions" t
JOIN "clientes" c ON c."id" = t."clienteId"
WHERE t."estado" = 'APPLIED'
  AND c."email" IN (
    'prueba1@correo.com',   -- ← reemplaza por tus cuentas de prueba
    'prueba2@correo.com'
  )
ORDER BY t."createdAt";

-- 2) ANULAR — mismas condiciones que la vista previa.
UPDATE "transactions" t
SET "estado" = 'CANCELLED', "cancelledAt" = NOW()
FROM "clientes" c
WHERE c."id" = t."clienteId"
  AND t."estado" = 'APPLIED'
  AND c."email" IN (
    'prueba1@correo.com',   -- ← mismos correos que arriba
    'prueba2@correo.com'
  );

-- 3) (OPCIONAL) Huérfanas: transacciones con monto de clientes YA ELIMINADOS
--    (la purga del superadmin conserva las transacciones sin cliente). Ejecuta
--    primero el SELECT para revisarlas; si todas son de prueba, corre el UPDATE.
SELECT "codigo", "ticketNumero", "tipo", "monto", "createdAt"
FROM "transactions"
WHERE "estado" = 'APPLIED' AND "clienteId" IS NULL AND "monto" > 0
ORDER BY "createdAt";

-- UPDATE "transactions"
-- SET "estado" = 'CANCELLED', "cancelledAt" = NOW()
-- WHERE "estado" = 'APPLIED' AND "clienteId" IS NULL AND "monto" > 0;

-- 4) VERIFICAR — total de ingresos aplicados que queda por empresa.
SELECT co."name" AS empresa, COUNT(*) AS transacciones,
       COALESCE(SUM(t."monto"), 0) AS ingresos_aplicados
FROM "transactions" t
JOIN "companies" co ON co."id" = t."companyId"
WHERE t."estado" = 'APPLIED' AND t."monto" IS NOT NULL
GROUP BY co."name";
