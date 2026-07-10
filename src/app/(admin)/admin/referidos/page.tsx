import {
  Users,
  Gift,
  Trophy,
  MousePointerClick,
  BadgeCheck,
  DollarSign,
  ShieldAlert,
  Activity,
  Megaphone,
  Share2,
} from 'lucide-react'
import { requireRole } from '@/lib/auth/guards'
import { ADMIN_ROLES } from '@/types'
import { companyFilter } from '@/modules/admin/queries'
import { getRegionalPrefs } from '@/modules/empresas/regional'
import { formatMoney } from '@/lib/format'
import { prisma } from '@/lib/prisma'
import {
  getEmpresaReferidosDashboard,
  type EmpresaReferidosDashboard,
} from '@/modules/referidos/actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ReglaRecompensaForm } from '@/components/admin/ReglaRecompensaForm'
import { ReglaRecompensaToggle } from '@/components/admin/ReglaRecompensaToggle'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const TIPO_LABEL: Record<string, string> = {
  LAVADOS_GRATIS: 'Usos gratis',
  DESCUENTO_PORCENTAJE: 'Descuento %',
  DESCUENTO_MONTO: 'Descuento RD$',
}

const CANAL_LABEL: Record<string, string> = {
  native: 'Compartir nativo',
  copy: 'Enlace copiado',
  qr: 'Código QR',
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  facebook: 'Facebook',
  x: 'X (Twitter)',
  email: 'Email',
  sms: 'SMS',
  directo: 'Directo',
}

/** Barra horizontal simple, renderizada en servidor. */
function Bar({ value, max, className }: { value: number; max: number; className?: string }) {
  const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0
  return (
    <div className="h-2 w-full rounded-full bg-slate-100">
      <div
        className={cn('h-2 rounded-full bg-sky-500', className)}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export default async function ReferidosPage() {
  const user = await requireRole(ADMIN_ROLES)
  const companyId = companyFilter(user)
  const isSuperadmin = user.metadata.role === 'SUPERADMIN'
  const where = companyId ? { companyId } : {}
  const prefs = await getRegionalPrefs(companyId)
  const fmtMoney = (n: number) => formatMoney(n, prefs)

  let dash: EmpresaReferidosDashboard | null = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let reglas: any[] = []
  // El superadmin no tiene empresa propia: debe elegir a cuál aplica la regla.
  let companies: { id: string; name: string }[] = []
  try {
    ;[dash, reglas, companies] = await Promise.all([
      getEmpresaReferidosDashboard(companyId ?? null),
      prisma.reglaRecompensa.findMany({
        where,
        orderBy: { valorCondicion: 'asc' },
        include: { company: { select: { name: true } } },
      }),
      isSuperadmin
        ? prisma.company.findMany({
            where: { isActive: true },
            select: { id: true, name: true },
            orderBy: { name: 'asc' },
          })
        : Promise.resolve([]),
    ])
  } catch (e) {
    console.error('[admin-referidos]', e)
  }

  if (!dash) {
    return (
      <p className="text-slate-600">
        No pudimos cargar el programa de referidos. Intenta más tarde.
      </p>
    )
  }

  const { kpis } = dash
  const maxDiario = Math.max(...dash.registrosDiarios.map((d) => d.registros), 1)
  const maxMensual = Math.max(
    ...dash.evolucionMensual.map((m) => Math.max(m.registros, m.membresias)),
    1
  )
  const maxCanal = Math.max(
    ...dash.porCanal.map((c) => c.clicks + c.compartidos),
    1
  )

  const kpiCards = [
    { label: 'Compartidos', valor: String(kpis.compartidos), icon: Share2, color: 'bg-sky-100 text-sky-600' },
    { label: 'Clics', valor: String(kpis.clicks), icon: MousePointerClick, color: 'bg-violet-100 text-violet-600' },
    { label: 'Registros', valor: String(kpis.registros), icon: Users, color: 'bg-amber-100 text-amber-600' },
    { label: 'Membresías por referidos', valor: String(kpis.membresias), icon: BadgeCheck, color: 'bg-green-100 text-green-600' },
    { label: 'Conversión (clic → membresía)', valor: `${kpis.conversionPct}%`, icon: Trophy, color: 'bg-emerald-100 text-emerald-600' },
    { label: 'Ingresos por referidos', valor: fmtMoney(kpis.ingresosReferidos), icon: DollarSign, color: 'bg-teal-100 text-teal-600' },
    { label: 'Recompensas entregadas', valor: String(kpis.recompensasEntregadas), icon: Gift, color: 'bg-rose-100 text-rose-600' },
    { label: 'Registros sospechosos', valor: String(kpis.sospechosos), icon: ShieldAlert, color: 'bg-red-100 text-red-600' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Referidos</h1>
        <p className="text-slate-500">
          Rendimiento del programa de referidos y reglas de recompensa.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpiCards.map((k) => (
          <Card key={k.label}>
            <CardContent className="flex items-center gap-3 py-5">
              <div className={cn('rounded-lg p-2', k.color)}>
                <k.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xl font-bold text-slate-900">{k.valor}</p>
                <p className="text-xs text-slate-500">{k.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Embajadores activos/inactivos */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-6 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4 text-emerald-500" />
            <span className="font-semibold text-slate-900">{kpis.embajadoresActivos}</span>
            <span className="text-slate-500">embajadores activos (30 días)</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4 text-slate-300" />
            <span className="font-semibold text-slate-900">{kpis.embajadoresInactivos}</span>
            <span className="text-slate-500">inactivos</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Evolución mensual */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Evolución mensual</CardTitle>
          </CardHeader>
          <CardContent>
            {dash.evolucionMensual.length === 0 ? (
              <p className="text-sm text-slate-500">Sin datos todavía.</p>
            ) : (
              <div className="space-y-3">
                {dash.evolucionMensual.map((m) => (
                  <div key={m.mes} className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span className="font-medium text-slate-700">{m.mes}</span>
                      <span>
                        {m.registros} registros · {m.membresias} membresías
                      </span>
                    </div>
                    <Bar value={m.registros} max={maxMensual} className="bg-amber-400" />
                    <Bar value={m.membresias} max={maxMensual} className="bg-green-500" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Registros diarios */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Registros diarios (últimos 30 días)</CardTitle>
          </CardHeader>
          <CardContent>
            {dash.registrosDiarios.length === 0 ? (
              <p className="text-sm text-slate-500">Sin registros en los últimos 30 días.</p>
            ) : (
              <div className="space-y-2">
                {dash.registrosDiarios.map((d) => (
                  <div key={d.dia} className="flex items-center gap-3 text-xs">
                    <span className="w-16 shrink-0 text-slate-500">{d.dia}</span>
                    <Bar value={d.registros} max={maxDiario} />
                    <span className="w-6 shrink-0 text-right font-medium text-slate-700">
                      {d.registros}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Por canal */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rendimiento por canal</CardTitle>
          </CardHeader>
          <CardContent>
            {dash.porCanal.length === 0 ? (
              <p className="text-sm text-slate-500">
                Aún no hay actividad de compartir/clics.
              </p>
            ) : (
              <div className="space-y-2">
                {dash.porCanal.map((c) => (
                  <div key={c.canal} className="flex items-center gap-3 text-xs">
                    <span className="w-28 shrink-0 text-slate-600">
                      {CANAL_LABEL[c.canal] ?? c.canal}
                    </span>
                    <Bar value={c.clicks + c.compartidos} max={maxCanal} className="bg-violet-500" />
                    <span className="w-28 shrink-0 text-right text-slate-500">
                      {c.clicks} clics · {c.compartidos} shares
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Por campaña */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Megaphone className="h-4 w-4 text-sky-500" />
              Clics por campaña
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dash.porCampana.length === 0 ? (
              <p className="text-sm text-slate-500">
                Sin campañas registradas. Agrega <code>?utm_campaign=nombre</code> a
                los enlaces /r/ para medirlas.
              </p>
            ) : (
              <ul className="space-y-2">
                {dash.porCampana.map((c) => (
                  <li key={c.campana} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{c.campana}</span>
                    <Badge variant="secondary">{c.clicks} clics</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Top embajadores */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top embajadores (por puntos)</CardTitle>
          </CardHeader>
          <CardContent>
            {dash.topEmbajadores.length === 0 ? (
              <p className="text-sm text-slate-500">Aún no hay embajadores con actividad.</p>
            ) : (
              <ul className="space-y-2">
                {dash.topEmbajadores.map((t, i) => (
                  <li key={t.nombre + i} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-slate-700">
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tabular-nums ${
                          ['bg-amber-400 text-amber-950', 'bg-slate-300 text-slate-700', 'bg-orange-300 text-orange-900'][i] ??
                          'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {i + 1}
                      </span>
                      {t.nombre}
                    </span>
                    <span className="text-xs text-slate-500">
                      {t.puntos} pts · {t.registros} reg · {t.membresias} memb
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Top conversión */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mayor conversión (mín. 5 clics)</CardTitle>
          </CardHeader>
          <CardContent>
            {dash.topConversion.length === 0 ? (
              <p className="text-sm text-slate-500">
                Se mostrará cuando haya embajadores con al menos 5 clics.
              </p>
            ) : (
              <ul className="space-y-2">
                {dash.topConversion.map((t, i) => (
                  <li key={t.nombre + i} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{t.nombre}</span>
                    <span className="text-xs text-slate-500">
                      {t.pct}% ({t.membresias}/{t.clicks})
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reglas de recompensa */}
      <Card>
        <CardHeader>
          <CardTitle>Reglas de recompensa</CardTitle>
          <p className="text-sm text-slate-500">
            {isSuperadmin
              ? 'Define los premios por referidos para cada empresa. Elige la empresa a la que aplica cada regla.'
              : 'Define los premios que reciben tus clientes al referir más personas.'}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {reglas.length > 0 && (
            <div className="space-y-2">
              {reglas.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 p-3"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-slate-900">{r.nombre}</p>
                      {isSuperadmin && r.company?.name && (
                        <Badge variant="secondary" className="text-xs">
                          {r.company.name}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {r.valorCondicion} referidos completados → {Number(r.valorRecompensa)}{' '}
                      {TIPO_LABEL[r.tipoRecompensa]}
                    </p>
                  </div>
                  <ReglaRecompensaToggle id={r.id} activo={r.activo} />
                </div>
              ))}
            </div>
          )}
          <ReglaRecompensaForm companies={isSuperadmin ? companies : undefined} />
        </CardContent>
      </Card>
    </div>
  )
}
