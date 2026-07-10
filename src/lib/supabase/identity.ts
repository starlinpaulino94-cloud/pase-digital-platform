import { prisma } from '@/lib/prisma'

/**
 * Garantiza que un usuario de Supabase Auth tenga su fila de "identity" del
 * proveedor email. GoTrue requiere esta fila para validar el inicio de sesión
 * con correo/contraseña; si falta, el login devuelve "Invalid login credentials"
 * aunque el usuario exista y tenga contraseña.
 *
 * Es idempotente (no crea duplicados) y reintenta ante fallos transitorios de
 * conexión (pooler saturado, timeouts): un usuario sin identity no puede
 * iniciar sesión, así que vale la pena insistir. Si aun así falla, se registra
 * el error pero no se interrumpe el registro del usuario; el SQL
 * prisma/legacy_sql/fix_missing_email_identities.sql repara los casos que
 * queden pendientes.
 *
 * Se apoya en que DATABASE_URL apunta a la misma base de datos del proyecto
 * Supabase, por lo que la tabla `auth.identities` es accesible vía Prisma.
 */
export async function ensureEmailIdentity(
  supabaseId: string,
  email: string
): Promise<void> {
  const MAX_INTENTOS = 3
  for (let intento = 1; intento <= MAX_INTENTOS; intento++) {
    try {
      await prisma.$executeRaw`
        insert into auth.identities
          (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
        select
          gen_random_uuid(),
          ${supabaseId}::uuid,
          ${supabaseId},
          'email',
          jsonb_build_object(
            'sub', ${supabaseId},
            'email', ${email},
            'email_verified', true,
            'phone_verified', false
          ),
          now(), now(), now()
        where not exists (
          select 1 from auth.identities i
          where i.user_id = ${supabaseId}::uuid and i.provider = 'email'
        )
      `
      return
    } catch (e) {
      console.error(
        `[auth] ensureEmailIdentity error (intento ${intento}/${MAX_INTENTOS}):`,
        e
      )
      if (intento < MAX_INTENTOS) {
        // Backoff corto: los fallos típicos (pooler saturado) son transitorios.
        await new Promise((r) => setTimeout(r, 300 * intento))
      }
    }
  }
}
