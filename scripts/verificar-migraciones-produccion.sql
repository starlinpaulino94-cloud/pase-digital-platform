-- Verificación de migraciones recientes aplicadas en producción (todas OK)
SELECT 'E7 companies.escanerModo' AS objeto,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns
         WHERE table_name='companies' AND column_name='escanerModo') THEN 'OK' ELSE 'FALTA — corre supabase-20260742' END AS estado
UNION ALL
SELECT 'E4 tabla transactions',
       CASE WHEN to_regclass('public.transactions') IS NOT NULL THEN 'OK' ELSE 'FALTA — corre supabase-20260738' END
UNION ALL
SELECT 'E5 tabla producto_compras',
       CASE WHEN to_regclass('public.producto_compras') IS NOT NULL THEN 'OK' ELSE 'FALTA — corre supabase-20260739' END
UNION ALL
SELECT 'E5 bucket promociones',
       CASE WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id='promociones') THEN 'OK' ELSE 'FALTA — corre supabase-20260739' END
UNION ALL
SELECT 'E6 referral_events.visitorId',
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns
         WHERE table_name='referral_events' AND column_name='visitorId') THEN 'OK' ELSE 'FALTA — corre supabase-20260740' END
UNION ALL
SELECT 'E6 tabla referral_recompensas',
       CASE WHEN to_regclass('public.referral_recompensas') IS NOT NULL THEN 'OK' ELSE 'FALTA — corre supabase-20260740' END
UNION ALL
SELECT 'E6.1 índice campaña',
       CASE WHEN to_regclass('public.referral_events_meta_campana_idx') IS NOT NULL THEN 'OK' ELSE 'FALTA — corre supabase-20260741' END;
