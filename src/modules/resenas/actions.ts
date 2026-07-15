'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/auth/guards'

export interface ResenaState {
  success?: boolean
  error?: string
}

/**
 * Guarda (crea o actualiza) la reseña del cliente sobre una empresa.
 * Solo clientes de esa empresa pueden opinar (CompanyRating referencia su
 * ficha de Cliente); una reseña por cliente (upsert). Al guardar se
 * recalcula el promedio real de la empresa (Company.averageRating).
 */
export async function guardarResena(
  _prev: ResenaState,
  formData: FormData
): Promise<ResenaState> {
  try {
    const user = await requireRole('CLIENTE')

    const companyId = String(formData.get('companyId') ?? '').trim()
    const rating = Number(formData.get('rating'))
    const comment = String(formData.get('comment') ?? '').trim().slice(0, 600)

    if (!companyId) return { error: 'Empresa inválida.' }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return { error: 'Elige una calificación de 1 a 5 estrellas.' }
    }

    const cliente = await prisma.cliente.findUnique({
      where: {
        supabaseId_companyId: { supabaseId: user.supabaseId, companyId },
      },
      select: { id: true },
    })
    if (!cliente) {
      return { error: 'Únete a esta empresa para dejar tu reseña.' }
    }

    await prisma.companyRating.upsert({
      where: { companyId_clienteId: { companyId, clienteId: cliente.id } },
      create: { companyId, clienteId: cliente.id, rating, comment: comment || null },
      update: { rating, comment: comment || null },
    })

    // Promedio real (solo reseñas visibles) → dato que muestran las tarjetas.
    const agg = await prisma.companyRating.aggregate({
      where: { companyId, visible: true },
      _avg: { rating: true },
    })
    await prisma.company.update({
      where: { id: companyId },
      data: { averageRating: agg._avg.rating },
    })

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { slug: true },
    })
    if (company) {
      revalidatePath(`/cliente/empresas/${company.slug}`)
      revalidatePath(`/empresas/${company.slug}`)
    }
    return { success: true }
  } catch (e) {
    console.error('[guardarResena]', e)
    return { error: 'No se pudo guardar tu reseña. Intenta de nuevo.' }
  }
}
