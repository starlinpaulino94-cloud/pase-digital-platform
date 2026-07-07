'use server'

import { prisma } from '@/lib/prisma'
import { createAdminClient } from '@/lib/supabase/admin'
import { ensureEmailIdentity } from '@/lib/supabase/identity'
import { cookies } from 'next/headers'
import { registerLimiter } from '@/lib/rate-limit'
import { getRequestMeta } from '@/lib/server-utils'
import { logReferralEvent, hashIp, REF_COOKIE } from '@/lib/referidos'

export interface RegistroState {
  error?: string
  success?: boolean
}

/**
 * Anti-fraude: ¿esta huella de IP ya generó registros para este referente en
 * los últimos 7 días? Si sí, el evento se marca sospechoso y no suma puntos
 * (el vínculo se crea igual para que el admin pueda auditarlo).
 */
async function esRegistroSospechoso(
  referenteClienteId: string,
  ipHashValor: string | null,
  tipo: 'REGISTRO' | 'REGISTRO_GLOBAL'
): Promise<boolean> {
  if (!ipHashValor) return false
  try {
    const hace7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const repetidos = await prisma.referralEvent.count({
      where: {
        clienteId: referenteClienteId,
        tipo,
        createdAt: { gte: hace7d },
        meta: { path: ['ipHash'], equals: ipHashValor },
      },
    })
    return repetidos >= 2
  } catch {
    return false
  }
}

/**
 * Atribuye el registro a un referente. El código puede venir del formulario
 * (?ref= de la empresa) o de la cookie del Centro global MembeGo (/r/CODE).
 * - Misma empresa: crea el Referido + evento REGISTRO.
 * - Otra empresa de la plataforma: evento REGISTRO_GLOBAL (puntos MembeGo).
 * Nunca lanza: la atribución jamás rompe el registro.
 */
async function vincularReferido(
  refCode: string,
  companyId: string,
  referidoClienteId: string,
  ipAddress: string | null
) {
  try {
    let code = refCode
    if (!code) {
      const cookieStore = await cookies()
      code = cookieStore.get(REF_COOKIE)?.value ?? ''
    }
    if (!code) return

    const referente = await prisma.cliente.findUnique({
      where: { codigoReferido: code },
    })
    if (!referente) return
    // Anti-abuso: nadie puede referirse a sí mismo.
    if (referente.id === referidoClienteId) return

    const huella = hashIp(ipAddress)

    if (referente.companyId === companyId) {
      // Programa de la empresa.
      const sospechoso = await esRegistroSospechoso(referente.id, huella, 'REGISTRO')
      await prisma.referido.create({
        data: {
          companyId,
          referenteClienteId: referente.id,
          referidoClienteId,
        },
      })
      await logReferralEvent({
        clienteId: referente.id,
        companyId,
        tipo: 'REGISTRO',
        meta: { referidoClienteId, ipHash: huella, ...(sospechoso ? { sospechoso: true } : {}) },
        ...(sospechoso ? { puntos: 0 } : {}),
      })
      return
    }

    // Centro global MembeGo: el referido se unió a OTRA empresa.
    const sospechoso = await esRegistroSospechoso(referente.id, huella, 'REGISTRO_GLOBAL')
    await logReferralEvent({
      clienteId: referente.id,
      companyId: referente.companyId,
      tipo: 'REGISTRO_GLOBAL',
      meta: {
        global: true,
        targetCompanyId: companyId,
        referidoClienteId,
        ipHash: huella,
        ...(sospechoso ? { sospechoso: true } : {}),
      },
      ...(sospechoso ? { puntos: 0 } : {}),
    })
  } catch (e) {
    console.error('[registro] vincularReferido error:', e)
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

      await admin.auth.admin.updateUserById(existingUser.supabaseId, {
        app_metadata: {
          role: 'CLIENTE',
          dbUserId: existingUser.id,
          clienteId: cliente.id,
          companyId: company.id,
        },
      })

      await vincularReferido(refCode, company.id, cliente.id, ipAddress)

      return { success: true }
    } catch (e) {
      console.error('[registro] afiliación a nueva empresa error:', e)
      return { error: 'No se pudo completar el registro. Intenta de nuevo.' }
    }
  }

  // 1. Create Supabase auth user
  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
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
      const dbUser = await tx.user.create({
        data: {
          supabaseId,
          email,
          name: nombre,
          role: 'CLIENTE',
          companyId: company.id,
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
