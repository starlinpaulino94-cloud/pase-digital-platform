'use server'

import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'
import { getRequestMeta } from '@/lib/server-utils'
import { qrScanLimiter } from '@/lib/rate-limit'

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
  membershipId: string | null
  qrTokenId: string | null
  planNombre: string | null
  estado: string | null
  esIlimitado: boolean
  lavadosRestantes: number
  fechaVencimiento: string | null
  vehiculos: { id: string; label: string }[]
  puedeUsar: boolean
  mensaje?: string
  alertas: string[]
  visitasRecientes: VisitaReciente[]
}

export interface LookupResult {
  error?: string
  cliente?: ClienteLookup
}

/** Look up a client by QR token. Scoped to the employee's company. */
export async function buscarPorToken(token: string): Promise<LookupResult> {
  try {
  const user = await getUser()
  if (!user || !['EMPLEADO', 'ADMIN_EMPRESA', 'SUPERADMIN'].includes(user.metadata.role)) {
    return { error: 'No autorizado.' }
  }

  // Rate limit QR scanning to prevent abuse
  const clientId = user.metadata.dbUserId || 'anonymous'
  if (!qrScanLimiter(clientId)) {
    return { error: 'Demasiadas búsquedas. Intenta de nuevo en unos minutos.' }
  }

  const clean = token.trim()
  if (!clean) return { error: 'Código vacío.' }

  const qr = await prisma.qrToken.findUnique({
    where: { token: clean },
    include: {
      cliente: {
        include: {
          company: true,
          vehiculos: true,
          memberships: { include: { plan: true }, orderBy: { createdAt: 'desc' } },
          visits: {
            orderBy: { fechaVisita: 'desc' },
            take: 5,
          },
        },
      },
    },
  })

  if (!qr || !qr.activo) return { error: 'Código QR no válido.' }

  const cliente = qr.cliente

  if (
    user.metadata.role !== 'SUPERADMIN' &&
    user.metadata.companyId &&
    cliente.companyId !== user.metadata.companyId
  ) {
    return { error: 'Este cliente pertenece a otra empresa.' }
  }

  const now = new Date()
  const active = cliente.memberships.find(
    (m) =>
      m.estado === 'ACTIVA' &&
      (!m.fechaVencimiento || m.fechaVencimiento > now)
  )
  const latest = cliente.memberships[0]
  const m = active ?? latest

  let puedeUsar = false
  let mensaje: string | undefined
  if (!active) {
    mensaje = latest
      ? 'La membresía no está activa.'
      : 'El cliente no tiene membresía.'
  } else if (!active.plan.esIlimitado && active.lavadosRestantes <= 0) {
    mensaje = 'No quedan usos disponibles este período.'
  } else {
    puedeUsar = true
  }

  // Compute alerts for active memberships
  const alertas: string[] = []
  if (active) {
    if (active.fechaVencimiento) {
      const daysLeft = Math.ceil(
        (active.fechaVencimiento.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysLeft <= 7) {
        alertas.push(`Membresía vence en ${daysLeft} día${daysLeft !== 1 ? 's' : ''}.`)
      }
    }
    if (!active.plan.esIlimitado) {
      if (active.lavadosRestantes === 1) {
        alertas.push('Último uso disponible en este período.')
      }
    }
  }

  return {
    cliente: {
      clienteId: cliente.id,
      nombre: cliente.nombre,
      email: cliente.email,
      avatarUrl: cliente.avatarUrl ?? null,
      empresa: cliente.company.name,
      membershipId: active?.id ?? null,
      qrTokenId: qr.id,
      planNombre: m?.plan.nombre ?? null,
      estado: m?.estado ?? null,
      esIlimitado: active?.plan.esIlimitado ?? false,
      lavadosRestantes: active?.lavadosRestantes ?? 0,
      fechaVencimiento: active?.fechaVencimiento?.toISOString() ?? null,
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
    },
  }
  } catch (e) {
    console.error('[visitas] buscarPorToken error:', e)
    return { error: 'Ocurrió un error inesperado. Intenta de nuevo.' }
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
  if (!user || !['EMPLEADO', 'ADMIN_EMPRESA', 'SUPERADMIN'].includes(user.metadata.role)) {
    return { error: 'No autorizado.' }
  }

  const membershipId = String(formData.get('membershipId') ?? '')
  const servicio = String(formData.get('servicio') ?? '').trim()
  const vehiculoId = String(formData.get('vehiculoId') ?? '').trim() || null
  const notas = String(formData.get('notas') ?? '').trim() || null
  const sucursalId = String(formData.get('sucursalId') ?? '').trim() || null
  const qrTokenId = String(formData.get('qrTokenId') ?? '').trim() || null

  if (!membershipId) return { error: 'Membresía no válida.' }
  if (!servicio) return { error: 'Selecciona un servicio.' }

  const meta = await getRequestMeta()

  try {
    const result = await prisma.$transaction(async (tx) => {
      const membership = await tx.membership.findUnique({
        where: { id: membershipId },
        include: { plan: true, cliente: true },
      })
      if (!membership) throw new Error('Membresía no encontrada.')

      if (
        user.metadata.role !== 'SUPERADMIN' &&
        user.metadata.companyId &&
        membership.cliente.companyId !== user.metadata.companyId
      ) {
        throw new Error('Cliente de otra empresa.')
      }

      const now = new Date()
      const isActive =
        membership.estado === 'ACTIVA' &&
        (!membership.fechaVencimiento || membership.fechaVencimiento > now)
      if (!isActive) throw new Error('La membresía no está activa.')

      const ilimitado = membership.plan.esIlimitado
      if (!ilimitado && membership.lavadosRestantes <= 0) {
        throw new Error('No quedan usos disponibles.')
      }

      let qrToken: { id: string } | null = null
      if (qrTokenId) {
        // Invalidación atómica: solo tiene éxito si el token sigue activo y
        // pertenece al cliente correcto. Previene race conditions bajo concurrencia.
        const invalidado = await tx.qrToken.updateMany({
          where: { id: qrTokenId, activo: true, clienteId: membership.clienteId },
          data: { activo: false },
        })
        if (invalidado.count === 0) {
          throw new Error('Este código QR ya fue utilizado o no es válido. Pide al cliente que actualice su QR.')
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
          companyId: membership.cliente.companyId,
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
          data: { clienteId: membership.clienteId },
        })
        await tx.auditLog.create({
          data: {
            companyId: membership.cliente.companyId,
            userId: user.metadata.dbUserId ?? null,
            accion: 'QR_USADO',
            entidadTipo: 'QrToken',
            entidadId: qrToken.id,
            payload: { clienteId: membership.clienteId, visitId: visit.id },
            ...meta,
          },
        })
        await tx.auditLog.create({
          data: {
            companyId: membership.cliente.companyId,
            userId: user.metadata.dbUserId ?? null,
            accion: 'QR_GENERADO',
            entidadTipo: 'QrToken',
            entidadId: nuevoQr.id,
            payload: { clienteId: membership.clienteId, motivo: 'regeneracion_post_uso' },
            ...meta,
          },
        })
      }

      return { restantes, visitId: visit.id }
    })

    return { success: true, restantes: result.restantes, visitId: result.visitId, servicio }
  } catch (e) {
    // Log detailed error for debugging, but return generic message to client
    console.error('[visitas] confirmarVisita transaction error:', e instanceof Error ? e.message : String(e))
    return { error: 'No se pudo confirmar la visita. Por favor intenta de nuevo.' }
  }
  } catch (e) {
    console.error('[visitas] confirmarVisita error:', e)
    return { error: 'Ocurrió un error inesperado. Intenta de nuevo.' }
  }
}

export interface ImpresionState {
  error?: string
  success?: boolean
}

export async function registrarImpresion(visitId: string): Promise<ImpresionState> {
  try {
  const user = await getUser()
  if (!user || !['EMPLEADO', 'ADMIN_EMPRESA', 'SUPERADMIN'].includes(user.metadata.role)) {
    return { error: 'No autorizado.' }
  }
  const meta = await getRequestMeta()
  try {
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
  } catch {
    return { error: 'No se pudo registrar la impresión.' }
  }
}
