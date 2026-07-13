'use server'

import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'
import { createRateLimiter } from '@/lib/rate-limit'
import { otorgarBeneficioCampana } from '@/modules/invitaciones/beneficios'

const shareLimiter = createRateLimiter({
  interval: 60 * 60 * 1000,
  maxRequests: 15,
})

export async function registrarShareCampana(
  campanaId: string,
  canal: string
): Promise<{ ok: boolean }> {
  try {
    const user = await getUser()
    if (!user || user.metadata.role !== 'CLIENTE' || !user.metadata.clienteId) {
      return { ok: false }
    }
    const clienteId = user.metadata.clienteId as string
    if (!shareLimiter(`campshare:${clienteId}`)) {
      return { ok: false }
    }

    const campana = await prisma.campanaInvitacion.findUnique({
      where: { id: campanaId },
      select: { id: true, companyId: true, estado: true },
    })
    if (!campana || campana.estado !== 'ACTIVA') return { ok: false }

    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      select: { id: true, companyId: true },
    })
    if (!cliente || cliente.companyId !== campana.companyId) return { ok: false }

    const reciente = await prisma.invitacionEvento.findFirst({
      where: {
        campanaId,
        clienteId,
        tipo: 'COMPARTIDA',
        createdAt: { gte: new Date(Date.now() - 60 * 1000) },
      },
      select: { id: true },
    })
    if (reciente) return { ok: true }

    await prisma.invitacionEvento.create({
      data: {
        campanaId,
        clienteId,
        companyId: campana.companyId,
        tipo: 'COMPARTIDA',
        canal: String(canal).slice(0, 30),
      },
    })

    return { ok: true }
  } catch (e) {
    console.error('[invitaciones] registrarShareCampana error:', e)
    return { ok: false }
  }
}

export async function registrarEventoCampana(
  campanaId: string,
  tipo: 'ENLACE_ABIERTO' | 'LANDING_VISTA' | 'REGISTRO_INICIADO',
  meta?: Record<string, unknown>
): Promise<void> {
  try {
    const campana = await prisma.campanaInvitacion.findUnique({
      where: { id: campanaId },
      select: { id: true, companyId: true },
    })
    if (!campana) return

    await prisma.invitacionEvento.create({
      data: {
        campanaId,
        companyId: campana.companyId,
        tipo,
        meta: (meta ?? {}) as object,
      },
    })
  } catch (e) {
    console.error('[invitaciones] registrarEventoCampana error:', e)
  }
}

export interface ReclamarPremioResult {
  ok: boolean
  error?: string
}

export async function reclamarPremio(campanaId: string): Promise<ReclamarPremioResult> {
  try {
    const user = await getUser()
    if (!user || user.metadata.role !== 'CLIENTE' || !user.metadata.clienteId) {
      return { ok: false, error: 'Sesión inválida.' }
    }
    const clienteId = user.metadata.clienteId as string

    const [campana, progreso] = await Promise.all([
      prisma.campanaInvitacion.findUnique({
        where: { id: campanaId },
        select: {
          id: true,
          companyId: true,
          estado: true,
          maxPremios: true,
          premiosOtorgados: true,
          beneficioInvitante: true,
        },
      }),
      prisma.invitacionProgreso.findUnique({
        where: { campanaId_clienteId: { campanaId, clienteId } },
      }),
    ])

    if (!campana) return { ok: false, error: 'Campaña no encontrada.' }
    if (campana.estado !== 'ACTIVA') return { ok: false, error: 'La campaña no está activa.' }
    if (!progreso) return { ok: false, error: 'No tienes progreso en esta campaña.' }
    if (!progreso.metaAlcanzada) return { ok: false, error: 'Aún no alcanzas la meta.' }
    if (progreso.premioReclamado) return { ok: false, error: 'Ya reclamaste tu premio.' }
    if (campana.maxPremios !== null && campana.premiosOtorgados >= campana.maxPremios) {
      return { ok: false, error: 'Los premios de esta campaña se agotaron.' }
    }

    await prisma.$transaction([
      prisma.invitacionProgreso.update({
        where: { id: progreso.id },
        data: { premioReclamado: true },
      }),
      prisma.campanaInvitacion.update({
        where: { id: campanaId },
        data: { premiosOtorgados: { increment: 1 } },
      }),
      prisma.invitacionEvento.create({
        data: {
          campanaId,
          clienteId,
          companyId: campana.companyId,
          tipo: 'PREMIO_RECLAMADO',
          meta: campana.beneficioInvitante as object,
        },
      }),
    ])

    // Entrega real del premio vía Benefit Engine (grant canjeable + aviso).
    await otorgarBeneficioCampana({ campanaId, clienteId, rol: 'INVITANTE' })

    return { ok: true }
  } catch (e) {
    console.error('[invitaciones] reclamarPremio error:', e)
    return { ok: false, error: 'No se pudo reclamar el premio.' }
  }
}
