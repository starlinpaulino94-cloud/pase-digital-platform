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
  return new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium' }).format(d)
}

const ESTADO_HISTORIAL = {
  REGISTRADO: {
    label: 'Registrado',
    icon: Clock,
    clase: 'bg-slate-100 text-slate-700 hover:bg-slate-100',
  },
  MEMBRESIA_ACTIVA: {
    label: 'Membresía activa',
    icon: CheckCircle2,
    clase: 'bg-green-100 text-green-700 hover:bg-green-100',
  },
  RECOMPENSA_ENTREGADA: {
    label: 'Recompensa entregada',
    icon: Gift,
    clase: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  },
} as const

const MEDALLAS = ['🥇', '🥈', '🥉']

export default async function ReferidosClientePage() {
  const user = await requireRole('CLIENTE')

  let cliente: {
    id: string
    nombre: string
    companyId: string
    company: { name: string; slug: string }
  } | null = null

  try {
    cliente = user.metadata.clienteId
      ? await prisma.cliente.findUnique({
          where: { id: user.metadata.clienteId },
          select: {
            id: true,
            nombre: true,
            companyId: true,
            company: { select: { name: true, slug: true } },
          },
        })
      : null
  } catch (e) {
    console.error('[cliente-referidos] cliente', e)
  }

  if (!cliente) {
    return <p className="text-slate-600">No se encontró tu información.</p>
  }

  let codigoCorto = ''
  let dashboard: ReferidosDashboard | null = null
  try {
    ;[codigoCorto, dashboard] = await Promise.all([
      ensureCodigoCorto(cliente.id),
      getReferidosDashboard(cliente.id, cliente.companyId, user.supabaseId),
    ])
  } catch (e) {
    console.error('[cliente-referidos] dashboard', e)
  }

  if (!dashboard) {
    return (
      <p className="text-slate-600">
        No pudimos cargar tu panel de referidos. Intenta de nuevo más tarde.
      </p>
    )
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
    { label: 'Compartidos', valor: stats.compartidos, icon: Share2, color: 'bg-sky-100 text-sky-600' },
    { label: 'Clics', valor: stats.clicks, icon: MousePointerClick, color: 'bg-violet-100 text-violet-600' },
    { label: 'Registros', valor: stats.registros, icon: UserPlus, color: 'bg-amber-100 text-amber-600' },
    { label: 'Membresías', valor: stats.membresias, icon: BadgeCheck, color: 'bg-green-100 text-green-600' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Refiere y gana</h1>
        <p className="text-slate-500">
          Comparte tu enlace de {cliente.company.name}, gana puntos y sube de
          nivel con cada amigo que se una.
        </p>
      </div>

      {/* Enlace + compartir + QR */}
      <Card className="border-sky-200 bg-sky-50/60">
        <CardContent className="space-y-3 py-5">
          <p className="text-sm font-medium text-sky-700">Tu enlace de referido</p>
          <ReferralShareCard url={shareUrl} companyName={cliente.company.name} />
        </CardContent>
      </Card>

      {/* Nivel de embajador */}
      <Card>
        <CardContent className="py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{nivel.emoji}</span>
              <div>
                <p className="font-semibold text-slate-900">{nivel.nombre}</p>
                <p className="text-sm text-slate-500">{nivel.descripcion}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-900">{stats.puntos}</p>
              <p className="text-xs text-slate-500">puntos</p>
            </div>
          </div>
          {siguiente ? (
            <div className="mt-4 space-y-1.5">
              <Progress value={progresoPct} />
              <p className="text-xs text-slate-500">
                {siguiente.minPuntos - stats.puntos} puntos para{' '}
                <strong>
                  {siguiente.emoji} {siguiente.nombre}
                </strong>
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm font-medium text-amber-600">
              👑 Nivel máximo alcanzado. ¡Eres leyenda en {cliente.company.name}!
            </p>
          )}
          <p className="mt-3 text-xs text-slate-400">
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
                <p className="text-2xl font-bold text-slate-900">{s.valor}</p>
                <p className="text-sm text-slate-500">{s.label}</p>
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
            <div className="rounded-lg bg-violet-50 px-4 py-2">
              <p className="text-lg font-bold text-violet-700">{stats.clicks}</p>
              <p className="text-xs text-slate-500">clics</p>
            </div>
            <span className="text-slate-300">→</span>
            <div className="rounded-lg bg-amber-50 px-4 py-2">
              <p className="text-lg font-bold text-amber-700">{stats.registros}</p>
              <p className="text-xs text-slate-500">registros</p>
            </div>
            <span className="text-slate-300">→</span>
            <div className="rounded-lg bg-green-50 px-4 py-2">
              <p className="text-lg font-bold text-green-700">{stats.membresias}</p>
              <p className="text-xs text-slate-500">membresías</p>
            </div>
            <span className="text-slate-300">=</span>
            <div className="rounded-lg bg-sky-50 px-4 py-2">
              <p className="text-lg font-bold text-sky-700">{stats.conversionPct}%</p>
              <p className="text-xs text-slate-500">conversión</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Retos activos de la empresa */}
      {retos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Gift className="h-4 w-4 text-rose-500" />
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
                    <p className="font-medium text-slate-800">
                      {r.nombre}
                      {completado && ' 🎉'}
                    </p>
                    <span className="text-xs text-slate-500">
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
      <Card className="border-violet-200 bg-violet-50/50">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 py-5">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🌐</span>
            <div>
              <p className="font-semibold text-slate-900">Centro MembeGo</p>
              <p className="max-w-md text-sm text-slate-500">
                Tu mismo enlace también gana: si alguien se registra en{' '}
                <strong>cualquier otra empresa</strong> de la plataforma, sumas
                puntos MembeGo.
              </p>
            </div>
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-violet-700">{global.puntos}</p>
              <p className="text-xs text-slate-500">puntos MembeGo</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{global.registros}</p>
              <p className="text-xs text-slate-500">registros</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{global.membresias}</p>
              <p className="text-xs text-slate-500">membresías</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Ranking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4 text-amber-500" />
              Top embajadores de {cliente.company.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ranking.length === 0 ? (
              <p className="text-sm text-slate-500">
                Aún no hay actividad. ¡Sé el primero del ranking!
              </p>
            ) : (
              <ul className="space-y-2">
                {ranking.map((r) => (
                  <li
                    key={r.posicion}
                    className={cn(
                      'flex items-center justify-between rounded-lg px-3 py-2 text-sm',
                      r.esYo ? 'bg-sky-50 font-semibold text-sky-800' : 'text-slate-700'
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-6 text-center">
                        {MEDALLAS[r.posicion - 1] ?? `${r.posicion}.`}
                      </span>
                      {r.nombre}
                      {r.esYo && <Badge variant="secondary">Tú</Badge>}
                    </span>
                    <span className="font-medium">{r.puntos} pts</span>
                  </li>
                ))}
              </ul>
            )}
            {miPosicion != null && miPosicion > 5 && (
              <p className="mt-3 text-xs text-slate-500">
                Tu posición actual: <strong>#{miPosicion}</strong>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Logros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Medal className="h-4 w-4 text-sky-500" />
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
                      ? 'border-amber-200 bg-amber-50'
                      : 'border-slate-100 bg-slate-50 opacity-50'
                  )}
                  title={l.descripcion}
                >
                  <p className="text-lg">{l.emoji}</p>
                  <p className="mt-1 text-xs font-medium text-slate-700">{l.nombre}</p>
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
            <p className="text-sm text-slate-500">
              Aún no has referido a nadie. ¡Comparte tu enlace para empezar!
            </p>
          ) : (
            <ul className="divide-y">
              {historial.map((h) => {
                const est = ESTADO_HISTORIAL[h.estado]
                return (
                  <li key={h.id} className="flex items-center justify-between py-2.5 text-sm">
                    <div>
                      <p className="font-medium text-slate-800">{h.nombre}</p>
                      <p className="text-xs text-slate-400">{fmtDate(h.fecha)}</p>
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
