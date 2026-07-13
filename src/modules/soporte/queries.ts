import { prisma } from '@/lib/prisma'
import type { SessionUser } from '@/types'

export interface CompanyOption {
  id: string
  name: string
}

export interface CompanyContext {
  /** Empresa activa (null si el superadmin aún no ha elegido / no hay empresas). */
  companyId: string | null
  isSuperadmin: boolean
  /** Lista de empresas para el selector (solo poblada para superadmin). */
  companies: CompanyOption[]
}

/**
 * Resuelve la empresa sobre la que opera el panel.
 * - ADMIN_EMPRESA: su propia empresa (companyId del metadata).
 * - SUPERADMIN: la empresa solicitada en la página (requestedId); si no, la
 *   empresa ACTIVA del selector del panel (metadata.companyId); si tampoco,
 *   la primera disponible.
 *
 * Esto corrige el error "Empresa requerida": el superadmin no tiene companyId
 * propio, así que necesita un selector explícito; y además honra el selector
 * global del panel para que el contexto sea consistente entre módulos.
 */
export async function resolveCompanyContext(
  user: SessionUser,
  requestedId?: string
): Promise<CompanyContext> {
  const isSuperadmin = user.metadata.role === 'SUPERADMIN'

  if (!isSuperadmin) {
    return {
      companyId: user.metadata.companyId ?? null,
      isSuperadmin: false,
      companies: [],
    }
  }

  const companies = await prisma.company.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  })

  const exists = (id?: string | null) =>
    (id && companies.find((c) => c.id === id)?.id) || null

  const chosen =
    exists(requestedId) ||
    exists(user.metadata.companyId) ||
    companies[0]?.id ||
    null

  return { companyId: chosen, isSuperadmin: true, companies }
}

export async function getComunicacionConfig(companyId: string | null) {
  if (!companyId) return null
  return prisma.whatsAppConfig.findUnique({ where: { companyId } })
}

export async function getFaqs(
  companyId: string | null,
  opts: { activeOnly?: boolean } = {}
) {
  if (!companyId) return []
  return prisma.faqItem.findMany({
    where: { companyId, ...(opts.activeOnly ? { activo: true } : {}) },
    orderBy: [{ orden: 'asc' }, { createdAt: 'asc' }],
  })
}

export interface TicketFilters {
  estado?: string
  q?: string
}

/** Lista de tickets para admin. companyId null (superadmin sin empresa) => todos. */
export async function listTicketsAdmin(
  companyId: string | null,
  isSuperadmin: boolean,
  filters: TicketFilters = {}
) {
  const where: Record<string, unknown> = {}
  if (companyId) where.companyId = companyId
  else if (!isSuperadmin) where.companyId = '__none__'

  if (filters.estado && filters.estado !== 'TODOS') where.estado = filters.estado
  if (filters.q) {
    where.OR = [
      { asunto: { contains: filters.q, mode: 'insensitive' } },
      { cliente: { nombre: { contains: filters.q, mode: 'insensitive' } } },
    ]
  }

  return prisma.supportTicket.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    include: {
      cliente: { select: { nombre: true, email: true } },
      company: { select: { name: true } },
      _count: { select: { mensajes: true } },
    },
    take: 200,
  })
}

export async function ticketStats(companyId: string | null, isSuperadmin: boolean) {
  const base: Record<string, unknown> = {}
  if (companyId) base.companyId = companyId
  else if (!isSuperadmin) base.companyId = '__none__'

  const [nuevos, enProceso, resueltos, total] = await Promise.all([
    prisma.supportTicket.count({ where: { ...base, estado: 'NUEVO' } }),
    prisma.supportTicket.count({ where: { ...base, estado: 'EN_PROCESO' } }),
    prisma.supportTicket.count({ where: { ...base, estado: 'RESUELTO' } }),
    prisma.supportTicket.count({ where: base }),
  ])
  return { nuevos, enProceso, resueltos, total }
}

/** Detalle de un ticket. includeInternal controla si se ven las notas internas. */
export async function getTicketDetail(id: string, includeInternal: boolean) {
  return prisma.supportTicket.findUnique({
    where: { id },
    include: {
      cliente: { select: { id: true, nombre: true, email: true, telefono: true } },
      company: { select: { id: true, name: true } },
      mensajes: {
        where: includeInternal ? {} : { esNotaInterna: false },
        orderBy: { createdAt: 'asc' },
      },
    },
  })
}

export async function listTicketsCliente(clienteId: string) {
  return prisma.supportTicket.findMany({
    where: { clienteId },
    orderBy: { updatedAt: 'desc' },
    include: { _count: { select: { mensajes: true } } },
    take: 100,
  })
}
