import {
  Share2,
  MousePointerClick,
  UserPlus,
  BadgeCheck,
  Gift,
  Trophy,
  CheckCircle2,
  Clock,
  Medal,
} from 'lucide-react'
import { requireRole } from '@/lib/auth/guards'
import { prisma } from '@/lib/prisma'
import { absoluteUrl } from '@/lib/site'
import {
  ensureCodigoCorto,
  calcularNivel,
  calcularLogros,
  PUNTOS,
} from '@/lib/referidos'
import {
  getReferidosDashboard,
  type ReferidosDashboard,
} from '@/modules/referidos/actions'
import { ReferralShareCard } from '@/components/cliente/ReferralShareCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

function fmtDate(d: Date) {
  return new Intl.DateTimeFormat('es-DO', { timeZone: 'America/Santo_Domingo', dateStyle: 'medium' }).format(d)
}

const ESTADO_HISTORIAL = {
  REGISTRADO: {
    label: 'Registrado',
    icon: Clock,
    clase: 'bg-muted text-foreground hover:bg-muted',
  },
  MEMBRESIA_ACTIVA: {
    label: 'Membresía activa',
    icon: CheckCircle2,
    clase: 'bg-success/15 text-success hover:bg-success/15',
  },
  RECOMPENSA_ENTREGADA: {
    label: 'Recompensa entregada',
    icon: Gift,
    clase: 'bg-warning/15 text-warning-foreground hover:bg-warning/15',
  },
} as const

/* Top 3 del ranking: círculos oro / plata / bronce (sin emojis). */
const MEDALLA_CLASE = [
  'bg-warning text-warning-foreground',
  'bg-muted-foreground/30 text-foreground',
  'bg-warning/40 text-warning-foreground',
]

function RankBadge({ posicion }: { posicion: number }) {
  const medalla = MEDALLA_CLASE[posicion - 1]
  return (
    <span
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tabular-nums ${
        medalla ?? 'bg-muted text-muted-foreground'
      }`}
    >
      {posicion}
    </span>
  )
}

function ErrorReferidos({ detalle }: { detalle: string }) {
  return (
    <div className="space-y-2">
      <p className="text-muted-foreground">
        No pudimos cargar tu panel de referidos. Intenta de nuevo en unos momentos.
      </p>
      {detalle && (
        <details className="text-left">
          <summary className="cursor-pointer text-xs text-muted-foreground">
            Detalle técnico
          </summary>
          <pre className="mt-2 overflow-x-auto rounded bg-muted p-3 text-xs text-muted-foreground">
            {detalle}
          </pre>
        </details>
      )}
    </div>
  )
}

export default async function ReferidosClientePage() {
  const user = await requireRole('CLIENTE')

  if (!user.metadata.clienteId) {
    return (
      <p className="text-muted-foreground">
        Tu cuenta no está asociada a una empresa todavía.
      </p>
    )
  }

  let cliente: {
    id: string
    nombre: string
    companyId: string
    company: { name: string; slug: string }
  } | null = null
  let errorDetalle = ''

  try {
    cliente = await prisma.cliente.findUnique({
      where: { id: user.metadata.clienteId },
      select: {
        id: true,
        nombre: true,
        companyId: true,
        company: { select: { name: true, slug: true } },
      },
    })
  } catch (e) {
    errorDetalle = e instanceof Error ? e.message : String(e)
    console.error('[cliente-referidos] cliente', errorDetalle)
  }

  if (errorDetalle) return <ErrorReferidos detalle={errorDetalle} />
  if (!cliente) {
    return <p className="text-muted-foreground">No se encontró tu información.</p>
  }

  let codigoCorto = ''
  let dashboard: ReferidosDashboard | null = null
  try {
    ;[codigoCorto, dashboard] = await Promise.all([
      ensureCodigoCorto(cliente.id),
      getReferidosDashboard(cliente.id, cliente.companyId, user.supabaseId),
    ])
  } catch (e) {
    errorDetalle = e instanceof Error ? e.message : String(e)
    console.error('[cliente-referidos] dashboard', errorDetalle)
  }

  if (!dashboard) {
    return <ErrorReferidos detalle={errorDetalle} />
  }

  const shareUrl = absoluteUrl(`/r/${codigoCorto}`)
  const { stats, historial, ranking, miPosicion, retos, global } = dashboard
  const { nivel, siguiente, progresoPct } = calcularNivel(stats.puntos)
  const logros = calcularLogros({
    registros: stats.registros,
    membresias: stats.membresias,
    clicks: stats.clicks,
    recompensas: stats.recompensas,
    nivelId: nivel.id,
  })

  const statCards = [
    { label: 'Compartidos', valor: stats.compartidos, icon: Share2, color: 'bg-info/10 text-primary' },
    { label: 'Clics', valor: stats.clicks, icon: MousePointerClick, color: 'bg-primary/10 text-primary' },
    { label: 'Registros', valor: stats.registros, icon: UserPlus, color: 'bg-warning/15 text-warning-foreground' },
    { label: 'Membresías', valor: stats.membresias, icon: BadgeCheck, color: 'bg-success/15 text-success' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Refiere y gana</h1>
        <p className="text-muted-foreground">
          Comparte tu enlace de {cliente.company.name}, gana puntos y sube de
          nivel con cada amigo que se una.
        </p>
      </div>

      {/* Enlace + compartir + QR */}
      <Card className="border-info/30 bg-info/10">
        <CardContent className="space-y-3 py-5">
          <p className="text-sm font-medium text-info">Tu enlace de referido</p>
          <ReferralShareCard url={shareUrl} companyName={cliente.company.name} />
        </CardContent>
      </Card>

      {/* Nivel de embajador */}
      <Card>
        <CardContent className="py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-warning/10 text-warning-foreground ring-1 ring-warning/30">
                <Trophy className="h-6 w-6" />
              </span>
              <div>
                <p className="font-semibold text-foreground">{nivel.nombre}</p>
                <p className="text-sm text-muted-foreground">{nivel.descripcion}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">{stats.puntos}</p>
              <p className="text-xs text-muted-foreground">puntos</p>
            </div>
          </div>
          {siguiente ? (
            <div className="mt-4 space-y-1.5">
              <Progress value={progresoPct} />
              <p className="text-xs text-muted-foreground">
                {siguiente.minPuntos - stats.puntos} puntos para{' '}
                <strong>{siguiente.nombre}</strong>
              </p>
            </div>
          ) : (
            <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-warning-foreground">
              <Trophy className="h-4 w-4" /> Nivel máximo alcanzado. ¡Eres leyenda
              en {cliente.company.name}!
            </p>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Compartir +{PUNTOS.SHARE} · Clic +{PUNTOS.CLICK} · Registro +{PUNTOS.REGISTRO} · Membresía +{PUNTOS.MEMBRESIA}
          </p>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 py-5">
              <div className={cn('rounded-lg p-2', s.color)}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{s.valor}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Embudo de conversión */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tu conversión</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center justify-center gap-2 text-center text-sm">
            <div className="rounded-lg bg-primary/10 px-4 py-2">
              <p className="text-lg font-bold text-primary">{stats.clicks}</p>
              <p className="text-xs text-muted-foreground">clics</p>
            </div>
            <span className="text-muted-foreground/40">→</span>
            <div className="rounded-lg bg-warning/15 px-4 py-2">
              <p className="text-lg font-bold text-warning-foreground">{stats.registros}</p>
              <p className="text-xs text-muted-foreground">registros</p>
            </div>
            <span className="text-muted-foreground/40">→</span>
            <div className="rounded-lg bg-success/10 px-4 py-2">
              <p className="text-lg font-bold text-success">{stats.membresias}</p>
              <p className="text-xs text-muted-foreground">membresías</p>
            </div>
            <span className="text-muted-foreground/40">=</span>
            <div className="rounded-lg bg-info/10 px-4 py-2">
              <p className="text-lg font-bold text-info">{stats.conversionPct}%</p>
              <p className="text-xs text-muted-foreground">conversión</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Retos activos de la empresa */}
      {retos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Gift className="h-4 w-4 text-destructive" />
              Retos activos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {retos.map((r) => {
              const pct = Math.min(100, Math.round((r.progreso / r.meta) * 100))
              const completado = r.progreso >= r.meta
              return (
                <div key={r.id} className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <p className="inline-flex items-center gap-1.5 font-medium text-foreground">
                      {r.nombre}
                      {completado && (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      )}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {r.progreso}/{r.meta} membresías · gana {r.recompensa}
                    </span>
                  </div>
                  <Progress value={pct} />
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Centro global MembeGo */}
      <Card className="border-primary/20 bg-primary/10">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 py-5">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🌐</span>
            <div>
              <p className="font-semibold text-foreground">Centro MembeGo</p>
              <p className="max-w-md text-sm text-muted-foreground">
                Tu mismo enlace también gana: si alguien se registra en{' '}
                <strong>cualquier otra empresa</strong> de la plataforma, sumas
                puntos MembeGo.
              </p>
            </div>
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{global.puntos}</p>
              <p className="text-xs text-muted-foreground">puntos MembeGo</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{global.registros}</p>
              <p className="text-xs text-muted-foreground">registros</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{global.membresias}</p>
              <p className="text-xs text-muted-foreground">membresías</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Ranking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4 text-warning-foreground" />
              Top embajadores de {cliente.company.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ranking.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aún no hay actividad. ¡Sé el primero del ranking!
              </p>
            ) : (
              <ul className="space-y-2">
                {ranking.map((r) => (
                  <li
                    key={r.posicion}
                    className={cn(
                      'flex items-center justify-between rounded-lg px-3 py-2 text-sm',
                      r.esYo ? 'bg-info/10 font-semibold text-info' : 'text-foreground'
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <RankBadge posicion={r.posicion} />
                      {r.nombre}
                      {r.esYo && <Badge variant="secondary">Tú</Badge>}
                    </span>
                    <span className="font-medium">{r.puntos} pts</span>
                  </li>
                ))}
              </ul>
            )}
            {miPosicion != null && miPosicion > 5 && (
              <p className="mt-3 text-xs text-muted-foreground">
                Tu posición actual: <strong>#{miPosicion}</strong>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Logros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Medal className="h-4 w-4 text-primary" />
              Logros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {logros.map((l) => (
                <div
                  key={l.id}
                  className={cn(
                    'rounded-lg border p-3 text-sm transition',
                    l.desbloqueado
                      ? 'border-warning/30 bg-warning/15'
                      : 'border-border/60 bg-muted opacity-50'
                  )}
                  title={l.descripcion}
                >
                  <p className="text-lg">{l.emoji}</p>
                  <p className="mt-1 text-xs font-medium text-foreground">{l.nombre}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historial */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historial de referidos</CardTitle>
        </CardHeader>
        <CardContent>
          {historial.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no has referido a nadie. ¡Comparte tu enlace para empezar!
            </p>
          ) : (
            <ul className="divide-y">
              {historial.map((h) => {
                const est = ESTADO_HISTORIAL[h.estado]
                return (
                  <li key={h.id} className="flex items-center justify-between py-2.5 text-sm">
                    <div>
                      <p className="font-medium text-foreground">{h.nombre}</p>
                      <p className="text-xs text-muted-foreground">{fmtDate(h.fecha)}</p>
                    </div>
                    <Badge className={est.clase}>
                      <est.icon className="mr-1 h-3 w-3" />
                      {est.label}
                    </Badge>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
