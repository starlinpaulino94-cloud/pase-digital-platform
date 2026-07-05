'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'

async function requireSuperAdmin() {
  const user = await getUser()
  if (!user || user.metadata.role !== 'SUPERADMIN') return null
  return user
}

export interface PlanActionState {
  error?: string
  success?: boolean
}

export async function crearPlan(
  _prev: PlanActionState,
  formData: FormData
): Promise<PlanActionState> {
  if (!(await requireSuperAdmin())) return { error: 'No autorizado.' }

  const companyId = String(formData.get('companyId') ?? '').trim()
  const nombre = String(formData.get('nombre') ?? '').trim()
  const precioRaw = String(formData.get('precio') ?? '').trim()
  const lavadosRaw = String(formData.get('lavados') ?? '').trim()
  const esIlimitado = formData.get('esIlimitado') === 'on'
  const descripcion = String(formData.get('descripcion') ?? '').trim()
  const beneficiosRaw = String(formData.get('beneficios') ?? '').trim()

  if (!companyId || !nombre || !precioRaw) {
    return { error: 'Empresa, nombre y precio son obligatorios.' }
  }

  const precio = Number(precioRaw)
  if (isNaN(precio) || precio < 0) return { error: 'Precio inválido.' }

  const lavados = Number(lavadosRaw) || 0
  const beneficios = beneficiosRaw
    .split('\n')
    .map((b) => b.trim())
    .filter(Boolean)

  try {
    await prisma.plan.create({
      data: {
        companyId,
        nombre,
        precio,
        lavadosIncluidos: esIlimitado ? 0 : lavados,
        esIlimitado,
        descripcion: descripcion || null,
        beneficios,
      },
    })

    revalidatePath('/superadmin/planes')
    revalidatePath('/admin/planes')
    return { success: true }
  } catch (e) {
    console.error('[plan]', e)
    return { error: 'Ocurrió un error. Intenta de nuevo.' }
  }
}

export async function actualizarPlan(
  _prev: PlanActionState,
  formData: FormData
): Promise<PlanActionState> {
  if (!(await requireSuperAdmin())) return { error: 'No autorizado.' }

  const planId = String(formData.get('planId') ?? '').trim()
  const nombre = String(formData.get('nombre') ?? '').trim()
  const precioRaw = String(formData.get('precio') ?? '').trim()
  const lavadosRaw = String(formData.get('lavados') ?? '').trim()
  const esIlimitado = formData.get('esIlimitado') === 'on'
  const descripcion = String(formData.get('descripcion') ?? '').trim()
  const beneficiosRaw = String(formData.get('beneficios') ?? '').trim()
  const activo = formData.get('activo') === 'on'

  if (!planId || !nombre || !precioRaw) {
    return { error: 'Nombre y precio son obligatorios.' }
  }

  const precio = Number(precioRaw)
  if (isNaN(precio) || precio < 0) return { error: 'Precio inválido.' }

  const lavados = Number(lavadosRaw) || 0
  const beneficios = beneficiosRaw
    .split('\n')
    .map((b) => b.trim())
    .filter(Boolean)

  try {
    await prisma.plan.update({
      where: { id: planId },
      data: {
        nombre,
        precio,
        lavadosIncluidos: esIlimitado ? 0 : lavados,
        esIlimitado,
        descripcion: descripcion || null,
        beneficios,
        activo,
      },
    })

    revalidatePath('/superadmin/planes')
    revalidatePath('/admin/planes')
    return { success: true }
  } catch (e) {
    console.error('[plan]', e)
    return { error: 'Ocurrió un error. Intenta de nuevo.' }
  }
}

export async function eliminarPlan(
  _prev: PlanActionState,
  formData: FormData
): Promise<PlanActionState> {
  if (!(await requireSuperAdmin())) return { error: 'No autorizado.' }

  const planId = String(formData.get('planId') ?? '').trim()
  if (!planId) return { error: 'Plan no especificado.' }

  try {
    const count = await prisma.membership.count({ where: { planId } })
    if (count > 0) {
      return { error: `No se puede eliminar: hay ${count} membresía(s) asociadas.` }
    }

    await prisma.plan.delete({ where: { id: planId } })
    revalidatePath('/superadmin/planes')
    revalidatePath('/admin/planes')
    return { success: true }
  } catch (e) {
    console.error('[plan]', e)
    return { error: 'Ocurrió un error. Intenta de nuevo.' }
  }
}

export async function cancelarMembresia(
  _prev: PlanActionState,
  formData: FormData
): Promise<PlanActionState> {
  const user = await requireSuperAdmin()
  if (!user) return { error: 'No autorizado.' }

  const membershipId = String(formData.get('membershipId') ?? '').trim()
  if (!membershipId) return { error: 'Membresía no especificada.' }

  try {
    const m = await prisma.membership.findUnique({
      where: { id: membershipId },
      include: { cliente: true },
    })
    if (!m) return { error: 'Membresía no encontrada.' }

    await prisma.$transaction(async (tx) => {
      await tx.membership.update({
        where: { id: membershipId },
        data: { estado: 'CANCELADA' },
      })
      await tx.auditLog.create({
        data: {
          companyId: m.cliente.companyId,
          userId: user.metadata.dbUserId ?? null,
          accion: 'MEMBRESIA_CANCELADA',
          entidadTipo: 'Membership',
          entidadId: m.id,
          payload: { prevEstado: m.estado },
        },
      })
    })

    revalidatePath('/superadmin/membresias')
    revalidatePath('/admin/clientes')
    return { success: true }
  } catch (e) {
    console.error('[plan]', e)
    return { error: 'Ocurrió un error. Intenta de nuevo.' }
  }
}

export async function desactivarMembresia(
  _prev: PlanActionState,
  formData: FormData
): Promise<PlanActionState> {
  const user = await requireSuperAdmin()
  if (!user) return { error: 'No autorizado.' }

  const membershipId = String(formData.get('membershipId') ?? '').trim()
  if (!membershipId) return { error: 'Membresía no especificada.' }

  try {
    const m = await prisma.membership.findUnique({
      where: { id: membershipId },
      include: { cliente: true },
    })
    if (!m) return { error: 'Membresía no encontrada.' }
    if (m.estado !== 'ACTIVA') return { error: 'Solo se puede desactivar una membresía activa.' }

    await prisma.$transaction(async (tx) => {
      await tx.membership.update({
        where: { id: membershipId },
        data: { estado: 'VENCIDA' },
      })
      await tx.auditLog.create({
        data: {
          companyId: m.cliente.companyId,
          userId: user.metadata.dbUserId ?? null,
          accion: 'MEMBRESIA_CANCELADA',
          entidadTipo: 'Membership',
          entidadId: m.id,
          payload: { prevEstado: 'ACTIVA', nuevaAccion: 'VENCIDA' },
        },
      })
    })

    revalidatePath('/superadmin/membresias')
    revalidatePath('/admin/clientes')
    return { success: true }
  } catch (e) {
    console.error('[plan]', e)
    return { error: 'Ocurrió un error. Intenta de nuevo.' }
  }
}
