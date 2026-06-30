import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'
import { SEED_COMPANIES } from '@/lib/data/companies'

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      'Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.'
    )
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

interface SeedUser {
  email: string
  password: string
  nombre: string
  role: 'SUPERADMIN' | 'ADMIN_EMPRESA' | 'EMPLEADO' | 'CLIENTE'
  companySlug: string | null
  vehiculo?: {
    marca: string
    modelo: string
    anio: number
    color: string
    placa: string
  }
}

const SEED_USERS: SeedUser[] = [
  {
    email: 'superadmin@pasedigital.com',
    password: 'admin123',
    nombre: 'Super Admin',
    role: 'SUPERADMIN',
    companySlug: null,
  },
  {
    email: 'admin.cartown@pasedigital.com',
    password: 'admin123',
    nombre: 'Carlos Lavado',
    role: 'ADMIN_EMPRESA',
    companySlug: 'cartown',
  },
  {
    email: 'admin.tonis@pasedigital.com',
    password: 'admin123',
    nombre: 'María Sabor',
    role: 'ADMIN_EMPRESA',
    companySlug: 'tonis',
  },
  {
    email: 'empleado.cartown@pasedigital.com',
    password: 'admin123',
    nombre: 'Juan Esponja',
    role: 'EMPLEADO',
    companySlug: 'cartown',
  },
  {
    email: 'cliente@pasedigital.com',
    password: 'cliente123',
    nombre: 'Pedro Cliente',
    role: 'CLIENTE',
    companySlug: 'cartown',
    vehiculo: {
      marca: 'Toyota',
      modelo: 'Corolla',
      anio: 2021,
      color: 'Blanco',
      placa: 'A123456',
    },
  },
]

async function upsertAuthUser(
  supabaseAdmin: ReturnType<typeof createAdminClient>,
  u: { email: string; password: string; nombre: string }
) {
  const { data: existing } = await supabaseAdmin.auth.admin.listUsers()
  const found = existing?.users?.find((x) => x.email === u.email)

  let userId: string
  if (found) {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      found.id,
      {
        password: u.password,
        email_confirm: true,
        user_metadata: { name: u.nombre },
      }
    )
    if (error) throw new Error(`updateUserById ${u.email}: ${error.message}`)
    userId = data.user!.id
  } else {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { name: u.nombre },
    })
    if (error) throw new Error(`createUser ${u.email}: ${error.message}`)
    userId = data.user!.id
  }
  return userId
}

export interface SeedResult {
  companies: number
  plans: number
  users: number
  clientes: number
  details: string[]
}

/**
 * Ejecuta el seed idempotente: empresas, planes y usuarios de prueba.
 * Crea los usuarios en Supabase Auth y en la BD, sincronizando app_metadata.
 */
export async function runSeed(): Promise<SeedResult> {
  const supabaseAdmin = createAdminClient()
  const details: string[] = []
  let plansCount = 0
  let usersCount = 0
  let clientesCount = 0

  // 1. Upsert de empresas y planes
  const companiesBySlug: Record<
    string,
    { id: string; name: string; type: string }
  > = {}
  for (const company of SEED_COMPANIES) {
    const c = await prisma.company.upsert({
      where: { slug: company.slug },
      update: {
        name: company.name,
        type: company.type,
        description: company.description,
        isActive: true,
      },
      create: {
        name: company.name,
        slug: company.slug,
        type: company.type,
        description: company.description,
      },
    })
    companiesBySlug[company.slug] = { id: c.id, name: c.name, type: c.type }
    details.push(`Empresa: ${c.name}`)

    // Sucursal principal (una por empresa para demo)
    const sucursalExistente = await prisma.sucursal.findFirst({
      where: { companyId: c.id, nombre: 'Sucursal Principal' },
    })
    if (!sucursalExistente) {
      await prisma.sucursal.create({
        data: {
          companyId: c.id,
          nombre: 'Sucursal Principal',
          direccion: c.type === 'carwash' ? 'Av. 27 de Febrero #100, Santiago' : 'Calle El Sol #45, Santo Domingo',
          telefono: c.type === 'carwash' ? '809-555-0100' : '809-555-0200',
          activa: true,
        },
      })
      details.push(`  Sucursal Principal creada`)
    }

    // Cuenta bancaria (para transferencias)
    const bancoExistente = await prisma.bankAccount.findFirst({
      where: { companyId: c.id, banco: 'Banco Popular' },
    })
    if (!bancoExistente) {
      await prisma.bankAccount.create({
        data: {
          companyId: c.id,
          banco: 'Banco Popular',
          titular: c.name,
          numero: '1234567890',
          tipoCuenta: 'Ahorros',
          instrucciones: 'Realizar la transferencia y enviar comprobante con tu nombre y plan seleccionado.',
          activa: true,
        },
      })
      details.push(`  Cuenta bancaria creada`)
    }

    for (const plan of company.plans) {
      const existing = await prisma.plan.findFirst({
        where: { companyId: c.id, nombre: plan.nombre },
      })
      const data = {
        precio: plan.precio,
        lavadosIncluidos: plan.lavadosIncluidos,
        esIlimitado: plan.esIlimitado,
        descripcion: plan.descripcion,
        beneficios: plan.beneficios,
        activo: true,
      }
      if (existing) {
        await prisma.plan.update({ where: { id: existing.id }, data })
      } else {
        await prisma.plan.create({
          data: { companyId: c.id, nombre: plan.nombre, ...data },
        })
        plansCount++
      }
    }
  }

  // 2. Upsert de usuarios
  for (const u of SEED_USERS) {
    const supabaseId = await upsertAuthUser(supabaseAdmin, u)
    const companyId = u.companySlug
      ? companiesBySlug[u.companySlug]?.id
      : null

    const dbUser = await prisma.user.upsert({
      where: { supabaseId },
      update: {
        email: u.email,
        name: u.nombre,
        role: u.role,
        companyId,
      },
      create: {
        supabaseId,
        email: u.email,
        name: u.nombre,
        role: u.role,
        companyId,
      },
    })
    usersCount++

    // Si es CLIENTE, crear perfil + QR + vehículo
    let clienteId: string | null = null
    if (u.role === 'CLIENTE' && companyId) {
      const cliente = await prisma.cliente.upsert({
        where: { supabaseId_companyId: { supabaseId, companyId } },
        update: { nombre: u.nombre, email: u.email },
        create: {
          companyId,
          supabaseId,
          nombre: u.nombre,
          email: u.email,
        },
      })
      clienteId = cliente.id
      clientesCount++

      const existingQr = await prisma.qrToken.findFirst({
        where: { clienteId: cliente.id },
      })
      if (!existingQr) {
        await prisma.qrToken.create({ data: { clienteId: cliente.id } })
      }

      if (u.vehiculo) {
        const existingVeh = await prisma.vehiculo.findFirst({
          where: { clienteId: cliente.id, placa: u.vehiculo.placa },
        })
        if (!existingVeh) {
          await prisma.vehiculo.create({
            data: { clienteId: cliente.id, ...u.vehiculo },
          })
        }
      }
    }

    await supabaseAdmin.auth.admin.updateUserById(supabaseId, {
      app_metadata: {
        role: u.role,
        dbUserId: dbUser.id,
        clienteId,
        companyId,
      },
    })
    details.push(`Usuario: ${u.email} (${u.role})`)
  }

  return {
    companies: SEED_COMPANIES.length,
    plans: plansCount,
    users: usersCount,
    clientes: clientesCount,
    details,
  }
}
