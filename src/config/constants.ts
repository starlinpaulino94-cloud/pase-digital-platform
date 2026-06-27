export const APP_NAME = 'PASE Digital'
export const APP_DESCRIPTION = 'Plataforma de fidelización y promociones con QR'

export const PAGINATION_DEFAULT_PAGE_SIZE = 20
export const PAGINATION_MAX_PAGE_SIZE = 100

export const QR_TOKEN_LENGTH = 32

export const RATE_LIMIT_SCAN_MAX = 60
export const RATE_LIMIT_SCAN_WINDOW_MS = 60 * 1000

// ── Auth routes ──────────────────────────────────────────────

export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',

  // Role-specific homes
  adminHome: '/admin',
  dashboardHome: '/dashboard',
  profileHome: '/profile',
} as const

// Supabase app_metadata key used to store role and context.
// Must match what the Supabase Auth JWT hook sets.
export const SUPABASE_METADATA_KEY = 'app_metadata'
