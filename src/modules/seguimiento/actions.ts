'use server'

/**
 * Seguimiento de beneficios gratis · Fase S2 (docs/SEGUIMIENTO-BENEFICIOS.md).
 * Recordatorio in-app al cliente que aún no ha usado su recompensa. El canje
 * interno NO vive aquí: reutiliza `confirmarCanjePromocion` con `interno=1`
 * (un solo flujo de canje para todos los reportes).
 */

import { prisma } from '@/lib/prisma'
import { requireSection } from '@/lib/auth/guards'
import { getRequestMeta } from '@/lib/server-utils'
import { crearNotificacion } from '@/modules/notificaciones/service'

export async function enviarRecordatorioSeguimiento(
  compraId: string
): Promise<{ ok?: true; error?: string }> {
  try {
    const user = await requireSection('seguimiento')
    if (!user) return { error: 'No tienes permisos para enviar recordatorios.' }

    const compra = await prisma.productoCompra.findUnique({
      where: { id: compraId },
      select: {
        id: true,
        companyId: true,
        estado: true,
        usosRestantes: true,
        fechaVencimiento: true,
        promocion: { select: { id: true, titulo: true } },
        cliente: {
          select: {
            supabaseId: true,
            nombre: true,
            company: { select: { name: true, zonaHoraria: true } },
          },
        },
      },
    })
    if (!compra) return { error: 'Recompensa no encontrada.' }
    if (
      user.metadata.role !== 'SUPERADMIN' &&
      user.metadata.companyId !== compra.companyId
    ) {
      return { error: 'Esta recompensa pertenece a otra empresa.' }
    }
    if (compra.estado !== 'ACTIVA' || compra.usosRestantes <= 0) {
      return { error: 'Esta recompensa ya no está disponible para el cliente.' }
    }

    const destinatario = await prisma.user.findUnique({
      where: { supabaseId: compra.cliente.supabaseId },
      select: { id: true },
    })
    if (!destinatario) {
      return { error: 'El cliente no tiene cuenta de usuario para notificar.' }
    }

    const titulo = compra.promocion?.titulo ?? 'tu recompensa'
    const vence = compra.fechaVencimiento
      ? ` antes del ${new Intl.DateTimeFormat('es-DO', {
          timeZone: compra.cliente.company.zonaHoraria,
          dateStyle: 'medium',
        }).format(compra.fechaVencimiento)}`
      : ''
    await crearNotificacion({
      userId: destinatario.id,
      tipo: 'SISTEMA',
      titulo: '🎁 Tienes una recompensa sin usar',
      mensaje: `Tu ${titulo} gratis en ${compra.cliente.company.name} te está esperando. Ven a usarla${vence}: solo presenta tu QR desde la app.`,
      href: '/cliente/mis-promociones',
    })

    // Trazabilidad: el recordatorio queda en auditoría con fecha/hora y admin.
    const meta = await getRequestMeta()
    await prisma.auditLog.create({
      data: {
        companyId: compra.companyId,
        userId: user.metadata.dbUserId ?? null,
        accion: 'NOTA_INTERNA',
        entidadTipo: 'ProductoCompra',
        entidadId: compra.id,
        payload: {
          tipo: 'RECORDATORIO_SEGUIMIENTO',
          promocionId: compra.promocion?.id ?? null,
          cliente: compra.cliente.nombre,
        },
        ...meta,
      },
    })

    return { ok: true }
  } catch (e) {
    console.error('[seguimiento] enviarRecordatorioSeguimiento:', e)
    return { error: 'Error interno al enviar el recordatorio.' }
  }
}
