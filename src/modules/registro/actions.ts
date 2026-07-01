'use server'

import { prisma } from '@/lib/prisma'
import { createAdminClient } from '@/lib/supabase/admin'
import { ensureEmailIdentity } from '@/lib/supabase/identity'

export interface RegistroState {
  error?: string
  success?: boolean
}

/** Crea el registro Referido si refCode corresponde a un cliente válido de la misma empresa. */
async function vincularReferido(
  refCode: string,
  companyId: string,
  referidoClienteId: string
) {
  if (!refCode) return
  try {
    const referente = await prisma.cliente.findUnique({
      where: { codigoReferido: refCode },
    })
    if (!referente || referente.companyId !== companyId) return
    await prisma.referido.create({
      data: {
        companyId,
        referenteClienteId: referente.id,
        referidoClienteId,
      },
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

  const FALLBACK_COMPANIES: Record<string, { id: string; name: string; slug: string; type: string }> = {
    'cartown-wash': { id: 'company-cartown', name: 'CARTOWN Wash & Detailing', slug: 'cartown-wash', type: 'carwash' },
    'tonis':        { id: 'company-tonis',   name: "Toni's Restaurante",        slug: 'tonis',        type: 'restaurante' },
  }

  let company: { id: string; name: string; slug: string; type: string } | null = null
  try {
    company = await prisma.company.findUnique({ where: { slug: companySlug } })
  } catch (e) {
    console.error('[registro] company lookup error:', e)
  }
  if (!company) company = FALLBACK_COMPANIES[companySlug] ?? null
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

      await vincularReferido(refCode, company.id, cliente.id)

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

    await vincularReferido(refCode, company.id, result.cliente.id)

    return { success: true }
  } catch (e) {
    // Roll back the Supabase user if DB write failed
    await admin.auth.admin.deleteUser(supabaseId).catch(() => {})
    console.error(e)
    return { error: 'No se pudo completar el registro. Intenta de nuevo.' }
  }
  } catch (e) {
    console.error('[registro] unexpected error:', e)
    return { error: 'Ocurrió un error inesperado. Intenta de nuevo.' }
  }
}
