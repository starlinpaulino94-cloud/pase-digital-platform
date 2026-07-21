import { requireRole } from '@/lib/auth/guards'
import { ADMIN_ROLES } from '@/types'
import { prisma } from '@/lib/prisma'
import Form from 'next/form'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { CancelarRegaloAdminButton } from '@/components/regalos/CancelarRegaloAdminButton'
import { RegalosConfigCard } from '@/components/regalos/RegalosConfigCard'
import { getRegalosConfig } from '@/modules/regalos/config'
import {
  getRegalosAdmin,
  TIPO_REGALO_LABEL,
  ESTADO_REGALO_LABEL,
} from '@/modules/regalos/queries'
import { HeartHandshake } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Regalos P2P' }

const ESTADO_CHIP: Record<string, string> = {
  PENDIENTE: 'bg-warning/15 text-warning-foreground',
  ACEPTADO: 'bg-success/15 text-success',
  RECHAZADO: 'bg-destructive/10 text-destructive',
  EXPIRADO: 'bg-muted text-muted-foreground',
  CANCELADO: 'bg-destructive/10 text-destructive',
}

/**
 * Regalos P2P · Fase R4 — vista del negocio: quién regaló qué a quién, salud
 * del programa (KPIs) y cancelación de pendientes (soporte/anti-abuso).
 */
export default async function RegalosAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const user = await requireRole(ADMIN_ROLES)
  const companyId = user.metadata.companyId as string | undefined
  const sp = await searchParams

  if (!companyId) {
    return <p className="text-muted-foreground">Tu cuenta no está vinculada a una empresa.</p>
  }

  const empresa = await prisma.company.findUnique({
    where: { id: companyId },
    select: { zonaHoraria: true },
  })
  const timeZone = empresa?.zonaHoraria || 'America/Santo_Domingo'
  const fmtFecha = (d: Date) =>
    new Intl.DateTimeFormat('es-DO', { timeZone, dateStyle: 'medium', timeStyle: 'short' }).format(d)

  const hayFiltro = Boolean(sp.estado || sp.tipo)
  const [{ items, kpis, truncado }, config] = await Promise.all([
    getRegalosAdmin(companyId, { estado: sp.estado, tipo: sp.tipo }),
    getRegalosConfig(companyId),
  ])

  const tarjetas = [
    { label: 'Regalos totales', valor: String(kpis.total) },
    { label: 'Pendientes', valor: String(kpis.pendientes) },
    { label: 'Aceptados', valor: String(kpis.aceptados) },
    {
      label: 'Tasa de aceptación',
      valor: kpis.tasaAceptacion == null ? '—' : `${kpis.tasaAceptacion}%`,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Regalos entre clientes"
        description="Transferencias de usos y regalos pagados entre tus clientes: quién envió qué a quién, en qué quedó cada uno, y cancelación de pendientes si hace falta."
      />

      {/* KPIs */}
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tarjetas.map((k) => (
          <div key={k.label} className="rounded-2xl border border-border/70 bg-card p-4">
            <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{k.label}</dt>
            <dd className="mt-1 truncate text-lg font-bold tabular-nums text-foreground">{k.valor}</dd>
          </div>
        ))}
      </dl>

      {/* Configuración del programa */}
      <RegalosConfigCard config={config} />

      {/* Filtros */}
      <Form
        action="/admin/regalos"
        className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/70 bg-card p-4"
      >
        <select
          name="tipo"
          defaultValue={sp.tipo ?? ''}
          className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
        >
          <option value="">Todos los tipos</option>
          {Object.entries(TIPO_REGALO_LABEL).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select
          name="estado"
          defaultValue={sp.estado ?? ''}
          className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
        >
          <option value="">Todos los estados</option>
          {Object.entries(ESTADO_REGALO_LABEL).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <Button type="submit" variant="secondary">Aplicar</Button>
        {hayFiltro && (
          <Button asChild variant="ghost">
            <a href="/admin/regalos">Limpiar</a>
          </Button>
        )}
        {truncado && (
          <p className="ml-auto text-xs text-muted-foreground">
            Mostrando los {items.length} más recientes.
          </p>
        )}
      </Form>

      {items.length === 0 ? (
        <EmptyState
          icon={<HeartHandshake className="h-7 w-7" />}
          title={hayFiltro ? 'Sin regalos para el filtro' : 'Aún no hay regalos entre clientes'}
          description="Cuando un cliente transfiera usos o regale una promoción o membresía a otro, aparecerá aquí con todo su recorrido."
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border/70 bg-card">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Regalo</th>
                <th className="px-4 py-3 font-semibold">Tipo</th>
                <th className="px-4 py-3 font-semibold">De</th>
                <th className="px-4 py-3 font-semibold">Para</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Enviado</th>
                <th className="px-4 py-3 font-semibold">Expira</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {items.map((r) => (
                <tr key={r.id} className="align-middle">
                  <td className="max-w-56 px-4 py-3">
                    <p className="truncate font-medium text-foreground">{r.beneficio}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {r.tipo === 'TRANSFERENCIA_USOS'
                        ? `${r.usos} uso${r.usos !== 1 ? 's' : ''}`
                        : ''}
                      {r.mensaje ? `${r.tipo === 'TRANSFERENCIA_USOS' ? ' · ' : ''}“${r.mensaje}”` : ''}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {TIPO_REGALO_LABEL[r.tipo] ?? r.tipo}
                    </span>
                  </td>
                  <td className="max-w-40 truncate px-4 py-3 text-foreground">{r.remitente}</td>
                  <td className="max-w-40 px-4 py-3">
                    <p className="truncate text-foreground">{r.destinatario}</p>
                    {r.sinCuenta && (
                      <p className="text-[11px] text-muted-foreground">aún sin cuenta</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${ESTADO_CHIP[r.estado] ?? 'bg-muted text-muted-foreground'}`}
                    >
                      {ESTADO_REGALO_LABEL[r.estado] ?? r.estado}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                    {fmtFecha(r.createdAt)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                    {r.estado === 'PENDIENTE' ? fmtFecha(r.expiraAt) : r.resueltoAt ? fmtFecha(r.resueltoAt) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.estado === 'PENDIENTE' && (
                      <CancelarRegaloAdminButton
                        regaloId={r.id}
                        descripcion={`${r.beneficio} de ${r.remitente} para ${r.destinatario}`}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
