'use server'

import { prisma } from '@/lib/prisma'
import { createAdminClient } from '@/lib/supabase/admin'
import { ensureEmailIdentity } from '@/lib/supabase/identity'
import { registerLimiter } from '@/lib/rate-limit'
import { getRequestMeta } from '@/lib/server-utils'
import { vincularReferido } from '@/lib/referidos-attribution'
import { TERMS_VERSION } from '@/lib/legal'
import { isEmailVerificationEnabled, sendVerificationEmail } from '@/lib/auth/emailVerification'

export interface RegistroState {
  error?: string
  success?: boolean
  /** Cuenta creada pero pendiente de confirmar el correo (flag O-1). */
  pendingVerification?: boolean
}

export async function registrarCliente(
  _prev: RegistroState,
  formData: FormData
): Promise<RegistroState> {
  try {
  // Rate limit server-side por IP: evita creación masiva de cuentas / spam.
  // El límite del navegador no cuenta como protección (se salta recargando).
  const { ipAddress } = await getRequestMeta()
  if (!registerLimiter(ipAddress ?? 'unknown')) {
    return { error: 'Demasiados registros desde esta conexión. Intenta de nuevo en unos minutos.' }
  }

  const companySlug = String(formData.get('companySlug') ?? '')
  const nombre = String(formData.get('nombre') ?? '').trim()
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase()
  const password = String(formData.get('password') ?? '')
  const telefono = String(formData.get('telefono') ?? '').trim()
  const refCode = String(formData.get('refCode') ?? '').trim()
  // F5.2: auto-seguir con opción de desmarcar. El hidden "off" va primero;
  // si el checkbox está marcado, el último valor es "on".
  const seguirEmpresa = formData.getAll('seguirEmpresa').at(-1) !== 'off'
  // Consentimiento (Fase 1): términos obligatorio, marketing opcional.
  const aceptaTerminos = formData.get('terminos') === 'on'
  const marketingConsent = formData.getAll('marketingConsent').at(-1) === 'on'

  // Vehiculo (optional, for carwash)
  const marca = String(formData.get('marca') ?? '').trim()
  const modelo = String(formData.get('modelo') ?? '').trim()
  const anioRaw = String(formData.get('anio') ?? '').trim()
  const color = String(formData.get('color') ?? '').trim()
  const placa = String(formData.get('placa') ?? '').trim()

  if (!nombre || !email || !password) {
    return { error: 'Completa todos los campos obligatorios.' }
  }
  if (password.length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres.' }
  }
  if (!aceptaTerminos) {
    return { error: 'Debes aceptar los términos y la política de privacidad.' }
  }

  // La empresa debe existir realmente en la BD: su id se usa como FK al crear
  // el Cliente. Un fallback con id ficticio provocaría una violación de FK y
  // dejaría un usuario huérfano en Supabase Auth, así que devolvemos un error
  // limpio si no se encuentra o si la BD no está disponible.
  let company: { id: string; name: string; slug: string; type: string } | null = null
  try {
    company = await prisma.company.findUnique({ where: { slug: companySlug } })
  } catch (e) {
    console.error('[registro] company lookup error:', e)
    return { error: 'No se pudo verificar la empresa. Intenta de nuevo.' }
  }
  if (!company) {
    return { error: 'Empresa no encontrada.' }
  }

  const admin = createAdminClient()

  // Si ya existe una cuenta de cliente con este correo, esto es una
  // afiliación a una empresa adicional, no un registro nuevo.
  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser && existingUser.role !== 'CLIENTE') {
    return { error: 'Ya existe una cuenta con este correo.' }
  }
  if (existingUser) {
    const existingCliente = await prisma.cliente.findUnique({
      where: {
        supabaseId_companyId: {
          supabaseId: existingUser.supabaseId,
          companyId: company.id,
        },
      },
    })
    if (existingCliente) {
      return { error: 'Ya tienes una cuenta en esta empresa. Inicia sesión.' }
    }

    try {
      const cliente = await prisma.cliente.create({
        data: {
          companyId: company.id,
          supabaseId: existingUser.supabaseId,
          nombre: existingUser.name,
          email,
          telefono: telefono || null,
        },
      })

      if (marca && modelo && anioRaw && color) {
        const anio = Number(anioRaw)
        if (!Number.isNaN(anio)) {
          await prisma.vehiculo.create({
            data: { clienteId: cliente.id, marca, modelo, anio, color, placa: placa || null },
          })
        }
      }

      // FASE 3/5.2: seguir la empresa al registrarse (salvo que lo desmarque).
      if (seguirEmpresa) {
        await prisma.companyFollow
          .upsert({
            where: {
              userId_companyId: { userId: existingUser.id, companyId: company.id },
            },
            update: {},
            create: { userId: existingUser.id, companyId: company.id },
          })
          .catch((e) => console.error('[registro] auto-follow error:', e))
      }

      await admin.auth.admin.updateUserById(existingUser.supabaseId, {
        app_metadata: {
          role: 'CLIENTE',
          dbUserId: existingUser.id,
          clienteId: cliente.id,
          companyId: company.id,
        },
      })

      // Usuario EXISTENTE afiliándose: solo cuenta con ?ref explícito, nunca
      // por la cookie silenciosa (evita atribuciones fantasma de 30 días).
      await vincularReferido(refCode, company.id, cliente.id, ipAddress, {
        permitirCookie: false,
      })

      return { success: true }
    } catch (e) {
      console.error('[registro] afiliación a nueva empresa error:', e)
      return { error: 'No se pudo completar el registro. Intenta de nuevo.' }
    }
  }

  // 1. Create Supabase auth user
  const verificarCorreo = isEmailVerificationEnabled()
  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password,
      // Con verificación activada la cuenta nace SIN confirmar; el usuario la
      // activa desde el enlace del correo. Sin el flag, se confirma al vuelo.
      email_confirm: !verificarCorreo,
      user_metadata: { name: nombre },
    })

  if (createError || !created.user) {
    if (createError?.message?.toLowerCase().includes('already')) {
      return { error: 'Ya existe una cuenta con este correo.' }
    }
    return { error: createError?.message ?? 'No se pudo crear la cuenta.' }
  }

  const supabaseId = created.user.id

  // Garantiza la fila de identity (email) para que el login funcione.
  await ensureEmailIdentity(supabaseId, email)

  try {
    const result = await prisma.$transaction(async (tx) => {
      const now = new Date()
      const dbUser = await tx.user.create({
        data: {
          supabaseId,
          email,
          name: nombre,
          role: 'CLIENTE',
          companyId: company.id,
          termsAcceptedAt: now,
          termsVersion: TERMS_VERSION,
          marketingConsent,
          marketingConsentAt: marketingConsent ? now : null,
        },
      })

      const cliente = await tx.cliente.create({
        data: {
          companyId: company.id,
          supabaseId,
          nombre,
          email,
          telefono: telefono || null,
        },
      })

      // FASE 3/5.2: seguir la empresa al registrarse (salvo que lo desmarque).
      if (seguirEmpresa) {
        await tx.companyFollow.create({
          data: { userId: dbUser.id, companyId: company.id },
        })
      }

      // QR se genera solo al activar la membresía, no en el registro

      // Optional vehicle
      if (marca && modelo && anioRaw && color) {
        const anio = Number(anioRaw)
        if (!Number.isNaN(anio)) {
          await tx.vehiculo.create({
            data: {
              clienteId: cliente.id,
              marca,
              modelo,
              anio,
              color,
              placa: placa || null,
            },
          })
        }
      }

      return { dbUser, cliente }
    })

    // 2. Store app_metadata for middleware/role resolution
    await admin.auth.admin.updateUserById(supabaseId, {
      app_metadata: {
        role: 'CLIENTE',
        dbUserId: result.dbUser.id,
        clienteId: result.cliente.id,
        companyId: company.id,
      },
    })

    await vincularReferido(refCode, company.id, result.cliente.id, ipAddress)

    if (verificarCorreo) {
      await sendVerificationEmail(admin, email, nombre)
      return { pendingVerification: true }
    }
    return { success: true }
  } catch (e) {
    // Roll back the Supabase user if DB write failed
    await admin.auth.admin.deleteUser(supabaseId).catch(e => console.error('[registro-cleanup]', e))
    console.error(e)
    return { error: 'No se pudo completar el registro. Intenta de nuevo.' }
  }
  } catch (e) {
    console.error('[registro] unexpected error:', e)
    return { error: 'Ocurrió un error inesperado. Intenta de nuevo.' }
  }
}

/**
 * Registro general en MembeGo, SIN empresa: crea la cuenta (Supabase + User
 * CLIENTE) sin afiliarse a ninguna empresa, sin seguirla y sin membresía.
 * El usuario luego explora empresas dentro de la app y se afilia cuando
 * quiera (la afiliación reutiliza el flujo existente de /registro/[slug]).
 */
export async function registrarCuentaGeneral(
  _prev: RegistroState,
  formData: FormData
): Promise<RegistroState> {
  try {
    const { ipAddress } = await getRequestMeta()
    if (!registerLimiter(ipAddress ?? 'unknown')) {
      return { error: 'Demasiados registros desde esta conexión. Intenta de nuevo en unos minutos.' }
    }

    const nombre = String(formData.get('nombre') ?? '').trim()
    const email = String(formData.get('email') ?? '').trim().toLowerCase()
    const password = String(formData.get('password') ?? '')
    const telefono = String(formData.get('telefono') ?? '').trim()
    const aceptaTerminos = formData.get('terminos') === 'on'
    const marketingConsent = formData.getAll('marketingConsent').at(-1) === 'on'

    if (!nombre || !email || !password) {
      return { error: 'Completa todos los campos obligatorios.' }
    }
    if (password.length < 6) {
      return { error: 'La contraseña debe tener al menos 6 caracteres.' }
    }
    if (!aceptaTerminos) {
      return { error: 'Debes aceptar los términos y la política de privacidad.' }
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return { error: 'Ya existe una cuenta con este correo. Inicia sesión.' }
    }

    const admin = createAdminClient()
    const verificarCorreo = isEmailVerificationEnabled()
    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: !verificarCorreo,
        user_metadata: { name: nombre },
      })

    if (createError || !created.user) {
      if (createError?.message?.toLowerCase().includes('already')) {
        return { error: 'Ya existe una cuenta con este correo.' }
      }
      return { error: createError?.message ?? 'No se pudo crear la cuenta.' }
    }

    const supabaseId = created.user.id
    await ensureEmailIdentity(supabaseId, email)

    try {
      const now = new Date()
      const dbUser = await prisma.user.create({
        data: {
          supabaseId,
          email,
          name: nombre,
          role: 'CLIENTE',
          companyId: null,
          termsAcceptedAt: now,
          termsVersion: TERMS_VERSION,
          marketingConsent,
          marketingConsentAt: marketingConsent ? now : null,
        },
      })

      // Nota: el teléfono se guarda cuando el usuario se afilie a una empresa
      // (la ficha Cliente es por empresa); aquí solo existe la cuenta global.
      void telefono

      await admin.auth.admin.updateUserById(supabaseId, {
        app_metadata: {
          role: 'CLIENTE',
          dbUserId: dbUser.id,
          clienteId: null,
          companyId: null,
        },
      })

      if (verificarCorreo) {
        await sendVerificationEmail(admin, email, nombre)
        return { pendingVerification: true }
      }
      return { success: true }
    } catch (e) {
      await admin.auth.admin.deleteUser(supabaseId).catch((err) =>
        console.error('[registro-general-cleanup]', err)
      )
      console.error('[registro-general]', e)
      return { error: 'No se pudo completar el registro. Intenta de nuevo.' }
    }
  } catch (e) {
    console.error('[registro-general] unexpected error:', e)
    return { error: 'Ocurrió un error inesperado. Intenta de nuevo.' }
  }
}
