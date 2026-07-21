import { cache } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { isTransientAuthError } from '@/lib/auth/transient'
import type { AppMetadata, SessionUser } from '@/types'

function toSessionUser(user: User): SessionUser {
  const metadata = (user.app_metadata ?? {}) as Partial<AppMetadata>

  return {
    supabaseId: user.id,
    email: user.email ?? '',
    metadata: {
      role: metadata.role ?? 'CLIENTE',
      dbUserId: metadata.dbUserId ?? '',
      clienteId: metadata.clienteId ?? null,
      companyId: metadata.companyId ?? null,
    },
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Usuario de la sesión actual, validado contra el servidor de Supabase.
 *
 * Envuelto en React.cache(): dentro de un mismo request RSC (layout +
 * page + guards) la validación de red se ejecuta UNA sola vez, en lugar
 * de una por cada guard/consulta que necesite el usuario.
 *
 * Un fallo transitorio de Supabase Auth (429/5xx/red) se REINTENTA una vez
 * (con la verificación de firma intacta), en lugar de tratarse como "sin
 * sesión" y expulsar al usuario. NO caemos a getSession(): decodifica el
 * JWT de la cookie SIN verificar la firma, y usarlo para autorización
 * permitiría un rol falsificado durante un 429/outage.
 */
export const getUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient()

  let { data, error } = await supabase.auth.getUser()
  if (!data.user && isTransientAuthError(error)) {
    await sleep(250)
    ;({ data, error } = await supabase.auth.getUser())
  }
  if (!data.user) return null

  let session = toSessionUser(data.user)

  // AUTO-REPARACIÓN: una sesión CLIENTE sin clienteId/companyId (registro
  // general, alta a medias, metadata nunca fijado) rompe TODOS los módulos,
  // cada uno con un error distinto. Se repara aquí una sola vez por request
  // (getUser está cacheado): afilia a la empresa principal si hace falta y
  // deja el app_metadata consistente. Import dinámico para no arrastrar
  // Prisma a contextos que solo leen la sesión.
  if (
    session.metadata.role === 'CLIENTE' &&
    (!session.metadata.clienteId || !session.metadata.companyId)
  ) {
    try {
      const { repararContextoCliente } = await import('@/lib/auth/reparar-contexto')
      session = await repararContextoCliente(session)
    } catch (e) {
      console.error('[auth] reparación de contexto falló:', e)
    }
  }

  return session
})
