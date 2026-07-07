/**
 * Módulo interno de servidor (sin 'use server'). `procesarReferidoCompletado`
 * otorga recompensas de referido y solo debe llamarse server-to-server desde un
 * flujo ya autorizado (activación de membresía). `getClienteReferidos` se invoca
 * desde un Server Component. Ninguna de las dos debe ser un endpoint público.
 */

import { prisma } from '@/lib/prisma'
import { logReferralEvent } from '@/lib/referidos'

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

    // Evento del embudo (+puntos) para el referente.
    await logReferralEvent({
      clienteId: referido.referenteClienteId,
      companyId,
      tipo: 'MEMBRESIA',
      meta: { referidoClienteId: clienteId },
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

export interface ReferidosDashboard {
  stats: {
    compartidos: number
    clicks: number
    registros: number
    membresias: number
    conversionPct: number // membresías / clics
    recompensas: number
    puntos: number
  }
  historial: {
    id: string
    nombre: string
    fecha: Date
    estado: 'REGISTRADO' | 'MEMBRESIA_ACTIVA' | 'RECOMPENSA_ENTREGADA'
  }[]
  ranking: { posicion: number; nombre: string; puntos: number; esYo: boolean }[]
  miPosicion: number | null
}

/**
 * Panel completo de referidos del cliente: embudo (compartidos → clics →
 * registros → membresías), puntos, historial con estados y ranking de la
 * empresa (aislado por companyId). Server-only.
 */
export async function getReferidosDashboard(
  clienteId: string,
  companyId: string
): Promise<ReferidosDashboard> {
  const [eventos, referidos, topRaw] = await Promise.all([
    prisma.referralEvent.groupBy({
      by: ['tipo'],
      where: { clienteId, companyId },
      _count: { _all: true },
      _sum: { puntos: true },
    }),
    prisma.referido.findMany({
      where: { referenteClienteId: clienteId, companyId },
      include: { referidoCliente: { select: { nombre: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.referralEvent.groupBy({
      by: ['clienteId'],
      where: { companyId },
      _sum: { puntos: true },
      orderBy: { _sum: { puntos: 'desc' } },
      take: 50,
    }),
  ])

  const byTipo = new Map(eventos.map((e) => [e.tipo, e]))
  const compartidos = byTipo.get('SHARE')?._count._all ?? 0
  const clicks = byTipo.get('CLICK')?._count._all ?? 0
  // Registros/membresías: la fuente autoritativa son las filas de Referido
  // (los eventos existen para puntos/canales, pero pueden faltar en datos viejos).
  const registros = referidos.length
  const membresias = referidos.filter((r) => r.estado === 'COMPLETADO').length
  const recompensas = referidos.filter((r) => r.recompensaAplicada).length
  const puntos = eventos.reduce((acc, e) => acc + (e._sum.puntos ?? 0), 0)
  const conversionPct = clicks > 0 ? Math.round((membresias / clicks) * 100) : 0

  // Ranking de la empresa (top 5 + posición propia), con nombres.
  const top5 = topRaw.slice(0, 5)
  const nombres = await prisma.cliente.findMany({
    where: { id: { in: top5.map((t) => t.clienteId) } },
    select: { id: true, nombre: true },
  })
  const nombreDe = new Map(nombres.map((n) => [n.id, n.nombre]))
  const ranking = top5.map((t, i) => ({
    posicion: i + 1,
    nombre: nombreDe.get(t.clienteId) ?? 'Cliente',
    puntos: t._sum.puntos ?? 0,
    esYo: t.clienteId === clienteId,
  }))
  const idx = topRaw.findIndex((t) => t.clienteId === clienteId)
  const miPosicion = idx >= 0 ? idx + 1 : null

  return {
    stats: { compartidos, clicks, registros, membresias, conversionPct, recompensas, puntos },
    historial: referidos.map((r) => ({
      id: r.id,
      nombre: r.referidoCliente.nombre,
      fecha: r.createdAt,
      estado: r.recompensaAplicada
        ? 'RECOMPENSA_ENTREGADA'
        : r.estado === 'COMPLETADO'
          ? 'MEMBRESIA_ACTIVA'
          : 'REGISTRADO',
    })),
    ranking,
    miPosicion,
  }
}
