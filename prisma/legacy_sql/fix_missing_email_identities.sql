-- ============================================================================
-- Reparación: usuarios de Supabase Auth sin identity de email
-- ============================================================================
-- GoTrue exige una fila en auth.identities (provider = 'email') para validar
-- el inicio de sesión con correo/contraseña. Cuando el insert de esa fila
-- falla durante el registro (p. ej. por conexiones agotadas del pooler), el
-- usuario queda creado pero su login devuelve "Invalid login credentials"
-- aunque la contraseña sea correcta.
--
-- Este script es idempotente: puede ejecutarse todas las veces que haga falta.
--
-- PASO 1 · VISTA PREVIA (no cambia nada): usuarios afectados.
-- ============================================================================
SELECT u.id, u.email, u.created_at
FROM auth.users u
WHERE u.email IS NOT NULL
  AND u.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM auth.identities i
    WHERE i.user_id = u.id AND i.provider = 'email'
  )
ORDER BY u.created_at DESC;

-- ============================================================================
-- PASO 2 · REPARACIÓN (ejecutar después de revisar el paso 1).
-- ============================================================================
INSERT INTO auth.identities
  (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
SELECT
  gen_random_uuid(),
  u.id,
  u.id::text,
  'email',
  jsonb_build_object(
    'sub', u.id::text,
    'email', u.email,
    'email_verified', true,
    'phone_verified', false
  ),
  now(), now(), now()
FROM auth.users u
WHERE u.email IS NOT NULL
  AND u.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM auth.identities i
    WHERE i.user_id = u.id AND i.provider = 'email'
  );

-- ============================================================================
-- PASO 3 · VERIFICACIÓN: debe devolver 0 filas.
-- ============================================================================
SELECT count(*) AS usuarios_sin_identity
FROM auth.users u
WHERE u.email IS NOT NULL
  AND u.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM auth.identities i
    WHERE i.user_id = u.id AND i.provider = 'email'
  );
