import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/env'
import { getAppUrl } from '@/lib/site'
import { getRequestMeta } from '@/lib/server-utils'
import { isGoogleAuthEnabled } from '@/lib/auth/googleAuth'
import { completeGoogleOnboarding } from '@/lib/auth/googleOnboarding'

type CookieToSet = { name: string; value: string; options?: CookieOptions }

/**
 * Callback de OAuth (Onboarding Fase 5 · O-16). Google redirige aquí con un
 * `code`; lo canjeamos por sesión y luego damos de alta / afiliamos al cliente
 * según el contexto de empresa (`companySlug`, `ref`) que viajó en el
 * redirectTo. Detrás del flag `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED`.
 *
 * Las cookies de sesión se escriben sobre el objeto de respuesta del redirect
 * (patrón del callback de verificación) para no perder el token recién rotado.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const companySlug = searchParams.get('companySlug')
  const ref = searchParams.get('ref') ?? ''

  const appUrl = getAppUrl()
  const errorRedirect = (reason: string) =>
    NextResponse.redirect(new URL(`/login?error=${reason}`, appUrl))

  // Feature flag apagado o sin código: no procesamos OAuth.
  if (!isGoogleAuthEnabled()) return errorRedirect('google_off')
  if (!code) return errorRedirect('google')

  // Redirect provisional que actúa como portador de las cookies de sesión que
  // escribe exchangeCodeForSession. El destino real se decide más abajo.
  const carrier = NextResponse.redirect(new URL('/login', appUrl))

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value, options }) =>
          carrier.cookies.set(name, value, options)
        )
      },
    },
  })

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    console.error('[auth/callback] exchangeCodeForSession falló:', error)
    return errorRedirect('google')
  }

  const { data, error: userError } = await supabase.auth.getUser()
  if (userError || !data.user || !data.user.email) {
    console.error('[auth/callback] getUser tras OAuth falló:', userError)
    return errorRedirect('google')
  }

  const { ipAddress } = await getRequestMeta()
  const nombre =
    (data.user.user_metadata?.full_name as string | undefined) ??
    (data.user.user_metadata?.name as string | undefined) ??
    ''

  const result = await completeGoogleOnboarding({
    supabaseId: data.user.id,
    email: data.user.email,
    name: nombre,
    companySlug,
    refCode: ref,
    ipAddress,
  })

  // Cierra la sesión OAuth cuando no podemos completar el alta, para no dejar
  // una sesión "a medias" sin cuenta de aplicación. Las supresiones de cookie
  // se escriben sobre `carrier` y viajan al redirect final.
  const abortarConSignOut = async (url: URL) => {
    await supabase.auth.signOut().catch(() => {})
    const out = NextResponse.redirect(url)
    carrier.cookies.getAll().forEach((c) => out.cookies.set(c))
    return out
  }

  switch (result.kind) {
    case 'ok': {
      const home = NextResponse.redirect(new URL(result.dest, appUrl))
      carrier.cookies.getAll().forEach((c) => home.cookies.set(c))
      return home
    }
    case 'need-company':
      // Sesión válida pero sin empresa: que elija una y vuelva a continuar.
      return (() => {
        const pick = NextResponse.redirect(new URL('/empresas?google=1', appUrl))
        carrier.cookies.getAll().forEach((c) => pick.cookies.set(c))
        return pick
      })()
    case 'email-exists':
      return abortarConSignOut(new URL('/login?error=google_email', appUrl))
    case 'company-not-found':
      return abortarConSignOut(new URL('/login?error=google_company', appUrl))
    case 'failed':
    default:
      return abortarConSignOut(new URL('/login?error=google', appUrl))
  }
}
