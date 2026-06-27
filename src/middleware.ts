import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import type { AppMetadata, AppRole } from '@/types/auth'

// Routes that never require authentication.
const PUBLIC_ROUTES = ['/']

// Routes that belong to the auth flow (redirect away if already logged in).
const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password']

// Role → default post-login destination.
const ROLE_HOME: Record<AppRole, string> = {
  SUPERADMIN: '/admin',
  ADMIN_EMPRESA: '/dashboard',
  EMPLEADO: '/dashboard',
  CLIENTE: '/profile',
}

// Route prefixes that require a specific minimum role.
// Checked in order — first match wins.
const PROTECTED_PREFIXES: Array<{ prefix: string; roles: AppRole[] }> = [
  { prefix: '/admin', roles: ['SUPERADMIN'] },
  { prefix: '/dashboard', roles: ['SUPERADMIN', 'ADMIN_EMPRESA', 'EMPLEADO'] },
  { prefix: '/profile', roles: ['SUPERADMIN', 'CLIENTE'] },
]

function getRoleFromMetadata(appMetadata: Record<string, unknown>): AppRole {
  const role = (appMetadata as Partial<AppMetadata>).role
  return role ?? 'CLIENTE'
}

function isAllowed(role: AppRole, allowedRoles: AppRole[]): boolean {
  return allowedRoles.includes(role)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Refresh the Supabase session (rotates cookies if needed).
  const { supabaseResponse, user } = await updateSession(request)

  const isPublicRoute = PUBLIC_ROUTES.some((r) => pathname === r)
  const isAuthRoute = AUTH_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`)
  )

  // ── Unauthenticated user ────────────────────────────────────
  if (!user) {
    if (isPublicRoute || isAuthRoute) return supabaseResponse

    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── Authenticated user ──────────────────────────────────────
  const role = getRoleFromMetadata(user.app_metadata ?? {})

  // Redirect away from auth pages to role-appropriate home.
  if (isAuthRoute) {
    const nextParam = request.nextUrl.searchParams.get('next')
    const destination = nextParam ?? ROLE_HOME[role]
    const homeUrl = request.nextUrl.clone()
    homeUrl.pathname = destination
    homeUrl.searchParams.delete('next')
    return NextResponse.redirect(homeUrl)
  }

  // Root redirect to role home.
  if (pathname === '/') {
    const homeUrl = request.nextUrl.clone()
    homeUrl.pathname = ROLE_HOME[role]
    return NextResponse.redirect(homeUrl)
  }

  // Enforce role-based access on protected prefixes.
  for (const { prefix, roles } of PROTECTED_PREFIXES) {
    if (pathname.startsWith(prefix) && !isAllowed(role, roles)) {
      const forbiddenUrl = request.nextUrl.clone()
      forbiddenUrl.pathname = '/login'
      forbiddenUrl.searchParams.set('error', 'forbidden')
      return NextResponse.redirect(forbiddenUrl)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
