import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { EmailOtpType } from '@supabase/supabase-js'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/env'
import { getAppUrl } from '@/lib/site'
import { ROLE_HOME, type AppRole } from '@/types'

type CookieToSet = { name: string; value: string; options?: CookieOptions }

/**
 * Callback de verificación de correo (Fase 1 · O-1). El enlace del correo de
 * confirmación apunta aquí con `token_hash` + `type`. Verificamos el token
 * (abre sesión) y redirigimos al home según el rol. Las cookies de sesión se
 * escriben sobre el objeto de respuesta del redirect para no perderlas.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null

  const loginError = NextResponse.redirect(new URL('/login?error=verify', getAppUrl()))

  if (!tokenHash || !type) return loginError

  // Redirect final; las cookies de sesión se adjuntan a ESTE objeto.
  const response = NextResponse.redirect(new URL('/login?verificado=1', getAppUrl()))

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
  if (error) {
    console.error('[confirmar] verifyOtp falló:', error)
    return loginError
  }

  // Sesión abierta: llevar al usuario directo a su panel según el rol.
  const { data } = await supabase.auth.getUser()
  const role = (data.user?.app_metadata?.role ?? 'CLIENTE') as AppRole
  const dest = ROLE_HOME[role] ?? '/mis-membresias'

  const home = NextResponse.redirect(new URL(dest, getAppUrl()))
  response.cookies.getAll().forEach((c) => home.cookies.set(c))
  return home
}
