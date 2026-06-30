'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'

async function requireAdmin() {
  const user = await getUser()
  if (!user || !['ADMIN_EMPRESA', 'SUPERADMIN'].includes(user.metadata.role)) {
    return null
  }
  return user
}

export interface MetodoPagoState {
  error?: string
  success?: boolean
}

export async function crearMetodoPago(
  _prev: MetodoPagoState,
  formData: FormData
): Promise<MetodoPagoState> {
  const user = await requireAdmin()
  if (!user) return { error: 'No autorizado.' }

  const companyId =
    user.metadata.role === 'SUPERADMIN'
      ? String(formData.get('companyId') ?? '').trim()
      : (user.metadata.companyId ?? '')

  if (!companyId) return { error: 'Empresa requerida.' }

  const tipo = String(formData.get('tipo') ?? '').trim()
  const nombre = String(formData.get('nombre') ?? '').trim()
  const titular = String(formData.get('titular') ?? '').trim() || null
  const numeroCuenta = String(formData.get('numeroCuenta') ?? '').trim() || null
  const tipoCuenta = String(formData.get('tipoCuenta') ?? '').trim() || null
  const instrucciones = String(formData.get('instrucciones') ?? '').trim() || null

  if (!tipo || !nombre) return { error: 'Tipo y nombre son obligatorios.' }
  if (tipo !== 'TRANSFERENCIA' && tipo !== 'PRESENCIAL') {
    return { error: 'Tipo inválido.' }
  }

  await prisma.metodoPago.create({
    data: {
      companyId,
      tipo: tipo as 'TRANSFERENCIA' | 'PRESENCIAL',
      nombre,
      titular,
      numeroCuenta,
      tipoCuenta,
      instrucciones,
    },
  })

  revalidatePath('/admin/metodos-pago')
  revalidatePath('/superadmin/metodos-pago')
  return { success: true }
}

export async function actualizarMetodoPago(
  _prev: MetodoPagoState,
  formData: FormData
): Promise<MetodoPagoState> {
  const user = await requireAdmin()
  if (!user) return { error: 'No autorizado.' }

  const id = String(formData.get('id') ?? '').trim()
  const nombre = String(formData.get('nombre') ?? '').trim()
  const titular = String(formData.get('titular') ?? '').trim() || null
  const numeroCuenta = String(formData.get('numeroCuenta') ?? '').trim() || null
  const tipoCuenta = String(formData.get('tipoCuenta') ?? '').trim() || null
  const instrucciones = String(formData.get('instrucciones') ?? '').trim() || null
  const activo = formData.get('activo') !== 'false'

  if (!id || !nombre) return { error: 'ID y nombre son obligatorios.' }

  const method = await prisma.metodoPago.findUnique({ where: { id } })
  if (!method) return { error: 'Método no encontrado.' }
  if (
    user.metadata.role !== 'SUPERADMIN' &&
    method.companyId !== user.metadata.companyId
  ) {
    return { error: 'No autorizado.' }
  }

  await prisma.metodoPago.update({
    where: { id },
    data: { nombre, titular, numeroCuenta, tipoCuenta, instrucciones, activo },
  })

  revalidatePath('/admin/metodos-pago')
  revalidatePath('/superadmin/metodos-pago')
  return { success: true }
}

export async function eliminarMetodoPago(
  _prev: MetodoPagoState,
  formData: FormData
): Promise<MetodoPagoState> {
  const user = await requireAdmin()
  if (!user) return { error: 'No autorizado.' }

  const id = String(formData.get('id') ?? '').trim()
  if (!id) return { error: 'ID requerido.' }

  const method = await prisma.metodoPago.findUnique({ where: { id } })
  if (!method) return { error: 'Método no encontrado.' }
  if (
    user.metadata.role !== 'SUPERADMIN' &&
    method.companyId !== user.metadata.companyId
  ) {
    return { error: 'No autorizado.' }
  }

  const count = await prisma.membership.count({ where: { metodoPagoId: id } })
  if (count > 0) {
    // Soft-delete: just deactivate
    await prisma.metodoPago.update({ where: { id }, data: { activo: false } })
  } else {
    await prisma.metodoPago.delete({ where: { id } })
  }

  revalidatePath('/admin/metodos-pago')
  revalidatePath('/superadmin/metodos-pago')
  return { success: true }
}
