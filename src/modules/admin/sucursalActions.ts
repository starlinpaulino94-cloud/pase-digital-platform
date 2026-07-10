'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireAdminUser } from '@/lib/auth/guards'
import { resolveCompanyId } from '@/lib/auth/company-context'

export interface SucursalState {
  error?: string
  success?: boolean
}

export async function crearSucursal(
  _prev: SucursalState,
  formData: FormData
): Promise<SucursalState> {
  const user = await requireAdminUser()
  if (!user) return { error: 'No autorizado.' }

  const companyId =
    // Superadmin: companyId del form o, si no viene, la empresa ACTIVA del
    // selector del panel. Staff: siempre la de su sesión.
    (await resolveCompanyId(user, formData)) ?? ''

  if (!companyId) return { error: 'Empresa requerida.' }

  const nombre = String(formData.get('nombre') ?? '').trim()
  const direccion = String(formData.get('direccion') ?? '').trim() || null
  const telefono = String(formData.get('telefono') ?? '').trim() || null

  if (!nombre) return { error: 'El nombre es obligatorio.' }

  try {
    await prisma.sucursal.create({ data: { companyId, nombre, direccion, telefono } })
    revalidatePath('/admin/sucursales')
    return { success: true }
  } catch (e) {
    console.error('[sucursal]', e)
    return { error: 'Ocurrió un error. Intenta de nuevo.' }
  }
}

export async function actualizarSucursal(
  _prev: SucursalState,
  formData: FormData
): Promise<SucursalState> {
  const user = await requireAdminUser()
  if (!user) return { error: 'No autorizado.' }

  const id = String(formData.get('id') ?? '').trim()
  const nombre = String(formData.get('nombre') ?? '').trim()
  const direccion = String(formData.get('direccion') ?? '').trim() || null
  const telefono = String(formData.get('telefono') ?? '').trim() || null
  const activa = formData.get('activa') !== 'false'

  if (!id || !nombre) return { error: 'ID y nombre son obligatorios.' }

  try {
    const suc = await prisma.sucursal.findUnique({ where: { id } })
    if (!suc) return { error: 'Sucursal no encontrada.' }
    if (user.metadata.role !== 'SUPERADMIN' && suc.companyId !== user.metadata.companyId) {
      return { error: 'No autorizado.' }
    }

    await prisma.sucursal.update({ where: { id }, data: { nombre, direccion, telefono, activa } })

    revalidatePath('/admin/sucursales')
    return { success: true }
  } catch (e) {
    console.error('[sucursal]', e)
    return { error: 'Ocurrió un error. Intenta de nuevo.' }
  }
}

export async function eliminarSucursal(
  _prev: SucursalState,
  formData: FormData
): Promise<SucursalState> {
  const user = await requireAdminUser()
  if (!user) return { error: 'No autorizado.' }

  const id = String(formData.get('id') ?? '').trim()
  if (!id) return { error: 'ID requerido.' }

  try {
    const suc = await prisma.sucursal.findUnique({ where: { id } })
    if (!suc) return { error: 'Sucursal no encontrada.' }
    if (user.metadata.role !== 'SUPERADMIN' && suc.companyId !== user.metadata.companyId) {
      return { error: 'No autorizado.' }
    }

    const visitas = await prisma.visit.count({ where: { sucursalId: id } })
    if (visitas > 0) {
      await prisma.sucursal.update({ where: { id }, data: { activa: false } })
    } else {
      await prisma.sucursal.delete({ where: { id } })
    }

    revalidatePath('/admin/sucursales')
    return { success: true }
  } catch (e) {
    console.error('[sucursal]', e)
    return { error: 'Ocurrió un error. Intenta de nuevo.' }
  }
}
