import Link from 'next/link'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Settings2,
  Users,
} from 'lucide-react'
import { ADMIN_ROLES } from '@/types'
import { requireRole } from '@/lib/auth/guards'
import { companyFilter } from '@/modules/admin/queries'
import { prisma } from '@/lib/prisma'
import { getAgendaConfig, getCitasDia } from '@/modules/citas/queries'
import { etiquetaDia, hmEnTz, sumarDias, ymdEnTz } from '@/modules/citas/disponibilidad'
import { CitaAdminActions } from '@/components/citas/CitaAdminActions'
import { CitaEstadoBadge } from '@/components/citas/CitaEstadoBadge'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Citas' }

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/

export default async function CitasAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string }>
}) {
  const user = await requireRole(ADMIN_ROLES)
  const { fecha } = await searchParams
  // Superadmin: trabaja sobre su empresa ACTIVA (igual que el resto del panel).
  const companyId = companyFilter(user) ?? user.metadata.companyId ?? null

  if (!companyId) {
    return (
      <PageHeader
        title="Citas"
        description="Selecciona una empresa activa para ver su agenda."
      />
    )
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { zonaHoraria: true, idioma: true },
  })
  const tz = company?.zonaHoraria ?? 'America/Santo_Domingo'
  const idioma = company?.idioma ?? 'es-DO'

  const hoy = ymdEnTz(new Date(), tz)
  const ymd = fecha && YMD_RE.test(fecha) ? fecha : hoy

  const [cfg, citas] = await Promise.all([
    getAgendaConfig(companyId),
    getCitasDia(companyId, ymd, tz),
  ])

  const activas = citas.filter((c) => c.estado === 'PENDIENTE' || c.estado === 'CONFIRMADA')
  const pendientes = citas.filter((c) => c.estado === 'PENDIENTE')

  return (
    <div className="space-y-6">
      {/* Cabecera + configuración */}
      <PageHeader
        title="Citas"
        description={
          cfg?.activa
            ? `Turnos de ${cfg.duracionMin} min · máx. ${cfg.maxPorSlot} por turno${cfg.maxPorDia > 0 ? ` · máx. ${cfg.maxPorDia} por día` : ''}`
            : 'La agenda está apagada: los clientes no pueden reservar.'
        }
        action={
          <Button asChild variant={cfg?.activa ? 'outline' : 'default'} size="sm" className="gap-1.5">
            <Link href="/admin/citas/configuracion">
              <Settings2 className="h-4 w-4" />
              {cfg?.activa ? 'Configuración' : 'Activar agenda'}
            </Link>
          </Button>
        }
      />

      {/* Navegación por día */}
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" size="icon-sm" aria-label="Día anterior">
          <Link href={`/admin/citas?fecha=${sumarDias(ymd, -1)}`}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <span className="min-w-40 rounded-xl border border-border/70 bg-card px-4 py-2 text-center text-sm font-semibold capitalize text-foreground">
          {etiquetaDia(ymd, tz, idioma)}
          {ymd === hoy && <span className="ml-1.5 text-xs font-medium text-primary">· hoy</span>}
        </span>
        <Button asChild variant="outline" size="icon-sm" aria-label="Día siguiente">
          <Link href={`/admin/citas?fecha=${sumarDias(ymd, 1)}`}>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
        {ymd !== hoy && (
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/citas">Volver a hoy</Link>
          </Button>
        )}
      </div>

      {/* Resumen del día */}
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Citas del día', valor: citas.length },
          { label: 'Activas', valor: activas.length },
          { label: 'Por confirmar', valor: pendientes.length },
          {
            label: 'Cupo del día',
            valor: cfg && cfg.maxPorDia > 0 ? `${activas.length}/${cfg.maxPorDia}` : 'Sin límite',
          },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border/70 bg-card p-4">
            <dt className="text-xs text-muted-foreground">{s.label}</dt>
            <dd className="mt-1 text-xl font-bold tabular-nums text-foreground">{s.valor}</dd>
          </div>
        ))}
      </dl>

      {/* Agenda del día */}
      {citas.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-8 text-center text-sm text-muted-foreground">
          <CalendarDays className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
          Sin citas para este día.
        </p>
      ) : (
        <div className="space-y-3">
          {citas.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl border border-border/70 bg-card p-4 shadow-card"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="rounded-xl bg-muted/70 px-3 py-2 text-sm font-bold tabular-nums text-foreground">
                    {hmEnTz(c.inicio, tz)}
                  </span>
                  <div className="min-w-0">
                    <Link
                      href={`/admin/clientes/${c.cliente.id}`}
                      className="flex items-center gap-1.5 font-semibold text-foreground hover:underline"
                    >
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {c.cliente.nombre}
                    </Link>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {c.cliente.telefono && <span>{c.cliente.telefono} · </span>}
                      {c.vehiculo && (
                        <span>
                          {c.vehiculo.marca} {c.vehiculo.modelo} {c.vehiculo.color} ·{' '}
                        </span>
                      )}
                      {c.servicio ?? 'Sin detalle'}
                    </p>
                    {c.estado === 'CANCELADA' && c.motivoCancelacion && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Motivo: {c.motivoCancelacion} ({c.canceladaPor === 'CLIENTE' ? 'cliente' : 'negocio'})
                      </p>
                    )}
                    {c.estado === 'COMPLETADA' && c.atendidaPor?.name && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Atendida por {c.atendidaPor.name}
                      </p>
                    )}
                  </div>
                </div>
                <CitaEstadoBadge estado={c.estado} />
              </div>
              <div className="mt-3 border-t border-border/50 pt-3 empty:hidden">
                <CitaAdminActions
                  citaId={c.id}
                  estado={c.estado}
                  clienteNombre={c.cliente.nombre}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
