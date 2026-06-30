import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import { headers } from 'next/headers'

/**
 * Auditoría completa.
 * Registra toda acción importante con datos anteriores y nuevos.
 */

export interface AuditInput {
  userId?: string
  empresaId?: string
  sucursalId?: string
  accion: string // "approve_payment", "confirm_visit", etc.
  entidad: string // "Payment", "Visit", "Membership"
  entidadId?: string
  datosAntes?: Prisma.InputJsonValue
  datosDespues?: Prisma.InputJsonValue
}

export async function logAudit(input: AuditInput) {
  try {
    // Extraer info del request (IP, user agent, dispositivo)
    const headerList = await headers()
    const ip =
      headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headerList.get('x-real-ip') ||
      null
    const userAgent = headerList.get('user-agent') || null
    const dispositivo = detectDevice(userAgent)

    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        empresaId: input.empresaId,
        sucursalId: input.sucursalId,
        ip,
        userAgent,
        dispositivo,
        accion: input.accion,
        entidad: input.entidad,
        entidadId: input.entidadId,
        datosAntes: input.datosAntes,
        datosDespues: input.datosDespues,
      },
    })
  } catch (e) {
    // La auditoría no debe romper el flujo principal
    console.error('[audit] log failed:', e)
  }
}

function detectDevice(ua: string | null): string | null {
  if (!ua) return null
  if (/mobile/i.test(ua)) return 'mobile'
  if (/tablet/i.test(ua)) return 'tablet'
  if (/windows|mac|linux/i.test(ua)) return 'desktop'
  return 'other'
}
