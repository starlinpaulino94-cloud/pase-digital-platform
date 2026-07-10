import { NextResponse, type NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createRouteClient, redirectWithCookies } from '@/lib/supabase/route-client'
import { getAppUrl } from '@/lib/site'
import { ROLE_HOME, type AppRole } from '@/types'

/**
 * Callback de verificación de correo (Fase 1 · O-1). El enlace del correo de
 * confirmación apunta aquí con `token_hash` + `type`. Verificamos el token
 * (abre sesión) y redirigimos al home según el rol. Las cookies de sesión se
 * acumulan en un carrier y viajan en el redirect final para no perderlas.
 *
 * Aquí sí usamos getAppUrl: el enlace del correo se construyó con ese mismo
 * dominio canónico, así que request y destino comparten host.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null

  const loginError = NextResponse.redirect(new URL('/login?error=verify', getAppUrl()))

  if (!tokenHash || !type) return loginError

  // Acumulador de cookies de sesión; el redirect final las conserva.
  const carrier = NextResponse.next()
  const supabase = createRouteClient(request, carrier)

  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
  if (error) {
    console.error('[confirmar] verifyOtp falló:', error)
    return loginError
  }

  // Sesión abierta: llevar al usuario directo a su panel según el rol.
  const { data } = await supabase.auth.getUser()
  const role = (data.user?.app_metadata?.role ?? 'CLIENTE') as AppRole
  const dest = ROLE_HOME[role] ?? '/mis-membresias'

  return redirectWithCookies(new URL(dest, getAppUrl()), carrier)
}
