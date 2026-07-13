import { prisma } from '@/lib/prisma'
import { crearNotificacion } from '@/modules/notificaciones/service'
import type { BenefitType } from '@prisma/client'

/**
 * Entrega REAL de los beneficios de una campaña de invitación a través del
 * Benefit Engine: el beneficio definido en el JSON de la campaña se
 * materializa como un `Benefit` del catálogo de la empresa (uno por campaña
 * y rol, creado bajo demanda) y un `BenefitGrant` canjeable para el cliente.
 *
 * IMPORTANTE: este módulo NO lleva 'use server' — son funciones internas que
 * solo deben invocarse desde código de servidor ya autorizado. Nunca lanzan:
 * un fallo en la entrega no rompe el flujo que la disparó (registro, reclamo).
 */

interface BeneficioCampanaJson {
  tipo?: string
  valor?: string
  descripcion?: string
  vigenciaDias?: number
}

const TIPO_A_BENEFIT: Record<string, BenefitType> = {
  SERVICIO_GRATIS: 'SERVICE_FREE',
  DESCUENTO: 'DISCOUNT',
  CREDITO: 'CREDIT',
  PRODUCTO: 'PRODUCT',
  UPGRADE: 'UPGRADE',
}

/** Busca el User dueño de la ficha de cliente (para notificación in-app). */
async function usuarioDeCliente(clienteId: string): Promise<string | null> {
  const cliente = await prisma.cliente.findUnique({
    where: { id: clienteId },
    select: { supabaseId: true },
  })
  if (!cliente) return null
  const user = await prisma.user.findUnique({
    where: { supabaseId: cliente.supabaseId },
    select: { id: true },
  })
  return user?.id ?? null
}

export async function otorgarBeneficioCampana(opts: {
  campanaId: string
  clienteId: string
  rol: 'INVITANTE' | 'INVITADO'
}): Promise<void> {
  try {
    const campana = await prisma.campanaInvitacion.findUnique({
      where: { id: opts.campanaId },
      select: {
        id: true,
        companyId: true,
        nombre: true,
        beneficioInvitante: true,
        beneficioInvitado: true,
      },
    })
    if (!campana) return

    const beneficio = (
      opts.rol === 'INVITANTE' ? campana.beneficioInvitante : campana.beneficioInvitado
    ) as BeneficioCampanaJson | null
    if (!beneficio?.descripcion && !beneficio?.valor) return

    // Un Benefit del catálogo por campaña+rol, creado la primera vez que se
    // entrega. code determinista para que sea idempotente entre entregas.
    const code = `INV-${campana.id}-${opts.rol}`
    let benefit = await prisma.benefit.findFirst({
      where: { companyId: campana.companyId, code },
      select: { id: true, nombre: true },
    })
    if (!benefit) {
      benefit = await prisma.benefit.create({
        data: {
          companyId: campana.companyId,
          code,
          nombre:
            beneficio.descripcion ||
            `Premio campaña ${campana.nombre} (${opts.rol.toLowerCase()})`,
          descripcion: beneficio.descripcion ?? null,
          categoria: 'CAMPAIGN',
          tipo: TIPO_A_BENEFIT[beneficio.tipo ?? ''] ?? 'CUSTOM',
          status: 'PUBLISHED',
          config: {
            valor: beneficio.valor ?? '',
            vigenciaDias: beneficio.vigenciaDias ?? 30,
            campanaInvitacionId: campana.id,
            rol: opts.rol,
          },
        },
        select: { id: true, nombre: true },
      })
    }

    // Idempotencia: un mismo cliente no recibe dos grants del mismo beneficio
    // de campaña (p. ej. reintento del flujo de registro).
    const existente = await prisma.benefitGrant.findFirst({
      where: {
        companyId: campana.companyId,
        benefitId: benefit.id,
        subscriberId: opts.clienteId,
      },
      select: { id: true },
    })
    if (existente) return

    const vigenciaDias = Number(beneficio.vigenciaDias ?? 30)
    await prisma.benefitGrant.create({
      data: {
        companyId: campana.companyId,
        benefitId: benefit.id,
        subscriberId: opts.clienteId,
        subscriberKind: 'CLIENT',
        sourceModule: 'campaign',
        expiresAt:
          vigenciaDias > 0 ? new Date(Date.now() + vigenciaDias * 86_400_000) : null,
        meta: { campanaInvitacionId: campana.id, rol: opts.rol },
      },
    })

    const userId = await usuarioDeCliente(opts.clienteId)
    if (userId) {
      await crearNotificacion({
        userId,
        tipo: 'RECOMPENSA_REFERIDO',
        titulo: opts.rol === 'INVITANTE' ? '¡Tu premio está listo!' : '¡Regalo de bienvenida!',
        mensaje: `${benefit.nombre}. Preséntalo en el negocio para usarlo${
          vigenciaDias > 0 ? ` (vence en ${vigenciaDias} días)` : ''
        }.`,
        href: '/cliente/invita-y-gana',
      })
    }
  } catch (e) {
    console.error('[invitaciones] otorgarBeneficioCampana error:', e)
  }
}
