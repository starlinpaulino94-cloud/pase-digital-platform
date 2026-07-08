import { prisma } from '@/lib/prisma'
import { createAdminClient } from '@/lib/supabase/admin'
import { vincularReferido } from '@/lib/referidos-attribution'
import { TERMS_VERSION } from '@/lib/legal'
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
  /** Fallo inesperado (BD caída, etc.). */
  | { kind: 'failed' }

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

export async function completeGoogleOnboarding(params: {
  supabaseId: string
  email: string
  name: string
  companySlug: string | null
  refCode: string
  ipAddress: string | null
}): Promise<GoogleOnboardingResult> {
  const { supabaseId, name, companySlug, refCode, ipAddress } = params
  const email = params.email.trim().toLowerCase()

  try {
    // ¿Ya existe una cuenta ligada a ESTE usuario de Auth?
    const existing = await prisma.user.findUnique({ where: { supabaseId } })

    if (existing) {
      // Usuario recurrente por Google. Si trae contexto de empresa y aún no
      // tiene Cliente allí, lo afiliamos (alta multi-empresa); si no, va a su
      // panel según el rol.
      if (existing.role === 'CLIENTE' && companySlug) {
        const company = await prisma.company.findUnique({ where: { slug: companySlug } })
        if (company && company.isActive) {
          const yaCliente = await prisma.cliente.findUnique({
            where: {
              supabaseId_companyId: { supabaseId, companyId: company.id },
            },
          })
          if (!yaCliente) {
            const cliente = await prisma.cliente.create({
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
            await fijarAppMetadata(supabaseId, existing.id, cliente.id, company.id)
            await vincularReferido(refCode, company.id, cliente.id, ipAddress)
            return { kind: 'ok', dest: '/cliente/membresia' }
          }
        }
      }
      const role = existing.role as AppRole
      return { kind: 'ok', dest: ROLE_HOME[role] ?? '/cliente/membresia' }
    }

    // No hay User para este supabaseId. Si el correo ya pertenece a otra
    // cuenta (de contraseña), no duplicamos: que inicie sesión por ahí.
    const byEmail = await prisma.user.findUnique({ where: { email } })
    if (byEmail) return { kind: 'email-exists' }

    // Alta nueva: necesitamos una empresa de contexto (el modelo B2C liga cada
    // cliente a una empresa). Sin slug, mandamos a elegir empresa.
    if (!companySlug) return { kind: 'need-company' }

    const company = await prisma.company.findUnique({ where: { slug: companySlug } })
    if (!company || !company.isActive) return { kind: 'company-not-found' }

    const result = await prisma.$transaction(async (tx) => {
      const now = new Date()
      const dbUser = await tx.user.create({
        data: {
          supabaseId,
          email,
          name: name || email,
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
          nombre: name || email,
          email,
        },
      })
      // Auto-seguir la empresa por la que se registró (consistente con el form).
      await tx.companyFollow.create({
        data: { userId: dbUser.id, companyId: company.id },
      })
      return { dbUser, cliente }
    })

    await fijarAppMetadata(supabaseId, result.dbUser.id, result.cliente.id, company.id)
    await vincularReferido(refCode, company.id, result.cliente.id, ipAddress)

    return { kind: 'ok', dest: '/cliente/membresia' }
  } catch (e) {
    console.error('[google-onboarding] error:', e)
    return { kind: 'failed' }
  }
}
