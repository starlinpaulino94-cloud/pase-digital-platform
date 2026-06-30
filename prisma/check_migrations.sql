-- Verificación: ejecuta esto en el editor SQL de Supabase para ver qué migraciones
-- ya están aplicadas. Cada fila te dice SI/NO.

SELECT
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs')
    AS fase_a_aplicada,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notificaciones')
    AS notificaciones_aplicada,
  EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'NotifTipo' AND e.enumlabel = 'PROMOCION_NUEVA'
  ) AS promociones_notif_aplicada,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'promociones')
    AS promociones_aplicada,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referidos')
    AS referidos_aplicada,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'whatsapp_config')
    AS whatsapp_aplicada,
  EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'AuditAccion' AND e.enumlabel = 'QR_USADO'
  ) AS qr_single_use_aplicada;
