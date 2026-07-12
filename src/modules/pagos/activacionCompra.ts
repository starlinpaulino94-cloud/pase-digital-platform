/**
 * Fase E5 · Punto de activación ÚNICO para compras de productos comerciales
 * (promociones). Espejo de `activarMembresia`: tanto la aprobación manual del
 * admin como las pasarelas futuras (puerto de pagos) deben invocar esta
 * función.
 *
 * IMPORTANTE: SIN 'use server'. Función interna de servidor: confía en que el
 * llamador autorizó la operación (rol + pertenencia a la empresa). Exponerla
 * como Server Action permitiría activar compras sin pagar.
 */

import { prisma } from '@/lib/prisma'
import { crearNotificacion } from '@/modules/notificaciones/service'
import { emitirEventoEstrategia } from '@/modules/estrategias/eventos'
import {
  calcularVencimientoBeneficio,
  registrarTransicionCompra,
} from '@/modules/promociones/compra'

type Meta = { ipAddress: string | null; userAgent: string | null }

type ActivarCompraResult =
  | { ok: true; compraId: string; clienteId: string; companyId: string; promoTitulo: string }
  | { ok: false; error: string }

// Estados desde los que se permite activar una compra.
const ESTADOS_ACTIVABLES = ['SOLICITADA', 'PENDIENTE_PAGO', 'EN_VALIDACION', 'APROBADA', 'RECHAZADA'] as const

export async function activarCompraPromocion(
  compraId: string,
  userId: string | null,
  meta: Meta,
  opts: { motivo?: string } = {}
): Promise<ActivarCompraResult> {
  const compra = await prisma.productoCompra.findUnique({
    where: { id: compraId },
    include: { promocion: true, cliente: true },
  })
  if (!compra) return { ok: false, error: 'Compra no encontrada.' }
  if (compra.estado === 'ACTIVA') return { ok: false, error: 'La compra ya está activa.' }
  if (!(ESTADOS_ACTIVABLES as readonly string[]).includes(compra.estado)) {
    return { ok: false, error: `No se puede activar una compra en estado ${compra.estado}.` }
  }
  const promo = compra.promocion
  if (!promo) return { ok: false, error: 'La promoción de esta compra ya no existe.' }

  const now = new Date()
  const monto = Number(compra.precioCongelado ?? promo.precio ?? 0)

  try {
    await prisma.$transaction(async (tx) => {
      // Cupo atómico: `canjes` cuenta ventas activadas contra `maxCanjes`.
      // Guard en SQL para que dos aprobaciones concurrentes no sobrevendan.
      const cupo = await tx.$queryRaw<{ id: string }[]>`
        UPDATE "promociones" SET "canjes" = "canjes" + 1
         WHERE "id" = ${promo.id}
           AND ("maxCanjes" IS NULL OR "canjes" < "maxCanjes")
        RETURNING "id"
      `
      if (cupo.length === 0) throw new Error('CUPO_AGOTADO')

      // Guard anti-doble-activación (mismo patrón que el QR de un solo uso).
      const upd = await tx.productoCompra.updateMany({
        where: { id: compra.id, estado: compra.estado },
        data: {
          estado: 'ACTIVA',
          fechaActivacion: now,
          fechaVencimiento: calcularVencimientoBeneficio(promo, now),
          usosRestantes: compra.usosIncluidos,
          pagoConfirmado: true,
          montoPagado: monto,
          rechazadoReason: null,
          aprobadaPorId: userId,
        },
      })
      if (upd.count === 0) throw new Error('ESTADO_CAMBIADO')

      await registrarTransicionCompra(tx, {
        compraId: compra.id,
        desde: compra.estado,
        hacia: 'ACTIVA',
        motivo: opts.motivo ?? 'Pago validado por el administrador',
        userId,
      })

      // QR único de la compra — el MISMO sistema que las membresías.
      const qr = await tx.qrToken.create({
        data: { clienteId: compra.clienteId, compraId: compra.id },
      })

      await tx.auditLog.createMany({
        data: [
          {
            companyId: compra.companyId,
            userId,
            accion: 'QR_GENERADO',
            entidadTipo: 'QrToken',
            entidadId: qr.id,
            payload: { clienteId: compra.clienteId, compraId: compra.id, motivo: 'activacion_compra_promocion' },
            ...meta,
          },
          {
            companyId: compra.companyId,
            userId,
            accion: 'PAGO_APROBADO',
            entidadTipo: 'ProductoCompra',
            entidadId: compra.id,
            payload: { promocionId: promo.id, clienteId: compra.clienteId, monto },
            ...meta,
          },
        ],
      })
    })
  } catch (e) {
    if (e instanceof Error && e.message === 'CUPO_AGOTADO') {
      return { ok: false, error: 'La promoción está agotada: se alcanzó el límite de ventas.' }
    }
    if (e instanceof Error && e.message === 'ESTADO_CAMBIADO') {
      return { ok: false, error: 'La compra cambió de estado; recarga e intenta de nuevo.' }
    }
    console.error('[pagos] activarCompraPromocion:', e)
    return { ok: false, error: 'No se pudo activar la compra.' }
  }

  // Notificación al cliente + bus de estrategias (fuera de la transacción,
  // nunca rompen la activación).
  const clienteUser = await prisma.user
    .findUnique({ where: { supabaseId: compra.cliente.supabaseId }, select: { id: true } })
    .catch(() => null)
  if (clienteUser) {
    await crearNotificacion({
      userId: clienteUser.id,
      tipo: 'PAGO_APROBADO',
      titulo: 'Promoción activada',
      mensaje: `Tu compra de «${promo.titulo}» fue aprobada. Ya puedes usar tu QR.`,
      href: `/cliente/mis-promociones/${compra.id}`,
    })
  }
  await emitirEventoEstrategia({
    companyId: compra.companyId,
    type: 'cliente.compro_servicio',
    subjectId: compra.clienteId,
    payload: {
      cliente: { nombre: compra.cliente.nombre },
      compra: { tipo: 'promocion', monto, promocion: promo.titulo },
    },
  })

  return {
    ok: true,
    compraId: compra.id,
    clienteId: compra.clienteId,
    companyId: compra.companyId,
    promoTitulo: promo.titulo,
  }
}
