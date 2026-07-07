/**
 * Módulo interno de servidor (sin 'use server'). `procesarReferidoCompletado`
 * otorga recompensas de referido y solo debe llamarse server-to-server desde un
 * flujo ya autorizado (activación de membresía). `getClienteReferidos` se invoca
 * desde un Server Component. Ninguna de las dos debe ser un endpoint público.
 */

import { prisma } from '@/lib/prisma'

/**
 * Se llama cuando un cliente activa su primera membresía. Si fue referido,
 * marca el referido como completado y evalúa las reglas de recompensa
 * configuradas por el admin (sin lógica de negocio fija en código: todo
 * sale de ReglaRecompensa).
 */
export async function procesarReferidoCompletado(
  clienteId: string,
  companyId: string
) {
  try {
    const referido = await prisma.referido.findUnique({
      where: { referidoClienteId: clienteId },
    })
    if (!referido || referido.estado !== 'PENDIENTE') return

    await prisma.referido.update({
      where: { id: referido.id },
      data: { estado: 'COMPLETADO', completadoEn: new Date() },
    })

    await prisma.auditLog.create({
      data: {
        companyId,
        accion: 'REFERIDO_COMPLETADO',
        entidadTipo: 'Referido',
        entidadId: referido.id,
        payload: { referenteClienteId: referido.referenteClienteId, referidoClienteId: clienteId },
      },
    })

    await evaluarRecompensas(referido.referenteClienteId, companyId)
  } catch (e) {
    console.error('[referidos] procesarReferidoCompletado error:', e)
  }
}

/** Revisa las reglas activas de la empresa y otorga la recompensa si el referente alcanzó la condición. */
async function evaluarRecompensas(referenteClienteId: string, companyId: string) {
  const completados = await prisma.referido.count({
    where: { companyId, referenteClienteId, estado: 'COMPLETADO' },
  })

  const reglas = await prisma.reglaRecompensa.findMany({
    where: {
      companyId,
      activo: true,
      condicion: 'N_REFERIDOS_COMPLETADOS',
      valorCondicion: completados,
    },
  })
  if (reglas.length === 0) return

  const referente = await prisma.cliente.findUnique({
    where: { id: referenteClienteId },
  })
  if (!referente) return

  const referenteUser = await prisma.user.findUnique({
    where: { supabaseId: referente.supabaseId },
    select: { id: true },
  })

  const notificacionesACrear = []

  for (const regla of reglas) {
    let mensaje = ''

    // Validate Number conversion to ensure it's finite
    const valor = Number(regla.valorRecompensa)
    if (!Number.isFinite(valor)) {
      console.error('[referidos] Invalid valorRecompensa:', regla.valorRecompensa)
      continue
    }

    if (regla.tipoRecompensa === 'LAVADOS_GRATIS') {
      // Find active membership in THIS COMPANY for the referrer
      const activa = await prisma.membership.findUnique({
        where: {
          clienteId_companyId: {
            clienteId: referenteClienteId,
            companyId,
          },
        },
      })
      if (activa && activa.estado === 'ACTIVA') {
        await prisma.membership.update({
          where: { id: activa.id },
          data: { lavadosRestantes: { increment: valor } },
        })
        mensaje = `¡Ganaste ${valor} usos gratis por tus referidos! Ya se aplicaron a tu membresía.`
      } else {
        mensaje = `¡Ganaste ${valor} usos gratis por tus referidos! Se aplicarán cuando actives tu próxima membresía en esta empresa.`
      }
    } else if (regla.tipoRecompensa === 'DESCUENTO_PORCENTAJE') {
      mensaje = `¡Ganaste un ${valor}% de descuento por tus referidos! Contacta al negocio para aplicarlo.`
    } else {
      mensaje = `¡Ganaste RD$${valor} de descuento por tus referidos! Contacta al negocio para aplicarlo.`
    }

    await prisma.auditLog.create({
      data: {
        companyId,
        accion: 'RECOMPENSA_OTORGADA',
        entidadTipo: 'ReglaRecompensa',
        entidadId: regla.id,
        payload: { referenteClienteId, reglaId: regla.id, completados },
      },
    })

    if (referenteUser) {
      notificacionesACrear.push({
        userId: referenteUser.id,
        tipo: 'RECOMPENSA_REFERIDO' as const,
        titulo: '¡Recompensa por referidos!',
        mensaje,
        href: '/cliente/referidos',
      })
    }
  }

  if (notificacionesACrear.length > 0) {
    await prisma.notificacion.createMany({
      data: notificacionesACrear,
    }).catch((e) => {
      console.error('[referidos-notifications]', e)
    })
  }

  await prisma.referido.updateMany({
    where: { companyId, referenteClienteId, estado: 'COMPLETADO', recompensaAplicada: false },
    data: { recompensaAplicada: true },
  })
}

export async function getClienteReferidos(clienteId: string) {
  return prisma.referido.findMany({
    where: { referenteClienteId: clienteId },
    include: { referidoCliente: { select: { nombre: true } } },
    orderBy: { createdAt: 'desc' },
  })
}
