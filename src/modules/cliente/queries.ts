import { prisma } from '@/lib/prisma'

/**
 * Load all memberships for a user across all companies.
 * Used for the "Mis Membresías" dashboard.
 *
 * Busca los clientes del usuario por `supabaseId` y, como respaldo, por el
 * `clienteId` del token de sesión (app_metadata). Esto evita que la lista quede
 * vacía si el `cliente.supabaseId` de algún registro no coincide exactamente con
 * el de la sesión (p. ej. datos creados por un admin o migrados).
 *
 * Devuelve objetos PLANOS y serializables (precio convertido a number) porque el
 * resultado se pasa a un Client Component; un `Decimal` de Prisma rompería el
 * render con "Only plain objects can be passed to Client Components".
 *
 * Propaga los errores (no los traga) para que la página distinga "sin
 * membresías" de "falló la carga".
 */
export async function getClienteAllMemberships(
  supabaseId: string,
  clienteId?: string | null
) {
  if (!supabaseId && !clienteId) {
    console.warn('[getClienteAllMemberships] Missing supabaseId y clienteId')
    return []
  }

  try {
    const or = [
      ...(supabaseId ? [{ supabaseId }] : []),
      ...(clienteId ? [{ id: clienteId }] : []),
    ]
    const clientes = await prisma.cliente.findMany({
      where: { OR: or },
      select: { id: true },
    })
    const clienteIds = clientes.map((c) => c.id)
    if (clienteIds.length === 0) return []

    // Membresías (con plan y empresa). Se consultan aparte de los QR para que un
    // problema con las columnas de qr_tokens (activo/membresiaId) no tumbe toda
    // la lista.
    const memberships = await prisma.membership.findMany({
      where: { clienteId: { in: clienteIds } },
      include: {
        plan: true,
        company: { select: { id: true, name: true, logoUrl: true, type: true } },
      },
      orderBy: [{ estado: 'asc' }, { fechaVencimiento: 'desc' }],
    })

    // QR activos por membresía — resiliente: si falla (drift de esquema), la
    // lista sigue mostrándose sin QR en vez de romperse por completo.
    const qrByMembership = new Map<string, { id: string; token: string }>()
    try {
      const qrs = await prisma.qrToken.findMany({
        where: { membresiaId: { in: memberships.map((m) => m.id) }, activo: true },
        select: { id: true, token: true, membresiaId: true },
      })
      for (const q of qrs) {
        if (!qrByMembership.has(q.membresiaId)) {
          qrByMembership.set(q.membresiaId, { id: q.id, token: q.token })
        }
      }
    } catch (qrError) {
      console.error('[getClienteAllMemberships] QR fetch failed (posible drift de esquema):', qrError)
    }

    return memberships
      .map((m) => ({
        id: m.id,
        clienteId: m.clienteId,
        companyId: m.companyId,
        company: m.company,
        plan: {
          id: m.plan.id,
          nombre: m.plan.nombre,
          precio: Number(m.plan.precio),
          esIlimitado: m.plan.esIlimitado,
        },
        estado: m.estado,
        fechaVencimiento: m.fechaVencimiento,
        fechaInicio: m.fechaInicio,
        lavadosRestantes: m.lavadosRestantes,
        qrToken: qrByMembership.get(m.id) ?? null,
      }))
      .sort((a, b) => {
        const orden = {
          ACTIVA: 0,
          PENDIENTE_PAGO: 1,
          PENDIENTE: 2,
          VENCIDA: 3,
          CANCELADA: 4,
          RECHAZADA: 5,
        }
        const aOrd = orden[a.estado as keyof typeof orden] ?? 99
        const bOrd = orden[b.estado as keyof typeof orden] ?? 99
        if (aOrd !== bOrd) return aOrd - bOrd
        if (a.fechaVencimiento && b.fechaVencimiento) {
          return a.fechaVencimiento.getTime() - b.fechaVencimiento.getTime()
        }
        return 0
      })
  } catch (error) {
    console.error('[getClienteAllMemberships] Error:', error)
    throw error
  }
}

/**
 * Datos del cliente para la página de perfil: básicos + empresa + vehículos.
 * Una sola query (antes hacía 3 consultas redundantes cargando membresías y
 * visitas que el perfil ni siquiera usa).
 */
export async function getClientePerfil(clienteId: string) {
  if (!clienteId) {
    console.warn('[getClientePerfil] Missing clienteId')
    return null
  }

  try {
    return await prisma.cliente.findUnique({
      where: { id: clienteId },
      select: {
        id: true,
        nombre: true,
        email: true,
        telefono: true,
        avatarUrl: true,
        companyId: true,
        company: {
          select: { id: true, name: true, slug: true, type: true, logoUrl: true },
        },
        vehiculos: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })
  } catch (error) {
    console.error('[getClientePerfil] Error loading cliente:', error)
    throw error
  }
}

export async function getClienteVisitas(
  clienteId: string,
  page = 1,
  pageSize = 20
) {
  const skip = (page - 1) * pageSize
  const [total, visitas] = await Promise.all([
    prisma.visit.count({ where: { clienteId } }),
    prisma.visit.findMany({
      where: { clienteId },
      select: {
        id: true,
        servicio: true,
        fechaVisita: true,
        descontado: true,
        clienteId: true,
        vehiculoId: true,
        vehiculo: true,
        membership: { select: { id: true, plan: { select: { nombre: true } } } },
      },
      orderBy: { fechaVisita: 'desc' },
      skip,
      take: pageSize,
    }),
  ])

  const enrichedVisitas = visitas.map((v) => ({
    ...v,
    sucursal: null as { id: string; nombre: string } | null,
  }))

  return { total, visitas: enrichedVisitas, pages: Math.ceil(total / pageSize) }
}

export function activeMembership<
  T extends { estado: string; fechaVencimiento: Date | null }
>(memberships: T[]): T | undefined {
  return memberships.find(
    (m) =>
      m.estado === 'ACTIVA' &&
      (!m.fechaVencimiento || m.fechaVencimiento > new Date())
  )
}

export interface PagoHistorialItem {
  id: string
  tipo: 'APROBADO' | 'RECHAZADO'
  fecha: Date
  monto: number | null
  motivo: string | null
  planNombre: string | null
}

export interface ClientePagos {
  membership: {
    id: string
    estado: string
    planNombre: string
    montoPagado: number | null
    fechaInicio: Date | null
    fechaVencimiento: Date | null
    createdAt: Date
    comprobanteUrl: string | null
    comprobanteNota: string | null
    rechazadoReason: string | null
    metodoPagoNombre: string | null
    planSolicitadoNombre: string | null
  } | null
  historial: PagoHistorialItem[]
}

/**
 * Datos de "Mis pagos": estado actual de la membresía + historial real de pagos
 * (aprobados/rechazados) reconstruido desde el AuditLog. Devuelve datos planos.
 */
export async function getClientePagos(clienteId: string): Promise<ClientePagos> {
  const memberships = await prisma.membership.findMany({
    where: { clienteId },
    include: { plan: true, metodoPago: true, planSolicitado: true },
    orderBy: { createdAt: 'desc' },
  })

  const membershipIds = memberships.map((m) => m.id)
  const current = memberships[0] ?? null

  let historial: PagoHistorialItem[] = []
  if (membershipIds.length > 0) {
    try {
      const logs = await prisma.auditLog.findMany({
        where: {
          entidadTipo: 'Membership',
          entidadId: { in: membershipIds },
          accion: { in: ['PAGO_APROBADO', 'PAGO_RECHAZADO'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })

      // Resolver nombres de plan referenciados en los payloads.
      const planIds = new Set<string>()
      for (const l of logs) {
        const p = (l.payload ?? {}) as Record<string, unknown>
        if (typeof p.planId === 'string') planIds.add(p.planId)
        if (typeof p.planNuevo === 'string') planIds.add(p.planNuevo)
      }
      const planes = planIds.size
        ? await prisma.plan.findMany({
            where: { id: { in: [...planIds] } },
            select: { id: true, nombre: true },
          })
        : []
      const planName = new Map(planes.map((p) => [p.id, p.nombre]))

      historial = logs.map((l) => {
        const p = (l.payload ?? {}) as Record<string, unknown>
        const planRef =
          (typeof p.planNuevo === 'string' && p.planNuevo) ||
          (typeof p.planId === 'string' && p.planId) ||
          null
        return {
          id: l.id,
          tipo: l.accion === 'PAGO_APROBADO' ? 'APROBADO' : 'RECHAZADO',
          fecha: l.createdAt,
          monto: typeof p.monto === 'number' ? p.monto : null,
          motivo: typeof p.motivo === 'string' ? p.motivo : null,
          planNombre: planRef ? planName.get(planRef) ?? null : null,
        }
      })
    } catch (e) {
      console.error('[getClientePagos] historial', e)
    }
  }

  return {
    membership: current
      ? {
          id: current.id,
          estado: current.estado,
          planNombre: current.plan.nombre,
          montoPagado: current.montoPagado != null ? Number(current.montoPagado) : null,
          fechaInicio: current.fechaInicio,
          fechaVencimiento: current.fechaVencimiento,
          createdAt: current.createdAt,
          comprobanteUrl: current.comprobanteUrl,
          comprobanteNota: current.comprobanteNota,
          rechazadoReason: current.rechazadoReason,
          metodoPagoNombre: current.metodoPago?.nombre ?? null,
          planSolicitadoNombre:
            current.estado === 'ACTIVA' && current.planIdSolicitado
              ? current.planSolicitado?.nombre ?? null
              : null,
        }
      : null,
    historial,
  }
}
