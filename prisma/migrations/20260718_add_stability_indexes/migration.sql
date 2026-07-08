-- Auditoría de estabilidad (Etapa 2): índices faltantes cruzados con las
-- queries reales. Todos aditivos e idempotentes.

-- memberships: conteos por plan (reportes, borrado seguro de planes) y el
-- patrón caliente de dashboards/automatizaciones (empresa + estado + vencimiento).
CREATE INDEX IF NOT EXISTS "memberships_planId_idx" ON "memberships"("planId");
CREATE INDEX IF NOT EXISTS "memberships_companyId_estado_fechaVencimiento_idx"
  ON "memberships"("companyId", "estado", "fechaVencimiento");

-- promociones: feed público filtra sin companyId por estado de publicación;
-- sin índice cada carga del feed escanea la tabla completa.
CREATE INDEX IF NOT EXISTS "promociones_activo_archivada_visibilidad_publicadaEn_idx"
  ON "promociones"("activo", "archivada", "visibilidad", "publicadaEn");

-- FKs consultadas por companyId (perfil público, paneles).
CREATE INDEX IF NOT EXISTS "plans_companyId_idx" ON "plans"("companyId");
CREATE INDEX IF NOT EXISTS "sucursales_companyId_idx" ON "sucursales"("companyId");
CREATE INDEX IF NOT EXISTS "metodos_pago_companyId_idx" ON "metodos_pago"("companyId");

-- comprobantes: lookup por membresía.
CREATE INDEX IF NOT EXISTS "comprobantes_membershipId_idx" ON "comprobantes"("membershipId");

-- visits: conteos por vehículo (perfil) y por sucursal (panel de sucursales).
CREATE INDEX IF NOT EXISTS "visits_vehiculoId_idx" ON "visits"("vehiculoId");
CREATE INDEX IF NOT EXISTS "visits_sucursalId_idx" ON "visits"("sucursalId");
