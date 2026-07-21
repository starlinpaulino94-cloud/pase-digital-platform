import { prisma } from '@/lib/prisma'
import { createAdminClient } from '@/lib/supabase/admin'
import { vincularReferido } from '@/lib/referidos-attribution'
import { registerLimiter } from '@/lib/rate-limit'
import { TERMS_VERSION } from '@/lib/legal'
import { otorgarBienvenidaDirecta } from '@/modules/invitaciones/beneficios'
import { vincularRegalosPorContacto } from '@/modules/regalos/entrega'
import { ROLE_HOME, type AppRole } from '@/types'

/**
 * Alta / afiliación de clientes que entran por Google (Onboarding Fase 5 · O-16).
 *
 * En OAuth el usuario de Supabase Auth YA existe cuando llegamos aquí (lo creó
 * el proveedor). Esta función replica el lado de negocio de `registrarCliente`
 * para ese usuario: crea (o afilia) su `User` + `Cliente`, fija el
 * `app_metadata` que usa el middleware, y atribuye el referido. Nunca borra el
 * usuario de Auth: la sesión OAuth es válida aunque falte el paso de empresa.
 */

export type GoogleOnboardingResult =
  /** Listo: destino al que redirigir tras abrir sesión. */
  | { kind: 'ok'; dest: string }
  /** Cuenta nueva sin empresa de contexto: debe elegir una en /empresas. */
  | { kind: 'need-company' }
  /** Correo ya usado por una cuenta de contraseña: que entre por ahí. */
  | { kind: 'email-exists' }
  /** La empresa del enlace no existe o está inactiva. */
  | { kind: 'company-not-found' }
  /** Demasiadas altas desde esta IP (mismo límite que el registro clásico). */
  | { kind: 'rate-limited' }
  /** Fallo inesperado (BD caída, etc.). */
  | { kind: 'failed' }

interface GoogleOnboardingParams {
  supabaseId: string
  email: string
  name: string
  companySlug: string | null
  refCode: string
  ipAddress: string | null
}

async function fijarAppMetadata(
  supabaseId: string,
  dbUserId: string,
  clienteId: string,
  companyId: string
) {
  const admin = createAdminClient()
  await admin.auth.admin.updateUserById(supabaseId, {
    app_metadata: {
      role: 'CLIENTE',
      dbUserId,
      clienteId,
      companyId,
    },
  })
}

/** Empresa activa por slug, o null (slug vacío, inexistente o inactiva). */
async function empresaActiva(slug: string | null) {
  if (!slug) return null
  const company = await prisma.company.findUnique({ where: { slug } })
  return company && company.isActive ? company : null
}

/**
 * Autocuración: si el usuario de Auth quedó sin `app_metadata.role` (p. ej. un
 * alta previa cuya transacción se persistió pero el updateUserById falló), lo
 * repara con su Cliente principal. Best-effort: nunca rompe el login.
 */
async function sanarAppMetadataSiFalta(
  supabaseId: string,
  existing: { id: string; companyId: string | null }
) {
  try {
    const admin = createAdminClient()
    const { data } = await admin.auth.admin.getUserById(supabaseId)
    if (data.user?.app_metadata?.role) return

    const cliente =
      (existing.companyId
        ? await prisma.cliente.findUnique({
            where: {
              supabaseId_companyId: { supabaseId, companyId: existing.companyId },
            },
          })
        : null) ?? (await prisma.cliente.findFirst({ where: { supabaseId } }))
    if (!cliente) return

    await fijarAppMetadata(supabaseId, existing.id, cliente.id, cliente.companyId)
  } catch (e) {
    console.error('[google-onboarding] sanarAppMetadata error:', e)
  }
}

/**
 * Usuario recurrente por Google. Si trae contexto de empresa: se afilia si aún
 * no tiene Cliente allí, y SIEMPRE se fija el app_metadata a esa empresa —
 * esto cura metadata vacía de altas fallidas y cambia el contexto cuando un
 * cliente multi-empresa entra por el QR de otra de sus empresas.
 */
async function afiliarUsuarioExistente(
  existing: { id: string; supabaseId: string; name: string; role: string; companyId: string | null },
  params: GoogleOnboardingParams
): Promise<GoogleOnboardingResult> {
  const { supabaseId, email, companySlug, refCode, ipAddress } = params
  const destPorRol = ROLE_HOME[existing.role as AppRole] ?? ROLE_HOME.CLIENTE

  // El staff (admins/empleados) solo inicia sesión; su metadata la gestiona
  // el flujo de equipo.
  if (existing.role !== 'CLIENTE') return { kind: 'ok', dest: destPorRol }

  const company = await empresaActiva(companySlug)
  if (!company) {
    // Sin contexto utilizable: login normal, reparando metadata si quedó vacía.
    await sanarAppMetadataSiFalta(supabaseId, existing)
    return { kind: 'ok', dest: destPorRol }
  }

  let cliente = await prisma.cliente.findUnique({
    where: { supabaseId_companyId: { supabaseId, companyId: company.id } },
  })
  const esAltaNueva = !cliente

  if (!cliente) {
    cliente = await prisma.cliente.create({
      data: {
        companyId: company.id,
        supabaseId,
        nombre: existing.name,
        email,
      },
    })
    await prisma.companyFollow
      .upsert({
        where: { userId_companyId: { userId: existing.id, companyId: company.id } },
        update: {},
        create: { userId: existing.id, companyId: company.id },
      })
      .catch((e) => console.error('[google-onboarding] auto-follow error:', e))
  }

  // Siempre, aunque el Cliente ya existiera: cura metadata vacía y apunta el
  // contexto a la empresa por la que el usuario acaba de entrar.
  await fijarAppMetadata(supabaseId, existing.id, cliente.id, company.id)

  if (esAltaNueva) {
    // Usuario EXISTENTE afiliándose a otra empresa: solo cuenta con ?ref
    // explícito, nunca por la cookie silenciosa.
    await vincularReferido(refCode, company.id, cliente.id, ipAddress, {
      permitirCookie: false,
    })
    // Regalo de bienvenida de la campaña activa del negocio + regalos P2P
    // enviados a este correo antes de afiliarse. Aterriza en la celebración
    // para reclamarlo de una vez.
    await otorgarBienvenidaDirecta(cliente.id, company.id)
    await vincularRegalosPorContacto({
      clienteId: cliente.id,
      companyId: company.id,
      email,
    })
    return { kind: 'ok', dest: '/cliente/celebracion' }
  }
  return { kind: 'ok', dest: ROLE_HOME.CLIENTE }
}

export async function completeGoogleOnboarding(
  params: GoogleOnboardingParams
): Promise<GoogleOnboardingResult> {
  const { supabaseId, name, companySlug, refCode, ipAddress } = params
  const email = params.email.trim().toLowerCase()

  try {
    // ¿Ya existe una cuenta ligada a ESTE usuario de Auth?
    const existing = await prisma.user.findUnique({ where: { supabaseId } })
    if (existing) {
      return await afiliarUsuarioExistente(existing, { ...params, email })
    }

    // No hay User para este supabaseId. Si el correo ya pertenece a otra
    // cuenta (de contraseña), no duplicamos: que inicie sesión por ahí.
    const byEmail = await prisma.user.findUnique({ where: { email } })
    if (byEmail) return { kind: 'email-exists' }

    // Alta nueva: necesitamos una empresa de contexto (el modelo B2C liga cada
    // cliente a una empresa). Sin slug, mandamos a elegir empresa.
    if (!companySlug) return { kind: 'need-company' }

    const company = await empresaActiva(companySlug)
    if (!company) return { kind: 'company-not-found' }

    // Mismo freno anti-abuso por IP que el registro por contraseña: la
    // creación de cuentas no debe ser más laxa solo por entrar con Google.
    if (!(await registerLimiter(ipAddress ?? 'unknown'))) return { kind: 'rate-limited' }

    const nombre = name || email
    const result = await prisma.$transaction(async (tx) => {
      const now = new Date()
      const dbUser = await tx.user.create({
        data: {
          supabaseId,
          email,
          name: nombre,
          role: 'CLIENTE',
          companyId: company.id,
          // Al continuar con Google el usuario acepta los términos (se muestra
          // el aviso junto al botón). Marketing queda desactivado por defecto.
          termsAcceptedAt: now,
          termsVersion: TERMS_VERSION,
          marketingConsent: false,
        },
      })
      const cliente = await tx.cliente.create({
        data: {
          companyId: company.id,
          supabaseId,
          nombre,
          email,
        },
      })
      // Auto-seguir la empresa por la que se registró (consistente con el form).
      await tx.companyFollow.create({
        data: { userId: dbUser.id, companyId: company.id },
      })
      return { dbUser, cliente }
    })

    // Independientes entre sí: en paralelo. Si fijarAppMetadata falla aquí,
    // devolvemos 'failed', pero el siguiente login repara el metadata vía
    // afiliarUsuarioExistente/sanarAppMetadataSiFalta (las filas ya existen).
    await Promise.all([
      fijarAppMetadata(supabaseId, result.dbUser.id, result.cliente.id, company.id),
      vincularReferido(refCode, company.id, result.cliente.id, ipAddress),
    ])

    // Regalo de bienvenida de la campaña activa (aunque no venga de un enlace)
    // + regalos P2P enviados a este correo antes de tener cuenta.
    await otorgarBienvenidaDirecta(result.cliente.id, company.id)
    await vincularRegalosPorContacto({
      clienteId: result.cliente.id,
      companyId: company.id,
      email,
    })

    // Lo primero que ve el recién registrado: la pantalla de reclamar su
    // regalo de bienvenida (lavado gratis, etc.).
    return { kind: 'ok', dest: '/cliente/celebracion' }
  } catch (e) {
    console.error('[google-onboarding] error:', e)
    return { kind: 'failed' }
  }
}
