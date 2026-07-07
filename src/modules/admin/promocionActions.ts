'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireAdminUser } from '@/lib/auth/guards'
import { notificarSeguidoresEmpresa } from '@/modules/notificaciones/service'
import { esTipoValido, esVisibilidadValida } from '@/lib/promociones'

export interface PromocionState {
  error?: string
  success?: boolean
}

/** Campos de Promociones 2.0 compartidos entre crear y actualizar. */
function parsePromocion(formData: FormData): { error: string } | {
  data: {
    titulo: string
    descripcion: string
    imagenUrl: string | null
    tipo: string
    descuento: number | null
    codigo: string | null
    visibilidad: string
    vigenciaDesde: Date
    vigenciaHasta: Date | null
    maxCanjes: number | null
    prioridad: number
  }
} {
  const titulo = String(formData.get('titulo') ?? '').trim()
  const descripcion = String(formData.get('descripcion') ?? '').trim()
  const imagenUrl = String(formData.get('imagenUrl') ?? '').trim() || null
  const tipo = String(formData.get('tipo') ?? 'general').trim()
  const codigo = String(formData.get('codigo') ?? '').trim() || null
  const visibilidad = String(formData.get('visibilidad') ?? 'publica').trim()

  const descuentoRaw = String(formData.get('descuento') ?? '').trim()
  const descuento = descuentoRaw ? Number(descuentoRaw) : null
  const maxCanjesRaw = String(formData.get('maxCanjes') ?? '').trim()
  const maxCanjes = maxCanjesRaw ? Number(maxCanjesRaw) : null
  const prioridadRaw = String(formData.get('prioridad') ?? '').trim()
  const prioridad = prioridadRaw ? Number(prioridadRaw) : 0

  const desdeRaw = String(formData.get('vigenciaDesde') ?? '').trim()
  const hastaRaw = String(formData.get('vigenciaHasta') ?? '').trim()
  const vigenciaDesde = desdeRaw ? new Date(desdeRaw) : new Date()
  const vigenciaHasta = hastaRaw ? new Date(hastaRaw) : null

  if (!titulo || !descripcion) {
    return { error: 'Título y descripción son obligatorios.' }
  }
  if (!esTipoValido(tipo)) return { error: 'Tipo de promoción inválido.' }
  if (!esVisibilidadValida(visibilidad)) return { error: 'Visibilidad inválida.' }
  if (descuento != null && (Number.isNaN(descuento) || descuento < 0)) {
    return { error: 'El descuento no es válido.' }
  }
  if (maxCanjes != null && (Number.isNaN(maxCanjes) || maxCanjes < 1)) {
    return { error: 'El límite de canjes debe ser mayor a 0.' }
  }
  if (Number.isNaN(prioridad)) return { error: 'La prioridad no es válida.' }
  if (vigenciaHasta && vigenciaHasta <= vigenciaDesde) {
    return { error: 'La fecha de fin debe ser posterior a la de inicio.' }
  }

  return {
    data: {
      titulo,
      descripcion,
      imagenUrl,
      tipo,
      descuento,
      codigo,
      visibilidad,
      vigenciaDesde,
      vigenciaHasta,
      maxCanjes,
      prioridad,
    },
  }
}

function revalidatePromos() {
  revalidatePath('/admin/promociones')
  revalidatePath('/superadmin/operaciones')
  revalidatePath('/cliente/promociones')
  revalidatePath('/promociones')
  revalidatePath('/')
}

/** Devuelve la promo solo si pertenece a la empresa del usuario (o superadmin). */
async function promoDeMiEmpresa(id: string, user: NonNullable<Awaited<ReturnType<typeof requireAdminUser>>>) {
  const promo = await prisma.promocion.findUnique({
    where: { id },
    select: { id: true, companyId: true, titulo: true, activo: true, archivada: true },
  })
  if (!promo) return null
  if (
    user.metadata.role !== 'SUPERADMIN' &&
    promo.companyId !== user.metadata.companyId
  ) {
    return null
  }
  return promo
}

export async function crearPromocion(
  _prev: PromocionState,
  formData: FormData
): Promise<PromocionState> {
  const user = await requireAdminUser()
  if (!user) return { error: 'No autorizado.' }

  const companyId =
    user.metadata.role === 'SUPERADMIN'
      ? String(formData.get('companyId') ?? '').trim()
      : (user.metadata.companyId ?? '')
  if (!companyId) return { error: 'Empresa requerida.' }

  const parsed = parsePromocion(formData)
  if ('error' in parsed) return { error: parsed.error }

  try {
    await prisma.promocion.create({ data: { companyId, ...parsed.data } })

    // Solo los seguidores de la empresa reciben la notificación.
    await notificarSeguidoresEmpresa(companyId, {
      tipo: 'PROMOCION_NUEVA',
      titulo: '¡Nueva promoción disponible!',
      mensaje: parsed.data.titulo,
      href: '/cliente/promociones',
    })

    revalidatePromos()
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
  const user = await requireAdminUser()
  if (!user) return { error: 'No autorizado.' }

  const id = String(formData.get('id') ?? '').trim()
  if (!id) return { error: 'Promoción no especificada.' }

  const parsed = parsePromocion(formData)
  if ('error' in parsed) return { error: parsed.error }

  const activo = formData.get('activo') !== 'false'

  try {
    const promo = await promoDeMiEmpresa(id, user)
    if (!promo) return { error: 'Promoción no encontrada.' }

    await prisma.promocion.update({
      where: { id },
      data: { ...parsed.data, activo },
    })

    revalidatePromos()
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
  const user = await requireAdminUser()
  if (!user) return { error: 'No autorizado.' }

  const id = String(formData.get('id') ?? '').trim()
  if (!id) return { error: 'ID requerido.' }

  try {
    const promo = await promoDeMiEmpresa(id, user)
    if (!promo) return { error: 'Promoción no encontrada.' }

    await prisma.promocion.delete({ where: { id } })

    revalidatePromos()
    return { success: true }
  } catch (e) {
    console.error('[promocion]', e)
    return { error: 'Ocurrió un error. Intenta de nuevo.' }
  }
}

/** Pausa (activo=false) o reanuda (activo=true) una promoción. */
export async function alternarPausaPromocion(
  _prev: PromocionState,
  formData: FormData
): Promise<PromocionState> {
  const user = await requireAdminUser()
  if (!user) return { error: 'No autorizado.' }

  const id = String(formData.get('id') ?? '').trim()
  if (!id) return { error: 'ID requerido.' }

  try {
    const promo = await promoDeMiEmpresa(id, user)
    if (!promo) return { error: 'Promoción no encontrada.' }

    await prisma.promocion.update({
      where: { id },
      data: { activo: !promo.activo },
    })

    revalidatePromos()
    return { success: true }
  } catch (e) {
    console.error('[promocion] pausar', e)
    return { error: 'Ocurrió un error. Intenta de nuevo.' }
  }
}

/** Duplica una promoción como borrador pausado "(Copia)". */
export async function duplicarPromocion(
  _prev: PromocionState,
  formData: FormData
): Promise<PromocionState> {
  const user = await requireAdminUser()
  if (!user) return { error: 'No autorizado.' }

  const id = String(formData.get('id') ?? '').trim()
  if (!id) return { error: 'ID requerido.' }

  try {
    const promo = await promoDeMiEmpresa(id, user)
    if (!promo) return { error: 'Promoción no encontrada.' }

    const original = await prisma.promocion.findUniqueOrThrow({ where: { id } })
    await prisma.promocion.create({
      data: {
        companyId: original.companyId,
        titulo: `${original.titulo} (Copia)`,
        descripcion: original.descripcion,
        imagenUrl: original.imagenUrl,
        tipo: original.tipo,
        descuento: original.descuento,
        codigo: original.codigo,
        visibilidad: original.visibilidad,
        vigenciaDesde: original.vigenciaDesde,
        vigenciaHasta: original.vigenciaHasta,
        maxCanjes: original.maxCanjes,
        prioridad: original.prioridad,
        tags: original.tags,
        // La copia nace pausada para editarla antes de publicar.
        activo: false,
      },
    })

    revalidatePromos()
    return { success: true }
  } catch (e) {
    console.error('[promocion] duplicar', e)
    return { error: 'Ocurrió un error. Intenta de nuevo.' }
  }
}

/** Archiva (o restaura) una promoción: sale de todos los listados. */
export async function alternarArchivoPromocion(
  _prev: PromocionState,
  formData: FormData
): Promise<PromocionState> {
  const user = await requireAdminUser()
  if (!user) return { error: 'No autorizado.' }

  const id = String(formData.get('id') ?? '').trim()
  if (!id) return { error: 'ID requerido.' }

  try {
    const promo = await promoDeMiEmpresa(id, user)
    if (!promo) return { error: 'Promoción no encontrada.' }

    await prisma.promocion.update({
      where: { id },
      data: { archivada: !promo.archivada, ...(promo.archivada ? {} : { activo: false }) },
    })

    revalidatePromos()
    return { success: true }
  } catch (e) {
    console.error('[promocion] archivar', e)
    return { error: 'Ocurrió un error. Intenta de nuevo.' }
  }
}
