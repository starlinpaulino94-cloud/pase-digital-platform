/**
 * Login social con Google (Onboarding Fase 5 · O-16), detrás de un flag.
 *
 * Con `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true` se muestra el botón "Continuar
 * con Google" y se activa la ruta de callback. Requiere además configurar el
 * proveedor Google en Supabase (Authentication → Providers → Google) con el
 * Client ID/Secret de Google Cloud y la Redirect URL del proyecto.
 *
 * NEXT_PUBLIC_* se inyecta en el bundle, así que este helper funciona igual en
 * cliente y servidor.
 */
export function isGoogleAuthEnabled(): boolean {
  return process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === 'true'
}
