'use server'

/**
 * Acciones del Transaction & Receipt Engine (Fase E4) para el panel.
 * - Consulta de una transacción por código TX-… o por QR usado (escáner).
 * - Payload del ticket para imprimir/reimprimir (empresa + plantilla + datos).
 * - Registro auditado de impresiones/reimpresiones (COPIA #N con motivo).
 */

import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'
import { getRequestMeta } from '@/lib/server-utils'
import { SCANNER_ROLES } from '@/types'
import {
  getByCodigo,
  getById,
  registrarImpresionRecibo,
  type TransactionDetalle,
} from '@/lib/transactions'
import type { ReceiptTemplateConfig, ReceiptTransaccionInfo, ReceiptEmpresaInfo } from '@/lib/receipts'

// ── Info serializable para la pantalla "Historial del QR" ────────────────────

export interface TransaccionScanInfo {
  id: string
  codigo: string
  ticketNumero: string
  estado: string
  fecha: string
  cliente: string | null
  vehiculo: string | null
  empresa: string | null
  sucursal: string | null
  servicio: string | null
  beneficio: string | null
  promocion: string | null
  membresia: string | null
  empleado: string | null
  caja: string | null
  observaciones: string | null
  /** Si fue cancelada/revertida: cuándo y por qué. */
  cancelacion: { fecha: string; motivo: string | null } | null
  reversion: { fecha: string; motivo: string | null } | null
  impresiones: number
  errorDetalle: string | null
}

function toScanInfo(t: TransactionDetalle): TransaccionScanInfo {
  const s = t.snapshot
  const transCancel = t.transiciones.find((x) => x.hacia === 'CANCELLED')
  const transRevert = t.transiciones.find((x) => x.hacia === 'REVERTED')
  return {
    id: t.id,
    codigo: t.codigo,
    ticketNumero: t.ticketNumero,
    estado: t.estado,
    fecha: t.createdAt.toISOString(),
    cliente: (s.cliente as string) ?? null,
    vehiculo: (s.vehiculo as string) ?? null,
    empresa: (s.empresa as string) ?? null,
    sucursal: (s.sucursal as string) ?? null,
    servicio: (s.servicio as string) ?? null,
    beneficio: (s.beneficio as string) ?? null,
    promocion: (s.promocion as string) ?? null,
    membresia: (s.membresia as string) ?? (s.plan as string) ?? null,
    empleado: (s.empleado as string) ?? null,
    caja: t.caja,
    observaciones: t.resultado,
    cancelacion:
      t.cancelledAt || transCancel
        ? {
            fecha: (t.cancelledAt ?? transCancel!.createdAt).toISOString(),
            motivo: transCancel?.motivo ?? null,
          }
        : null,
    reversion:
      t.revertedAt || transRevert
        ? {
            fecha: (t.revertedAt ?? transRevert!.createdAt).toISOString(),
            motivo: transRevert?.motivo ?? null,
          }
        : null,
    impresiones: t.impresiones.length,
    errorDetalle: t.errorDetalle,
  }
}

/** ¿Puede este usuario ver transacciones de esta empresa? */
function autorizado(user: NonNullable<Awaited<ReturnType<typeof getUser>>>, companyId: string) {
  return (
    user.metadata.role === 'SUPERADMIN' ||
    !user.metadata.companyId ||
    user.metadata.companyId === companyId
  )
}

export async function consultarTransaccionPorCodigo(
  codigo: string
): Promise<{ error?: string; transaccion?: TransaccionScanInfo }> {
  const user = await getUser()
  if (!user || !SCANNER_ROLES.includes(user.metadata.role)) {
    return { error: 'No autorizado.' }
  }
  const t = await getByCodigo(codigo)
  if (!t) return { error: 'No existe ninguna transacción con ese código.' }
  if (!autorizado(user, t.companyId)) {
    return { error: 'Esta transacción pertenece a otra empresa.' }
  }
  return { transaccion: toScanInfo(t) }
}

// ── Ticket (impresión / reimpresión) ─────────────────────────────────────────

export interface TicketPayload {
  empresa: ReceiptEmpresaInfo
  template: ReceiptTemplateConfig
  transaccion: Omit<ReceiptTransaccionInfo, 'fecha'> & { fecha: string }
  timeZone: string
  transactionId: string
}

export async function obtenerTicket(
  transactionId: string
): Promise<{ error?: string; ticket?: TicketPayload }> {
  const user = await getUser()
  if (!user || !SCANNER_ROLES.includes(user.metadata.role)) {
    return { error: 'No autorizado.' }
  }
  const t = await getById(transactionId)
  if (!t) return { error: 'Transacción no encontrada.' }
  if (!autorizado(user, t.companyId)) {
    return { error: 'Esta transacción pertenece a otra empresa.' }
  }

  const [company, plantilla] = await Promise.all([
    prisma.company.findUnique({
      where: { id: t.companyId },
      select: {
        name: true, direccion: true, telefono: true, website: true,
        logoUrl: true, zonaHoraria: true,
      },
    }),
    prisma.receiptTemplate.findUnique({ where: { companyId: t.companyId } }),
  ])
  if (!company) return { error: 'Empresa no encontrada.' }

  const s = t.snapshot
  return {
    ticket: {
      transactionId: t.id,
      timeZone: company.zonaHoraria,
      empresa: {
        nombre: company.name,
        sucursal: (s.sucursal as string) ?? null,
        direccion: company.direccion,
        telefono: company.telefono,
        web: company.website,
        logoUrl: company.logoUrl,
      },
      template: (plantilla?.config ?? {}) as ReceiptTemplateConfig,
      transaccion: {
        codigo: t.codigo,
        ticketNumero: t.ticketNumero,
        fecha: t.createdAt.toISOString(),
        caja: t.caja,
        empleado: (s.empleado as string) ?? null,
        cliente: (s.cliente as string) ?? null,
        vehiculo: (s.vehiculo as string) ?? null,
        placa: (s.placa as string) ?? null,
        membresia: (s.membresia as string) ?? null,
        plan: (s.plan as string) ?? null,
        nivel: (s.nivel as string) ?? null,
        puntos: (s.puntos as number) ?? null,
        servicio: (s.servicio as string) ?? null,
        promocion: (s.promocion as string) ?? null,
        beneficio: (s.beneficio as string) ?? null,
        descuento: (s.descuento as string) ?? null,
        subtotal: (s.subtotal as string) ?? null,
        total: (s.total as string) ?? null,
        restantes: (s.restantes as number | 'ilimitado') ?? null,
        observaciones: t.resultado,
        promosActivas: (s.promosActivas as string[]) ?? [],
      },
    },
  }
}

export async function registrarImpresionTx(
  transactionId: string,
  motivo?: string
): Promise<{ error?: string; numero?: number; esCopia?: boolean }> {
  try {
    const user = await getUser()
    if (!user || !SCANNER_ROLES.includes(user.metadata.role)) {
      return { error: 'No autorizado.' }
    }
    const t = await prisma.transaction.findUnique({
      where: { id: transactionId },
      select: { companyId: true },
    })
    if (!t) return { error: 'Transacción no encontrada.' }
    if (!autorizado(user, t.companyId)) return { error: 'No autorizado.' }

    const { numero, esCopia } = await registrarImpresionRecibo(transactionId, {
      empleadoId: user.metadata.dbUserId ?? null,
      motivo: motivo?.trim() || null,
    })

    const meta = await getRequestMeta()
    await prisma.auditLog
      .create({
        data: {
          companyId: t.companyId,
          userId: user.metadata.dbUserId ?? null,
          accion: 'COMPROBANTE_IMPRESO',
          entidadTipo: 'Transaction',
          entidadId: transactionId,
          payload: { numero, esCopia, motivo: motivo ?? null },
          ...meta,
        },
      })
      .catch(() => {})

    return { numero, esCopia }
  } catch {
    return { error: 'No se pudo registrar la impresión.' }
  }
}
