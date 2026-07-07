'use server'

import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'
import { getRequestMeta } from '@/lib/server-utils'
import { qrScanLimiter } from '@/lib/rate-limit'
import { SCANNER_ROLES } from '@/types'

export interface VisitaReciente {
  id: string
  servicio: string
  fecha: string
  descontado: boolean
}

export interface ClienteLookup {
  clienteId: string
  nombre: string
  email: string
  avatarUrl: string | null
  empresa: string
  empresaType: string
  membershipId: string | null
  qrTokenId: string | null
  planNombre: string | null
  planBeneficios: string[]
  estado: string | null
  esIlimitado: boolean
  lavadosIncluidos: number
  lavadosRestantes: number
  fechaInicio: string | null
  fechaVencimiento: string | null
  vehiculos: { id: string; label: string }[]
  puedeUsar: boolean
  mensaje?: string
  alertas: string[]
  visitasRecientes: VisitaReciente[]
  totalVisitas: number
  ultimoUso: string | null
  promocionesActivas: number
}

export interface LookupResult {
  error?: string
  errorCode?: 'QR_NOT_FOUND' | 'QR_INACTIVE' | 'WRONG_COMPANY' | 'NO_MEMBERSHIP' | 'MEMBERSHIP_INACTIVE' | 'MEMBERSHIP_EXPIRED' | 'NO_USES_LEFT' | 'RATE_LIMITED' | 'UNAUTHORIZED' | 'INTERNAL'
  cliente?: ClienteLookup
}

export async function buscarPorToken(token: string): Promise<LookupResult> {
  try {
    const user = await getUser()
    if (!user || !SCANNER_ROLES.includes(user.metadata.role)) {
      return { error: 'No tienes permisos para escanear códigos QR.', errorCode: 'UNAUTHORIZED' }
    }

    const clientId = user.metadata.dbUserId || 'anonymous'
    if (!qrScanLimiter(clientId)) {
      return { error: 'Demasiadas búsquedas. Espera un momento e intenta de nuevo.', errorCode: 'RATE_LIMITED' }
    }

    const clean = token.trim()
    if (!clean) return { error: 'El código QR está vacío.', errorCode: 'QR_NOT_FOUND' }

    const qr = await prisma.qrToken.findUnique({
      where: { token: clean },
      include: {
        cliente: {
          include: {
            company: true,
            vehiculos: true,
            visits: { orderBy: { fechaVisita: 'desc' }, take: 5 },
            _count: { select: { visits: true } },
          },
        },
        membership: {
          include: { plan: true },
        },
      },
    })

    if (!qr) {
      await logScanInvalido(user.metadata.dbUserId, clean, 'QR_NOT_FOUND')
      return { error: 'Este código QR no existe. Verifica que sea correcto.', errorCode: 'QR_NOT_FOUND' }
    }

    if (!qr.activo) {
      await logScanInvalido(user.metadata.dbUserId, clean, 'QR_INACTIVE')
      return { error: 'Este código QR ya fue utilizado. Pide al cliente que muestre su QR actualizado.', errorCode: 'QR_INACTIVE' }
    }

    const cliente = qr.cliente
    const membership = qr.membership

    // Validate scanner's company matches membership's company
    if (
      user.metadata.role !== 'SUPERADMIN' &&
      user.metadata.companyId &&
      membership.companyId !== user.metadata.companyId
    ) {
      await logScanInvalido(user.metadata.dbUserId, clean, 'WRONG_COMPANY')
      return { error: 'Este cliente pertenece a otra empresa.', errorCode: 'WRONG_COMPANY' }
    }

    const now = new Date()
    const m = membership

    const promocionesActivas = await prisma.promocion.count({
      where: { companyId: membership.companyId, activo: true, vigenciaDesde: { lte: now }, OR: [{ vigenciaHasta: null }, { vigenciaHasta: { gte: now } }] },
    }).catch(() => 0)

    let puedeUsar = false
    let mensaje: string | undefined
    let errorCode: LookupResult['errorCode'] | undefined

    if (m.estado !== 'ACTIVA') {
      const estadoMap: Record<string, string> = {
        PENDIENTE: 'La membresía está pendiente de activación.',
        PENDIENTE_PAGO: 'La membresía está esperando confirmación de pago.',
        RECHAZADA: 'El pago de la membresía fue rechazado.',
        VENCIDA: 'La membresía ha vencido. El cliente debe renovar.',
        CANCELADA: 'La membresía fue cancelada.',
      }
      mensaje = estadoMap[m.estado] ?? 'La membresía no está activa.'
      errorCode = 'MEMBERSHIP_INACTIVE'
    } else if (m.fechaVencimiento && m.fechaVencimiento <= now) {
      mensaje = 'La membresía ha vencido.'
      errorCode = 'MEMBERSHIP_EXPIRED'
    } else if (!m.plan.esIlimitado && m.lavadosRestantes <= 0) {
      mensaje = 'No quedan usos disponibles en este período.'
      errorCode = 'NO_USES_LEFT'
    } else {
      puedeUsar = true
    }

    const alertas: string[] = []
    if (m.estado === 'ACTIVA') {
      if (m.fechaVencimiento) {
        const daysLeft = Math.ceil(
          (m.fechaVencimiento.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
        if (daysLeft <= 7 && daysLeft > 0) {
          alertas.push(`La membresía vence en ${daysLeft} día${daysLeft !== 1 ? 's' : ''}.`)
        }
      }
      if (!m.plan.esIlimitado && m.lavadosRestantes === 1) {
        alertas.push('Este es el último uso disponible.')
      }
    }

    const lastVisit = cliente.visits[0]

    return {
      errorCode,
      cliente: {
        clienteId: cliente.id,
        nombre: cliente.nombre,
        email: cliente.email,
        avatarUrl: cliente.avatarUrl ?? null,
        empresa: cliente.company.name,
        empresaType: cliente.company.type,
        membershipId: m.id,
        qrTokenId: qr.id,
        planNombre: m.plan.nombre,
        planBeneficios: m.plan.beneficios,
        estado: m.estado,
        esIlimitado: m.plan.esIlimitado ?? false,
        lavadosIncluidos: m.plan.lavadosIncluidos ?? 0,
        lavadosRestantes: m.lavadosRestantes ?? 0,
        fechaInicio: m.fechaInicio?.toISOString() ?? null,
        fechaVencimiento: m.fechaVencimiento?.toISOString() ?? null,
        vehiculos: cliente.vehiculos.map((v) => ({
          id: v.id,
          label: `${v.marca} ${v.modelo} (${v.anio})${v.placa ? ` · ${v.placa}` : ''}`,
        })),
        puedeUsar,
        mensaje,
        alertas,
        visitasRecientes: cliente.visits.map((v) => ({
          id: v.id,
          servicio: v.servicio,
          fecha: v.fechaVisita.toISOString(),
          descontado: v.descontado,
        })),
        totalVisitas: cliente._count.visits,
        ultimoUso: lastVisit?.fechaVisita.toISOString() ?? null,
        promocionesActivas,
      },
    }
  } catch (e) {
    console.error('[visitas] buscarPorToken error:', e)
    return { error: 'Error interno al verificar el código QR. Intenta de nuevo.', errorCode: 'INTERNAL' }
  }
}

export interface ConfirmState {
  error?: string
  success?: boolean
  restantes?: number
  visitId?: string
  servicio?: string
}

export async function confirmarVisita(
  _prev: ConfirmState,
  formData: FormData
): Promise<ConfirmState> {
  try {
    const user = await getUser()
    if (!user || !SCANNER_ROLES.includes(user.metadata.role)) {
      return { error: 'No tienes permisos para confirmar visitas.' }
    }

    const membershipId = String(formData.get('membershipId') ?? '')
    const servicio = String(formData.get('servicio') ?? '').trim()
    const vehiculoId = String(formData.get('vehiculoId') ?? '').trim() || null
    const notas = String(formData.get('notas') ?? '').trim() || null
    const sucursalId = String(formData.get('sucursalId') ?? '').trim() || null
    const qrTokenId = String(formData.get('qrTokenId') ?? '').trim() || null

    if (!membershipId) return { error: 'No se encontró la membresía. Escanea el QR de nuevo.' }
    if (!servicio) return { error: 'Selecciona un servicio antes de confirmar.' }

    const meta = await getRequestMeta()

    const result = await prisma.$transaction(async (tx) => {
      const membership = await tx.membership.findUnique({
        where: { id: membershipId },
        include: { plan: true, cliente: true },
      })
      if (!membership) throw new TxError('La membresía no fue encontrada. Puede haber sido eliminada.')

      if (
        user.metadata.role !== 'SUPERADMIN' &&
        user.metadata.companyId &&
        membership.companyId !== user.metadata.companyId
      ) {
        throw new TxError('Este cliente pertenece a otra empresa.')
      }

      if (sucursalId) {
        const sucursal = await tx.sucursal.findUnique({
          where: { id: sucursalId },
        })
        if (!sucursal) {
          throw new TxError('La sucursal no fue encontrada.')
        }
        if (sucursal.companyId !== membership.companyId) {
          throw new TxError('La sucursal no pertenece a la empresa del cliente.')
        }
      }

      const now = new Date()
      if (membership.estado !== 'ACTIVA') {
        throw new TxError(`La membresía no está activa (estado: ${membership.estado}).`)
      }
      if (membership.fechaVencimiento && membership.fechaVencimiento <= now) {
        throw new TxError('La membresía ha vencido.')
      }

      const ilimitado = membership.plan.esIlimitado
      if (!ilimitado && membership.lavadosRestantes <= 0) {
        throw new TxError('No quedan usos disponibles en este período.')
      }

      let qrToken: { id: string } | null = null
      if (qrTokenId) {
        // Verify qrToken belongs to the correct membership and is still active
        const qrTokenData = await tx.qrToken.findUnique({
          where: { id: qrTokenId },
        })
        if (!qrTokenData || qrTokenData.membresiaId !== membership.id) {
          throw new TxError('Este código QR no es válido para esta membresía.')
        }

        const invalidado = await tx.qrToken.updateMany({
          where: { id: qrTokenId, activo: true, membresiaId: membership.id },
          data: { activo: false },
        })
        if (invalidado.count === 0) {
          throw new TxError('Este código QR ya fue utilizado. Pide al cliente que muestre su QR actualizado.')
        }
        qrToken = { id: qrTokenId }
      }

      let restantes = membership.lavadosRestantes
      const descontado = !ilimitado
      if (descontado) {
        restantes = Math.max(0, membership.lavadosRestantes - 1)
        await tx.membership.update({
          where: { id: membership.id },
          data: { lavadosRestantes: restantes },
        })
      }

      const visit = await tx.visit.create({
        data: {
          clienteId: membership.clienteId,
          vehiculoId,
          membershipId: membership.id,
          sucursalId,
          empleadoId: user.metadata.dbUserId || null,
          servicio,
          descontado,
          notas,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        },
      })

      await tx.auditLog.create({
        data: {
          companyId: membership.companyId,
          userId: user.metadata.dbUserId ?? null,
          accion: 'VISITA_CONFIRMADA',
          entidadTipo: 'Visit',
          entidadId: visit.id,
          payload: { clienteId: membership.clienteId, membershipId: membership.id, servicio, descontado, restantes, sucursalId },
          ...meta,
        },
      })

      if (qrToken) {
        const nuevoQr = await tx.qrToken.create({
          data: {
            clienteId: membership.clienteId,
            membresiaId: membership.id,
          },
        })
        await tx.auditLog.create({
          data: {
            companyId: membership.companyId,
            userId: user.metadata.dbUserId ?? null,
            accion: 'QR_USADO',
            entidadTipo: 'QrToken',
            entidadId: qrToken.id,
            payload: { clienteId: membership.clienteId, membresiaId: membership.id, visitId: visit.id },
            ...meta,
          },
        })
        await tx.auditLog.create({
          data: {
            companyId: membership.companyId,
            userId: user.metadata.dbUserId ?? null,
            accion: 'QR_GENERADO',
            entidadTipo: 'QrToken',
            entidadId: nuevoQr.id,
            payload: { clienteId: membership.clienteId, membresiaId: membership.id, motivo: 'regeneracion_post_uso' },
            ...meta,
          },
        })
      }

      return { restantes, visitId: visit.id }
    })

    return { success: true, restantes: result.restantes, visitId: result.visitId, servicio }
  } catch (e) {
    if (e instanceof TxError) {
      return { error: e.message }
    }
    console.error('[visitas] confirmarVisita error:', e)
    return { error: 'Error interno al confirmar la visita. Intenta de nuevo.' }
  }
}

export interface ImpresionState {
  error?: string
  success?: boolean
}

export async function registrarImpresion(visitId: string): Promise<ImpresionState> {
  try {
    const user = await getUser()
    if (!user || !SCANNER_ROLES.includes(user.metadata.role)) {
      return { error: 'No autorizado.' }
    }
    const meta = await getRequestMeta()
    const visit = await prisma.visit.findUnique({
      where: { id: visitId },
      include: { membership: { include: { cliente: true } } },
    })
    if (!visit) return { error: 'Visita no encontrada.' }

    await prisma.auditLog.create({
      data: {
        companyId: visit.membership?.cliente.companyId ?? null,
        userId: user.metadata.dbUserId ?? null,
        accion: 'COMPROBANTE_IMPRESO',
        entidadTipo: 'Visit',
        entidadId: visitId,
        payload: { visitId },
        ...meta,
      },
    })
    return { success: true }
  } catch {
    return { error: 'No se pudo registrar la impresión.' }
  }
}

class TxError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TxError'
  }
}

async function logScanInvalido(userId: string | undefined, token: string, reason: string) {
  try {
    const meta = await getRequestMeta()
    await prisma.auditLog.create({
      data: {
        userId: userId ?? null,
        accion: 'QR_USADO',
        entidadTipo: 'QrToken',
        entidadId: token.slice(0, 25),
        payload: { reason, token: token.slice(0, 10) + '…', valido: false },
        ...meta,
      },
    })
  } catch {
    // best-effort logging
  }
}
