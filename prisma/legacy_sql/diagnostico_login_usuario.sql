-- ============================================================================
-- Diagnóstico de login para un usuario específico
-- ============================================================================
-- Uso: reemplaza el correo en la primera línea si necesitas otro usuario.
-- Ejecuta TODO el script y revisa cada resultado.

-- ────────────────────────────────────────────────────────────────────────────
-- CONSULTA 1 · ¿Existe en Supabase Auth y en qué estado?
--   - tiene_password = false  → nunca se le fijó contraseña (login imposible)
--   - email_confirmed_at NULL → correo sin confirmar (GoTrue rechaza el login)
--   - banned_until con valor  → cuenta bloqueada
-- ────────────────────────────────────────────────────────────────────────────
SELECT
  u.id,
  u.email,
  u.created_at,
  u.email_confirmed_at,
  u.banned_until,
  u.deleted_at,
  (u.encrypted_password IS NOT NULL AND u.encrypted_password <> '') AS tiene_password
FROM auth.users u
WHERE u.email ILIKE '%tmbrokermark%';

-- ────────────────────────────────────────────────────────────────────────────
-- CONSULTA 2 · Identities del usuario (debe existir una con provider 'email')
-- ────────────────────────────────────────────────────────────────────────────
SELECT i.provider, i.provider_id, i.identity_data->>'email' AS email_identity, i.created_at
FROM auth.identities i
JOIN auth.users u ON u.id = i.user_id
WHERE u.email ILIKE '%tmbrokermark%';

-- ────────────────────────────────────────────────────────────────────────────
-- CONSULTA 3 · ¿Cuándo se creó su cuenta en la app? Si "users.created_at" es
-- muy anterior a la fecha del registro reciente, el "registro" de ahora fue
-- una AFILIACIÓN a otra empresa: la contraseña válida es la ORIGINAL de la
-- cuenta, no la que escribió en el formulario reciente.
-- ────────────────────────────────────────────────────────────────────────────
SELECT id, email, name, role, "createdAt"
FROM public.users
WHERE email ILIKE '%tmbrokermark%';

SELECT c.id, c.email, c.nombre, c."createdAt", co.name AS empresa
FROM public.clientes c
JOIN public.companies co ON co.id = c."companyId"
WHERE c.email ILIKE '%tmbrokermark%'
ORDER BY c."createdAt";
