import { requireRole } from '@/lib/auth/guards'
import { ADMIN_ROLES } from '@/types'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { FacturaPrintDialog } from '@/components/facturas/FacturaPrintDialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Form from 'next/form'
import { ReceiptText, Search } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Facturas' }

const fmtRD = (n: number) => `RD$${n.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`
const fmtFecha = (d: Date) =>
  new Intl.DateTimeFormat('es-DO', {
    timeZone: 'America/Santo_Domingo',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d)

const ESTADO_CHIP: Record<string, string> = {
  APPLIED: 'bg-success/15 text-success',
  CANCELLED: 'bg-destructive/10 text-destructive',
  REVERTED: 'bg-warning/15 text-warning-foreground',
}
const ESTADO_LABEL: Record<string, string> = {
  APPLIED: 'Pagada',
  CANCELLED: 'Cancelada',
  REVERTED: 'Revertida',
}

/**
 * Historial permanente de facturas (ventas de caja): búsqueda por número de
 * factura, código TX, referencia o cliente; vista previa y reimpresión sin
 * generar documentos nuevos. Nada se elimina — solo cambian estados.
 */
export default async function FacturasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const user = await requireRole(ADMIN_ROLES)
  const companyId = user.metadata.companyId as string | undefined
  const { q = '' } = await searchParams
  const term = q.trim()

  const facturas = await prisma.transaction.findMany({
    where: {
      ...(companyId ? { companyId } : {}),
      tipo: 'SALE',
      ...(term
        ? {
            OR: [
              { codigo: { contains: term.toUpperCase() } },
              { ticketNumero: { contains: term.toUpperCase() } },
              { cliente: { nombre: { contains: term, mode: 'insensitive' } } },
            ],
          }
        : {}),
    },
    include: {
      cliente: { select: { nombre: true } },
      sucursal: { select: { nombre: true } },
      empleado: { select: { name: true } },
      _count: { select: { impresiones: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Facturas"
        description="Historial permanente de ventas: consulta, vista previa y reimpresión (58/80 mm, Carta o A4)."
      />

      <Form action="/admin/facturas" className="flex max-w-lg gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={q} placeholder="Nº de factura, código TX o cliente…" className="pl-9" />
        </div>
        <Button type="submit" variant="secondary">Buscar</Button>
      </Form>

      {facturas.length === 0 ? (
        <EmptyState
          icon={<ReceiptText className="h-7 w-7" />}
          title={term ? `Sin facturas para “${term}”` : 'Aún no hay facturas'}
          description="Cada cobro de caja genera su factura con número y código únicos, y queda aquí para siempre."
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border/70 bg-card">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Factura</th>
                <th className="px-4 py-3 font-semibold">Cliente</th>
                <th className="px-4 py-3 font-semibold">Detalle</th>
                <th className="px-4 py-3 font-semibold">Empleado</th>
                <th className="px-4 py-3 text-right font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Fecha</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {facturas.map((f) => {
                const snap = (f.snapshot ?? {}) as { detalle?: string; empleado?: string }
                return (
                  <tr key={f.id} className="align-middle">
                    <td className="px-4 py-3">
                      <p className="font-mono font-semibold text-foreground">{f.ticketNumero}</p>
                      <p className="font-mono text-xs text-muted-foreground">{f.codigo}</p>
                    </td>
                    <td className="px-4 py-3 text-foreground">{f.cliente?.nombre ?? '—'}</td>
                    <td className="max-w-52 px-4 py-3">
                      <p className="truncate text-foreground">{snap.detalle ?? '—'}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {f.metodoCobro ?? ''}
                        {f.sucursal ? ` · ${f.sucursal.nombre}` : ''}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {f.empleado?.name ?? snap.empleado ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-foreground">
                      {f.monto != null ? fmtRD(Number(f.monto)) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${ESTADO_CHIP[f.estado] ?? 'bg-muted text-muted-foreground'}`}
                      >
                        {ESTADO_LABEL[f.estado] ?? f.estado}
                      </span>
                      {f._count.impresiones > 0 && (
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {f._count.impresiones} impresión{f._count.impresiones !== 1 ? 'es' : ''}
                        </p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                      {fmtFecha(f.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <FacturaPrintDialog
                        transactionId={f.id}
                        yaImpresa={f._count.impresiones > 0}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
