import { Ticket, Inbox, Loader, CheckCircle2 } from 'lucide-react'
import { ADMIN_ROLES } from '@/types'
import { requireRole } from '@/lib/auth/guards'
import { resolveCompanyContext, listTicketsAdmin, ticketStats } from '@/modules/soporte/queries'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { CompanySelector } from '@/components/admin/CompanySelector'
import { TicketsTable, type TicketRow } from '@/components/admin/TicketsTable'

export const dynamic = 'force-dynamic'

function fmt(d: Date): string {
  return new Date(d).toLocaleDateString('es-DO', { day: '2-digit', month: 'short' })
}

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string }>
}) {
  const user = await requireRole(ADMIN_ROLES)
  const sp = await searchParams
  const ctx = await resolveCompanyContext(user, sp.company)

  const [tickets, stats] = await Promise.all([
    listTicketsAdmin(ctx.companyId, ctx.isSuperadmin),
    ticketStats(ctx.companyId, ctx.isSuperadmin),
  ])

  const rows: TicketRow[] = tickets.map((t) => ({
    id: t.id,
    asunto: t.asunto,
    estado: t.estado,
    categoria: t.categoria,
    clienteNombre: t.cliente.nombre,
    empresaNombre: t.company.name,
    mensajes: t._count.mensajes,
    actualizado: fmt(t.updatedAt),
    showEmpresa: ctx.isSuperadmin && !ctx.companyId,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tickets de soporte"
        description="Gestiona las solicitudes de soporte de tus clientes."
        action={
          ctx.isSuperadmin ? (
            <CompanySelector companies={ctx.companies} current={ctx.companyId} />
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total" value={stats.total} icon={Ticket} accent="sky" />
        <StatCard label="Nuevos" value={stats.nuevos} icon={Inbox} accent="indigo" />
        <StatCard label="En proceso" value={stats.enProceso} icon={Loader} accent="amber" />
        <StatCard label="Resueltos" value={stats.resueltos} icon={CheckCircle2} accent="green" />
      </div>

      <TicketsTable tickets={rows} />
    </div>
  )
}
