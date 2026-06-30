import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { ROLE_HOME, type AppMetadata, type AppRole } from '@/types'

type CookieToSet = { name: string; value: string; options?: CookieOptions }

// Route prefix -> roles allowed to access it
const PROTECTED: { prefix: string; roles: AppRole[] }[] = [
  { prefix: '/superadmin', roles: ['SUPERADMIN'] },
  {
    prefix: '/admin',
    roles: ['SUPERADMIN', 'ADMINISTRADOR', 'GERENTE', 'CAJERO', 'ADMIN_EMPRESA'],
  },
  {
    prefix: '/empleado',
    roles: [
      'SUPERADMIN',
      'ADMINISTRADOR',
      'GERENTE',
      'CAJERO',
      'RECEPCION',
      'EMPLEADO',
      'ADMIN_EMPRESA',
    ],
  },
  { prefix: '/cliente', roles: ['CLIENTE'] },
]

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet: CookieToSet[]) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )
            response = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const path = request.nextUrl.pathname
    const matched = PROTECTED.find((r) => path.startsWith(r.prefix))

    if (matched) {
      if (!user) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('redirect', path)
        return NextResponse.redirect(url)
      }
      const metadata = (user.app_metadata ?? {}) as Partial<AppMetadata>
      const role = metadata.role ?? 'CLIENTE'
      if (!matched.roles.includes(role)) {
        const url = request.nextUrl.clone()
        url.pathname = ROLE_HOME[role]
        return NextResponse.redirect(url)
      }
    }

    // Redirect logged-in users away from login page
    if (path === '/login' && user) {
      const metadata = (user.app_metadata ?? {}) as Partial<AppMetadata>
      const role = metadata.role ?? 'CLIENTE'
      const url = request.nextUrl.clone()
      url.pathname = ROLE_HOME[role]
      return NextResponse.redirect(url)
    }
  } catch {
    // If auth check fails, allow the request to continue
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
