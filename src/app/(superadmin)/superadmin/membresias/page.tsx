export const dynamic = 'force-dynamic'

import { requireRole } from '@/lib/auth/guards'
import { prisma } from '@/lib/prisma'
import { EstadoBadge } from '@/components/EstadoBadge'
import { MembershipAdminActions } from '@/components/admin/MembershipAdminActions'
import type { MembershipEstado } from '@/types'

function fmtDate(d: Date | null) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium' }).format(d)
}

const ESTADOS = ['PENDIENTE', 'PENDIENTE_PAGO', 'RECHAZADA', 'ACTIVA', 'VENCIDA', 'CANCELADA'] as const

const ESTADO_LABEL: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  PENDIENTE_PAGO: 'Pago por revisar',
  RECHAZADA: 'Rechazada',
  ACTIVA: 'Activa',
  VENCIDA: 'Vencida',
  CANCELADA: 'Cancelada',
}

export default async function SuperadminMembresiasPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; empresa?: string; q?: string }>
}) {
  await requireRole('SUPERADMIN')
  const { estado, empresa, q } = await searchParams

  const [companies, membresias] = await Promise.all([
    prisma.company.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
    prisma.membership.findMany({
      where: {
        ...(estado ? { estado: estado as MembershipEstado } : {}),
        cliente: {
          ...(empresa ? { companyId: empresa } : {}),
          ...(q ? { OR: [{ nombre: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }] } : {}),
        },
      },
      include: {
        plan: true,
        cliente: { include: { company: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Solicitudes de membresía</h1>
        <p className="text-slate-500">Gestiona el estado de las membresías de clientes.</p>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar cliente..."
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <select
          name="estado"
          defaultValue={estado ?? ''}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map((e) => (
            <option key={e} value={e}>{ESTADO_LABEL[e]}</option>
          ))}
        </select>
        <select
          name="empresa"
          defaultValue={empresa ?? ''}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <option value="">Todas las empresas</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
        >
          Filtrar
        </button>
      </form>

      <p className="text-sm text-slate-500">{membresias.length} resultado(s)</p>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">Cliente</th>
              <th className="px-4 py-3 text-left">Empresa</th>
              <th className="px-4 py-3 text-left">Plan</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-left">Inicio</th>
              <th className="px-4 py-3 text-left">Vencimiento</th>
              <th className="px-4 py-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {membresias.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">
                  <div>{m.cliente.nombre}</div>
                  <div className="text-xs text-slate-400">{m.cliente.email}</div>
                </td>
                <td className="px-4 py-3 text-slate-600">{m.cliente.company.name}</td>
                <td className="px-4 py-3 text-slate-600">{m.plan.nombre}</td>
                <td className="px-4 py-3">
                  <EstadoBadge estado={m.estado as MembershipEstado} />
                </td>
                <td className="px-4 py-3 text-slate-500">{fmtDate(m.fechaInicio)}</td>
                <td className="px-4 py-3 text-slate-500">{fmtDate(m.fechaVencimiento)}</td>
                <td className="px-4 py-3">
                  <MembershipAdminActions
                    membershipId={m.id}
                    estado={m.estado as MembershipEstado}
                    clienteId={m.clienteId}
                    planPrecio={Number(m.plan.precio)}
                    planLavados={m.plan.lavadosIncluidos}
                    planEsIlimitado={m.plan.esIlimitado}
                  />
                </td>
              </tr>
            ))}
            {membresias.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  No hay membresías.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
