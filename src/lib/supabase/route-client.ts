import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/env'

type CookieToSet = { name: string; value: string; options?: CookieOptions }

/**
 * Cliente Supabase para route handlers (callbacks de confirmación/OAuth).
 * Lee las cookies del request y escribe las nuevas (tokens abiertos/rotados)
 * sobre `carrier`, un NextResponse que actúa como acumulador hasta decidir el
 * redirect final. Única implementación de este cableado: antes vivía copiado
 * en cada callback y cualquier corrección había que replicarla a mano.
 */
export function createRouteClient(request: NextRequest, carrier: NextResponse) {
  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
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
}

/**
 * Redirect que conserva los Set-Cookie acumulados en `carrier`. Un redirect
 * "limpio" descartaría el token recién abierto/rotado y el navegador
 * reutilizaría el anterior → "Invalid Refresh Token: Already Used" → sesión
 * muerta (mismo patrón que documenta el middleware).
 */
export function redirectWithCookies(url: URL, carrier: NextResponse) {
  const redirect = NextResponse.redirect(url)
  carrier.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
  return redirect
}
