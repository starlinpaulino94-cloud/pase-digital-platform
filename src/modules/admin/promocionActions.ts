'use server'

import { revalidatePath } from 'next/cache'
import { ADMIN_ROLES } from '@/types'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'
import { notificarClientesEmpresa } from '@/modules/notificaciones/actions'

async function requireAdmin() {
  const user = await getUser()
  if (!user || !ADMIN_ROLES.includes(user.metadata.role)) {
    return null
  }
  return user
}

export interface PromocionState {
  error?: string
  success?: boolean
}

export async function crearPromocion(
  _prev: PromocionState,
  formData: FormData
): Promise<PromocionState> {
  const user = await requireAdmin()
  if (!user) return { error: 'No autorizado.' }

  const companyId =
    user.metadata.role === 'SUPERADMIN'
      ? String(formData.get('companyId') ?? '').trim()
      : (user.metadata.companyId ?? '')
  if (!companyId) return { error: 'Empresa requerida.' }

  const titulo = String(formData.get('titulo') ?? '').trim()
  const descripcion = String(formData.get('descripcion') ?? '').trim()
  const imagenUrl = String(formData.get('imagenUrl') ?? '').trim() || null
  const vigenciaHastaRaw = String(formData.get('vigenciaHasta') ?? '').trim()
  const vigenciaHasta = vigenciaHastaRaw ? new Date(vigenciaHastaRaw) : null

  if (!titulo || !descripcion) {
    return { error: 'Título y descripción son obligatorios.' }
  }

  try {
    await prisma.promocion.create({
      data: { companyId, titulo, descripcion, imagenUrl, vigenciaHasta },
    })

    await notificarClientesEmpresa(companyId, {
      tipo: 'PROMOCION_NUEVA',
      titulo: '¡Nueva promoción disponible!',
      mensaje: titulo,
      href: '/cliente/promociones',
    })

    revalidatePath('/admin/promociones')
    revalidatePath('/superadmin/promociones')
    revalidatePath('/cliente/promociones')

    return { success: true }
  } catch (e) {
    console.error('[promocion]', e)
    return { error: 'Ocurrió un error. Intenta de nuevo.' }
  }
}

export async function actualizarPromocion(
  _prev: PromocionState,
  formData: FormData
): Promise<PromocionState> {
  const user = await requireAdmin()
  if (!user) return { error: 'No autorizado.' }

  const id = String(formData.get('id') ?? '').trim()
  const titulo = String(formData.get('titulo') ?? '').trim()
  const descripcion = String(formData.get('descripcion') ?? '').trim()
  const imagenUrl = String(formData.get('imagenUrl') ?? '').trim() || null
  const vigenciaHastaRaw = String(formData.get('vigenciaHasta') ?? '').trim()
  const vigenciaHasta = vigenciaHastaRaw ? new Date(vigenciaHastaRaw) : null
  const activo = formData.get('activo') !== 'false'

  if (!id || !titulo || !descripcion) {
    return { error: 'Título y descripción son obligatorios.' }
  }

  try {
    const promo = await prisma.promocion.findUnique({ where: { id } })
    if (!promo) return { error: 'Promoción no encontrada.' }
    if (
      user.metadata.role !== 'SUPERADMIN' &&
      promo.companyId !== user.metadata.companyId
    ) {
      return { error: 'No autorizado.' }
    }

    await prisma.promocion.update({
      where: { id },
      data: { titulo, descripcion, imagenUrl, vigenciaHasta, activo },
    })

    revalidatePath('/admin/promociones')
    revalidatePath('/superadmin/promociones')
    revalidatePath('/cliente/promociones')
    return { success: true }
  } catch (e) {
    console.error('[promocion]', e)
    return { error: 'Ocurrió un error. Intenta de nuevo.' }
  }
}

export async function eliminarPromocion(
  _prev: PromocionState,
  formData: FormData
): Promise<PromocionState> {
  const user = await requireAdmin()
  if (!user) return { error: 'No autorizado.' }

  const id = String(formData.get('id') ?? '').trim()
  if (!id) return { error: 'ID requerido.' }

  try {
    const promo = await prisma.promocion.findUnique({ where: { id } })
    if (!promo) return { error: 'Promoción no encontrada.' }
    if (
      user.metadata.role !== 'SUPERADMIN' &&
      promo.companyId !== user.metadata.companyId
    ) {
      return { error: 'No autorizado.' }
    }

    await prisma.promocion.delete({ where: { id } })

    revalidatePath('/admin/promociones')
    revalidatePath('/superadmin/promociones')
    revalidatePath('/cliente/promociones')
    return { success: true }
  } catch (e) {
    console.error('[promocion]', e)
    return { error: 'Ocurrió un error. Intenta de nuevo.' }
  }
}
