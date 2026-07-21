import { prisma } from '@/lib/prisma'
import { devolverUsos } from '@/modules/regalos/queries'
import { notificarClienteRegalo } from '@/modules/regalos/entrega'

/**
 * Regalos P2P · Fase R4 — mantenimiento periódico (se cuelga del cron de
 * automatizaciones, /api/cron/automatizaciones):
 *
 *  1. EXPIRAR globalmente los PENDIENTES vencidos (la expiración perezosa de
 *     R2 solo actúa cuando alguna de las partes abre su módulo de regalos;
 *     el cron garantiza que ningún regalo quede colgado y que los usos
 *     reservados vuelvan al remitente aunque nadie entre a la app).
 *  2. RECORDAR al destinatario los regalos que expiran en menos de 24 horas.
 *
 * Idempotente: los guards de estado evitan dobles devoluciones y el
 * recordatorio se deduplica consultando si ya existe una notificación con el
 * título distintivo dentro de la ventana de ese regalo.
 */

export const TITULO_RECORDATORIO = '⏰ Tienes un regalo por expirar'

const VENTANA_RECORDATORIO_MS = 24 * 60 * 60 * 1000

export async function mantenimientoRegalos(): Promise<{
  expirados: number
  recordatorios: number
}> {
  const ahora = new Date()
  let expirados = 0
  let recordatorios = 0

  // ── 1 · Expirar vencidos (todas las empresas) ──────────────────────────────
  const vencidos = await prisma.regalo.findMany({
    where: { estado: 'PENDIENTE', expiraAt: { lt: ahora } },
    select: {
      id: true,
      tipo: true,
      usos: true,
      compraOrigenId: true,
      membershipOrigenId: true,
      remitenteId: true,
    },
    take: 200,
  })
  for (const r of vencidos) {
    // Guard atómico: solo quien logra marcarlo devuelve los usos.
    const upd = await prisma.regalo.updateMany({
      where: { id: r.id, estado: 'PENDIENTE' },
      data: { estado: 'EXPIRADO', resueltoAt: new Date() },
    })
    if (upd.count === 0) continue
    expirados++
    await devolverUsos(r).catch((e) => console.error('[regalos-cron] refund', e))
    if (r.tipo === 'TRANSFERENCIA_USOS') {
      await notificarClienteRegalo(
        r.remitenteId,
        'Tu regalo expiró',
        `Nadie aceptó tu transferencia a tiempo: tus ${r.usos} uso${r.usos !== 1 ? 's' : ''} volvieron a tu cuenta.`,
        '/cliente/regalos'
      )
    }
  }

  // ── 2 · Recordatorios (<24h para expirar, receptor con cuenta) ─────────────
  // Solo transferencias: en los regalos pagados el receptor no tiene nada que
  // aceptar (se entregan solos al confirmarse el pago del remitente).
  const porExpirar = await prisma.regalo.findMany({
    where: {
      estado: 'PENDIENTE',
      tipo: 'TRANSFERENCIA_USOS',
      destinatarioId: { not: null },
      expiraAt: { gte: ahora, lt: new Date(ahora.getTime() + VENTANA_RECORDATORIO_MS) },
    },
    select: {
      id: true,
      usos: true,
      expiraAt: true,
      destinatarioId: true,
      remitente: { select: { nombre: true } },
    },
    take: 200,
  })
  for (const r of porExpirar) {
    if (!r.destinatarioId) continue
    try {
      const cliente = await prisma.cliente.findUnique({
        where: { id: r.destinatarioId },
        select: { supabaseId: true },
      })
      if (!cliente?.supabaseId) continue
      const u = await prisma.user.findUnique({
        where: { supabaseId: cliente.supabaseId },
        select: { id: true },
      })
      if (!u) continue

      // Dedup: como máximo un recordatorio por usuario dentro de la ventana
      // de las últimas 24h de ese regalo.
      const yaAvisado = await prisma.notificacion.findFirst({
        where: {
          userId: u.id,
          tipo: 'SISTEMA',
          titulo: TITULO_RECORDATORIO,
          createdAt: { gte: new Date(r.expiraAt.getTime() - VENTANA_RECORDATORIO_MS) },
        },
        select: { id: true },
      })
      if (yaAvisado) continue

      const horas = Math.max(1, Math.round((r.expiraAt.getTime() - ahora.getTime()) / 3_600_000))
      await prisma.notificacion.create({
        data: {
          userId: u.id,
          tipo: 'SISTEMA',
          titulo: TITULO_RECORDATORIO,
          mensaje: `${r.remitente.nombre.split(/\s+/)[0]} te envió ${r.usos} uso${r.usos !== 1 ? 's' : ''} y el regalo expira en ~${horas}h. ¡Acéptalo antes de que vuelva a su cuenta!`,
          href: '/cliente/regalos',
        },
      })
      recordatorios++
    } catch (e) {
      console.error('[regalos-cron] recordatorio', e)
    }
  }

  return { expirados, recordatorios }
}
