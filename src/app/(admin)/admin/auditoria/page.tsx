export const dynamic = 'force-dynamic'

import { requireSuperAdmin } from '@/lib/auth/guards'
import { listAuditLogs } from '@/modules/empresas/queries'
import { listAllCompanies } from '@/modules/empresas/queries'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const PAGE_SIZE = 50

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ companyId?: string; event?: string; page?: string }>
}) {
  await requireSuperAdmin()
  const { companyId, event, page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam ?? '1') || 1)

  const { items: companies } = await listAllCompanies()
  const { items: logs, total } = await listAuditLogs({ companyId, event, page, pageSize: PAGE_SIZE })

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Auditoría</h1>

      <form method="GET" className="flex flex-wrap items-center gap-3">
        <select
          name="companyId"
          defaultValue={companyId ?? ''}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Todas las empresas</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input
          name="event"
          defaultValue={event ?? ''}
          placeholder="Filtrar por evento..."
          className="h-9 rounded-md border border-input bg-background px-3 text-sm w-56"
        />
        <button type="submit" className="inline-flex h-9 items-center rounded-md border px-4 text-sm hover:bg-accent">
          Filtrar
        </button>
      </form>

      <p className="text-sm text-muted-foreground">
        {total} registros · página {page} de {Math.max(1, Math.ceil(total / PAGE_SIZE))}
      </p>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Evento</TableHead>
              <TableHead>Entidad</TableHead>
              <TableHead>Actor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Sin registros de auditoría.
                </TableCell>
              </TableRow>
            )}
            {logs.map((log) => {
              const l = log as Record<string, unknown> & {
                user?: { email: string; name: string }
                company?: { name: string }
                createdAt: string
              }
              return (
                <TableRow key={String(l.id)}>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(l.createdAt).toLocaleString('es-DO')}
                  </TableCell>
                  <TableCell className="text-sm">{l.company?.name ?? ''}</TableCell>
                  <TableCell className="text-xs font-mono">{String(l.event)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {String(l.entityType)} {String(l.entityId).slice(0, 8)}…
                  </TableCell>
                  <TableCell className="text-xs">{l.user?.email ?? ''}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between pt-2">
          {page > 1 ? (
            <a
              href={`?${new URLSearchParams({ ...(companyId ? { companyId } : {}), ...(event ? { event } : {}), page: String(page - 1) })}`}
              className="inline-flex h-8 items-center rounded-md border px-3 text-sm hover:bg-accent transition-colors"
            >
              ← Anterior
            </a>
          ) : <span />}
          {page * PAGE_SIZE < total && (
            <a
              href={`?${new URLSearchParams({ ...(companyId ? { companyId } : {}), ...(event ? { event } : {}), page: String(page + 1) })}`}
              className="inline-flex h-8 items-center rounded-md border px-3 text-sm hover:bg-accent transition-colors"
            >
              Siguiente →
            </a>
          )}
        </div>
      )}
    </div>
  )
}
