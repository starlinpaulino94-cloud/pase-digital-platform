'use server'

import { prisma } from '@/lib/prisma'
import { createAdminClient } from '@/lib/supabase/admin'
import { ensureEmailIdentity } from '@/lib/supabase/identity'
import { registerLimiter } from '@/lib/rate-limit'
import { getRequestMeta } from '@/lib/server-utils'
import { vincularReferido } from '@/lib/referidos-attribution'
import { ensureCodigoCorto } from '@/lib/referidos'
import { otorgarRegaloBienvenida } from '@/modules/invitaciones/beneficios'
import { procesarRegistroGrowth } from '@/modules/growth/registro'
import { emitirEventoEstrategia } from '@/modules/estrategias/eventos'
import { TERMS_VERSION } from '@/lib/legal'
import { isEmailVerificationEnabled, sendVerificationEmail } from '@/lib/auth/emailVerification'

export interface RegistroState {
  error?: string
  success?: boolean
  /** Cuenta creada pero pendiente de confirmar el correo (flag O-1). */
  pendingVerification?: boolean
  /**
   * MVP "Invita y Gana": código de invitación propio del cliente recién
   * creado, para que la pantalla de celebración ofrezca compartir SU enlace
   * (/invitar/[code]) sin necesitar sesión iniciada.
   */
  codigoInvitacion?: string
  /**
   * Token del QR del regalo de bienvenida (campañas "Invita y Gana"): la
   * entrega del beneficio ocurre dentro del propio registro, así que la
   * celebración puede mostrar el QR inmediatamente, sin esperar el login.
   * Solo viaja en la respuesta al propio registrante.
   */
  qrBienvenida?: string
}

/** Código de invitación del cliente; nunca bloquea el registro si falla. */
async function codigoInvitacionDe(clienteId: string): Promise<string | undefined> {
  try {
    return await ensureCodigoCorto(clienteId)
  } catch (e) {
    console.error('[registro] codigoInvitacion error:', e)
    return undefined
  }
}

/**
 * QR del regalo de bienvenida que la campaña acaba de entregar a la wallet
 * (vincularReferido → motorProgreso → ProductoCompra + QrToken, todo dentro
 * del mismo registro). El cliente es recién creado: su único QR activo de
 * compra ES el del regalo. Nunca bloquea el registro si falla.
 */
async function qrBienvenidaDe(
  clienteId: string,
  campanaInvitacionId?: string
): Promise<string | undefined> {
  if (!campanaInvitacionId) return undefined
  try {
    const qr = await prisma.qrToken.findFirst({
      where: { clienteId, activo: true, compraId: { not: null } },
      orderBy: { createdAt: 'desc' },
      select: { token: true },
    })
    return qr?.token
  } catch (e) {
    console.error('[registro] qrBienvenida error:', e)
    return undefined
  }
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
  // Campaña "Invita y Gana" (si el registro vino de una campaña de invitación).
  const campanaInvitacionId = String(formData.get('campanaId') ?? '').trim() || undefined
  // Growth Engine 3.0: código del enlace de invitación (landing) que trajo al
  // usuario. Atribuye el registro al enlace y dispara el beneficio/recompensas.
  const glCode = String(formData.get('glCode') ?? '').trim()
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

  // Solo lo esencial es obligatorio; el teléfono se puede completar luego
  // desde el perfil (se sugiere, no se exige).
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
  // select explícito: si la BD de producción aún no tiene una columna recién
  // agregada al modelo Company, un findUnique sin select falla y bloquea TODO
  // el registro. Con select, solo dependemos de columnas que siempre existen.
  let company: { id: string; name: string; slug: string; type: string } | null = null
  try {
    company = await prisma.company.findUnique({
      where: { slug: companySlug },
      select: { id: true, name: true, slug: true, type: true },
    })
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

      await vincularReferido(refCode, company.id, cliente.id, ipAddress, {
        permitirCookie: false,
        campanaInvitacionId,
      })

      // Regalo de bienvenida de la campaña: garantizado para TODO registro
      // que venga de ella (con o sin código de amigo). Idempotente con la
      // entrega del motor de referidos.
      if (campanaInvitacionId) {
        await otorgarRegaloBienvenida(campanaInvitacionId, cliente.id, company.id)
      }

      await emitirEventoEstrategia({
        companyId: company.id,
        type: 'cliente.registrado',
        subjectId: cliente.id,
        payload: { cliente: { nombre: cliente.nombre, compras: 0, visitas: 0 } },
      })

      return {
        success: true,
        codigoInvitacion: await codigoInvitacionDe(cliente.id),
        qrBienvenida: await qrBienvenidaDe(cliente.id, campanaInvitacionId),
      }
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

    await vincularReferido(refCode, company.id, result.cliente.id, ipAddress, {
      campanaInvitacionId,
    })

    // Regalo de bienvenida de la campaña: garantizado para TODO registro que
    // venga de ella (con o sin código de amigo). Idempotente con la entrega
    // del motor de referidos.
    if (campanaInvitacionId) {
      await otorgarRegaloBienvenida(campanaInvitacionId, result.cliente.id, company.id)
    }

    // Growth Engine 3.0: atribución al enlace + beneficio de bienvenida +
    // reglas del evento REGISTRO (no bloquea el registro si falla).
    if (glCode) {
      await procesarRegistroGrowth(glCode, company.id, result.cliente.id).catch((e) =>
        console.error('[registro] growth:', e)
      )
    }

    await emitirEventoEstrategia({
      companyId: company.id,
      type: 'cliente.registrado',
      subjectId: result.cliente.id,
      payload: { cliente: { nombre: result.cliente.nombre, compras: 0, visitas: 0 } },
    })

    const [codigoInvitacion, qrBienvenida] = await Promise.all([
      codigoInvitacionDe(result.cliente.id),
      qrBienvenidaDe(result.cliente.id, campanaInvitacionId),
    ])
    if (verificarCorreo) {
      await sendVerificationEmail(admin, email, nombre)
      return { pendingVerification: true, codigoInvitacion }
    }
    return { success: true, codigoInvitacion, qrBienvenida }
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

    // Solo lo esencial es obligatorio; el teléfono se puede completar luego
    // desde el perfil (se sugiere, no se exige).
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
        user_metadata: { name: nombre, telefono: telefono || null },
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
