'use server'

import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'
import { headers } from 'next/headers'
import { SCANNER_ROLES } from '@/types'
import { createReceiptConsumo } from '@/lib/receipts'
import { notifyQrUtilizado } from '@/lib/notifications'
import { logAudit } from '@/lib/audit'

export interface ClienteLookup {
  clienteId: string
  nombre: string
  email: string
  empresa: string
  empresaId: string
  membershipId: string | null
  planNombre: string | null
  estado: string | null
  esIlimitado: boolean
  lavadosRestantes: number
  fechaVencimiento: string | null
  vehiculos: { id: string; label: string }[]
  puedeUsar: boolean
  mensaje?: string
  // Token del QR escaneado (para pasarlo al confirmar)
  qrToken: string
  // Si el QR ya fue consumido, info de auditoría
  consumidoInfo?: {
    fecha: string
    empresa: string
    sucursal: string | null
    usuario: string | null
  }
}

export interface LookupResult {
  error?: string
  cliente?: ClienteLookup
}

/**
 * Busca un cliente por su QR token.
 * Si el QR ya fue consumido, devuelve info de auditoría (fecha/empresa/sucursal/usuario).
 */
export async function buscarPorToken(token: string): Promise<LookupResult> {
  try {
    const user = await getUser()
    if (!user || !SCANNER_ROLES.includes(user.metadata.role)) {
      return { error: 'No autorizado.' }
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
          },
        },
        consumidoPor: true,
      },
    })

    if (!qr) return { error: 'Código QR no válido.' }

    const cliente = qr.cliente

    // Company scoping (superadmin can see all)
    if (
      user.metadata.role !== 'SUPERADMIN' &&
      user.metadata.companyId &&
      cliente.companyId !== user.metadata.companyId
    ) {
      return { error: 'Este cliente pertenece a otra empresa.' }
    }

    // Si el QR ya fue consumido, devolver info de auditoría
    if (qr.estado === 'CONSUMIDO') {
      // Buscar la sucursal del consumo
      let sucursalNombre: string | null = null
      if (qr.consumidoEnSucursalId) {
        const suc = await prisma.sucursal.findUnique({
          where: { id: qr.consumidoEnSucursalId },
          select: { nombre: true },
        })
        sucursalNombre = suc?.nombre ?? null
      }
      return {
        cliente: {
          clienteId: cliente.id,
          nombre: cliente.nombre,
          email: cliente.email,
          empresa: cliente.company.name,
          empresaId: cliente.company.id,
          membershipId: null,
          planNombre: null,
          estado: null,
          esIlimitado: false,
          lavadosRestantes: 0,
          fechaVencimiento: null,
          vehiculos: [],
          puedeUsar: false,
          mensaje: 'Este QR ya fue utilizado. Se generó uno nuevo automáticamente.',
          qrToken: clean,
          consumidoInfo: {
            fecha: qr.consumidoEn?.toISOString() ?? '',
            empresa: cliente.company.name,
            sucursal: sucursalNombre,
            usuario: qr.consumidoPor?.name ?? null,
          },
        },
      }
    }

    if (qr.estado === 'REVOCADO') {
      return { error: 'Este QR fue revocado. El cliente debe contactar al establecimiento.' }
    }

    // QR ACTIVO — buscar membresía activa
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
        : 'El cliente no tiene membresía activa.'
    } else if (!active.plan.esIlimitado && active.lavadosRestantes <= 0) {
      mensaje = 'No quedan usos disponibles este periodo.'
    } else {
      puedeUsar = true
    }

    return {
      cliente: {
        clienteId: cliente.id,
        nombre: cliente.nombre,
        email: cliente.email,
        empresa: cliente.company.name,
        empresaId: cliente.company.id,
        membershipId: active?.id ?? null,
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
        qrToken: clean,
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
  nuevoQrToken?: string
  receiptNumero?: number
}

/**
 * Confirma el uso de un servicio:
 * 1. Marca el QR como CONSUMIDO
 * 2. Descuenta un servicio
 * 3. Genera un NUEVO QR (rotación)
 * 4. Crea comprobante de consumo (Receipt)
 * 5. Envía notificación al cliente
 * 6. Registra auditoría
 */
export async function confirmarVisita(
  _prev: ConfirmState,
  formData: FormData
): Promise<ConfirmState> {
  try {
    const user = await getUser()
    if (!user || !SCANNER_ROLES.includes(user.metadata.role)) {
      return { error: 'No autorizado.' }
    }

    const membershipId = String(formData.get('membershipId') ?? '')
    const servicio = String(formData.get('servicio') ?? '').trim()
    const vehiculoId = String(formData.get('vehiculoId') ?? '').trim() || null
    const notas = String(formData.get('notas') ?? '').trim() || null
    const qrTokenStr = String(formData.get('qrToken') ?? '').trim()
    const sucursalId = String(formData.get('sucursalId') ?? '').trim() || user.metadata.sucursalId || null

    if (!membershipId) return { error: 'Membresía no válida.' }
    if (!servicio) return { error: 'Selecciona un servicio.' }
    if (!qrTokenStr) return { error: 'Token QR no proporcionado.' }

    // IP y dispositivo para auditoría
    const headerList = await headers()
    const ip =
      headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headerList.get('x-real-ip') ||
      null
    const dispositivo = headerList.get('user-agent') || null

    try {
      const result = await prisma.$transaction(async (tx) => {
        // 1. Validar membresía
        const membership = await tx.membership.findUnique({
          where: { id: membershipId },
          include: { plan: true, cliente: { include: { company: true } } },
        })
        if (!membership) throw new Error('Membresía no encontrada.')

        // Company scoping
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

        // 2. Validar que el QR esté ACTIVO
        const qrToken = await tx.qrToken.findUnique({
          where: { token: qrTokenStr },
        })
        if (!qrToken) throw new Error('QR no encontrado.')
        if (qrToken.estado !== 'ACTIVO') {
          throw new Error('Este QR ya fue utilizado o está revocado.')
        }

        // 3. Descontar servicio
        let restantes = membership.lavadosRestantes
        const descontado = !ilimitado
        if (descontado) {
          restantes = Math.max(0, membership.lavadosRestantes - 1)
          await tx.membership.update({
            where: { id: membership.id },
            data: { lavadosRestantes: restantes },
          })
        }

        // 4. Crear Visit con auditoría
        const visit = await tx.visit.create({
          data: {
            clienteId: membership.clienteId,
            vehiculoId,
            membershipId: membership.id,
            empleadoId: user.metadata.dbUserId || null,
            servicio,
            descontado,
            notas,
            sucursalId,
            ip,
            dispositivo,
            qrTokenConsumidoId: qrToken.id,
          },
        })

        // 5. Marcar QR como CONSUMIDO
        await tx.qrToken.update({
          where: { id: qrToken.id },
          data: {
            estado: 'CONSUMIDO',
            activo: false, // mantener compatibilidad legacy
            consumidoEn: now,
            consumidoPorId: user.metadata.dbUserId || null,
            consumidoEnSucursalId: sucursalId,
            visitId: visit.id,
          },
        })

        // 6. Generar NUEVO QR (rotación)
        const nuevoQr = await tx.qrToken.create({
          data: {
            clienteId: membership.clienteId,
            membershipId: membership.id,
            estado: 'ACTIVO',
            activo: true,
          },
        })

        // 7. Linkear: old QR → new QR, Visit → new QR
        await tx.qrToken.update({
          where: { id: qrToken.id },
          data: { reemplazadoPorId: nuevoQr.id },
        })
        await tx.visit.update({
          where: { id: visit.id },
          data: { nuevoQrTokenId: nuevoQr.id },
        })

        // 8. Crear comprobante de consumo
        const sucursal = sucursalId
          ? await tx.sucursal.findUnique({ where: { id: sucursalId }, select: { nombre: true } })
          : null
        const receipt = await createReceiptConsumo(tx, {
          visitId: visit.id,
          clienteId: membership.clienteId,
          empresaId: membership.cliente.company.id,
          sucursalId: sucursalId || undefined,
          empleadoId: user.metadata.dbUserId || undefined,
          datos: {
            cliente: membership.cliente.nombre,
            empresa: membership.cliente.company.name,
            sucursal: sucursal?.nombre ?? null,
            servicio,
            plan: membership.plan.nombre,
            qrConsumido: qrToken.token.slice(0, 8) + '...',
            qrNuevo: nuevoQr.token.slice(0, 8) + '...',
            serviciosRestantes: restantes,
            empleado: user.email,
            fechaVisita: now.toISOString(),
          },
        })

        // 9. Linkear receipt a la visita
        await tx.visit.update({
          where: { id: visit.id },
          data: { receiptConsumoId: receipt.id },
        })

        return {
          restantes,
          nuevoQrToken: nuevoQr.token,
          receiptNumero: receipt.numero,
          clienteId: membership.clienteId,
          clienteSupabaseId: membership.cliente.supabaseId,
          empresaNombre: membership.cliente.company.name,
        }
      })

      // 10. Notificación al cliente (fuera de la transacción)
      try {
        const clienteUser = await prisma.user.findFirst({
          where: { supabaseId: result.clienteSupabaseId },
          select: { id: true },
        })
        const sucursal = sucursalId
          ? await prisma.sucursal.findUnique({ where: { id: sucursalId }, select: { nombre: true } })
          : null
        if (clienteUser) {
          await notifyQrUtilizado(clienteUser.id, result.clienteId, {
            servicio,
            sucursal: sucursal?.nombre ?? 'N/A',
            restantes: result.restantes,
          })
        }
      } catch (e) {
        console.error('[visitas] notification failed:', e)
      }

      // 11. Auditoría
      await logAudit({
        userId: user.metadata.dbUserId || undefined,
        empresaId: user.metadata.companyId || undefined,
        sucursalId: sucursalId || undefined,
        accion: 'confirm_visit',
        entidad: 'Visit',
        entidadId: membershipId,
        datosDespues: { servicio, restantes: result.restantes },
      })

      return {
        success: true,
        restantes: result.restantes,
        nuevoQrToken: result.nuevoQrToken,
        receiptNumero: result.receiptNumero,
      }
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'No se pudo confirmar.' }
    }
  } catch (e) {
    console.error('[visitas] confirmarVisita error:', e)
    return { error: 'Ocurrió un error inesperado. Intenta de nuevo.' }
  }
}
