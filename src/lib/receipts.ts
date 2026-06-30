import { prisma } from '@/lib/prisma'
import type { ReceiptTipo, Prisma } from '@prisma/client'

/**
 * Comprobantes (Receipts).
 *
 * Dos tipos con numeración independiente:
 * - PAGO: se genera al aprobar un pago.
 * - CONSUMO: se genera al confirmar una visita (uso de QR).
 *
 * La numeración es consecutiva por empresa + tipo.
 */

/**
 * Genera el siguiente número consecutivo para un comprobante.
 * Debe llamarse dentro de una transacción para evitar race conditions.
 */
export async function nextReceiptNumero(
  empresaId: string,
  tipo: ReceiptTipo,
  tx?: PrismaTransaction
): Promise<number> {
  const client = tx ?? prisma
  const last = await client.receipt.findFirst({
    where: { empresaId, tipo },
    orderBy: { numero: 'desc' },
    select: { numero: true },
  })
  return (last?.numero ?? 0) + 1
}

type PrismaTransaction = Parameters<Parameters<typeof prisma['$transaction']>[0]>[0]

/**
 * Crea un comprobante de pago.
 */
export async function createReceiptPago(
  tx: PrismaTransaction,
  data: {
    paymentId: string
    clienteId: string
    empresaId: string
    sucursalId?: string
    empleadoId?: string
    monto: number
    datos: Prisma.InputJsonObject
  }
) {
  const numero = await nextReceiptNumero(data.empresaId, 'PAGO', tx)
  return tx.receipt.create({
    data: {
      numero,
      tipo: 'PAGO',
      paymentId: data.paymentId,
      clienteId: data.clienteId,
      empresaId: data.empresaId,
      sucursalId: data.sucursalId,
      empleadoId: data.empleadoId,
      monto: data.monto,
      datos: data.datos,
    },
  })
}

/**
 * Crea un comprobante de consumo.
 */
export async function createReceiptConsumo(
  tx: PrismaTransaction,
  data: {
    visitId: string
    clienteId: string
    empresaId: string
    sucursalId?: string
    empleadoId?: string
    datos: Prisma.InputJsonObject
  }
) {
  const numero = await nextReceiptNumero(data.empresaId, 'CONSUMO', tx)
  return tx.receipt.create({
    data: {
      numero,
      tipo: 'CONSUMO',
      visitId: data.visitId,
      clienteId: data.clienteId,
      empresaId: data.empresaId,
      sucursalId: data.sucursalId,
      empleadoId: data.empleadoId,
      datos: data.datos,
    },
  })
}

/**
 * Registra una impresión de comprobante.
 */
export async function logPrint(
  receiptId: string,
  empleadoId?: string,
  sucursalId?: string,
  motivo?: string
) {
  return prisma.printLog.create({
    data: { receiptId, empleadoId, sucursalId, motivo },
  })
}
