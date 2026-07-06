import { requireRole } from '@/lib/auth/guards'
import { ADMIN_ROLES } from '@/types'
import { companyFilter } from '@/modules/admin/queries'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ReglaRecompensaForm } from '@/components/admin/ReglaRecompensaForm'
import { ReglaRecompensaToggle } from '@/components/admin/ReglaRecompensaToggle'
import { Users, Gift, Trophy } from 'lucide-react'

export const dynamic = 'force-dynamic'

const TIPO_LABEL: Record<string, string> = {
  LAVADOS_GRATIS: 'Usos gratis',
  DESCUENTO_PORCENTAJE: 'Descuento %',
  DESCUENTO_MONTO: 'Descuento RD$',
}

export default async function ReferidosPage() {
  const user = await requireRole(ADMIN_ROLES)
  const companyId = companyFilter(user)
  const where = companyId ? { companyId } : {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let reglas: any[] = []
  let totalReferidos = 0
  let completados = 0
  let topReferentes: { referenteClienteId: string; _count: { referenteClienteId: number } }[] = []

  try {
    ;[reglas, totalReferidos, completados, topReferentes] = await Promise.all([
      prisma.reglaRecompensa.findMany({ where, orderBy: { valorCondicion: 'asc' } }),
      prisma.referido.count({ where }),
      prisma.referido.count({ where: { ...where, estado: 'COMPLETADO' } }),
      prisma.referido.groupBy({
        by: ['referenteClienteId'],
        where: { ...where, estado: 'COMPLETADO' },
        _count: { referenteClienteId: true },
        orderBy: { _count: { referenteClienteId: 'desc' } },
        take: 5,
      }),
    ])
  } catch (e) {
    console.error('[admin-referidos]', e)
  }

  let nombreMap = new Map<string, string>()
  try {
    const referentes = await prisma.cliente.findMany({
      where: { id: { in: topReferentes.map((t) => t.referenteClienteId) } },
      select: { id: true, nombre: true },
    })
    nombreMap = new Map(referentes.map((r) => [r.id, r.nombre]))
  } catch {}

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Referidos</h1>
        <p className="text-slate-500">
          Programa de referidos y reglas de recompensa configurables.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 py-5">
            <div className="rounded-lg bg-sky-100 p-2">
              <Users className="h-5 w-5 text-sky-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{totalReferidos}</p>
              <p className="text-sm text-slate-500">Referidos totales</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-5">
            <div className="rounded-lg bg-green-100 p-2">
              <Trophy className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{completados}</p>
              <p className="text-sm text-slate-500">Completados (activaron membresía)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-5">
            <div className="rounded-lg bg-amber-100 p-2">
              <Gift className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{reglas.filter((r) => r.activo).length}</p>
              <p className="text-sm text-slate-500">Reglas activas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top referentes</CardTitle>
        </CardHeader>
        <CardContent>
          {topReferentes.length === 0 ? (
            <p className="text-sm text-slate-500">Aún no hay referidos completados.</p>
          ) : (
            <ul className="space-y-2">
              {topReferentes.map((t) => (
                <li key={t.referenteClienteId} className="flex items-center justify-between text-sm">
                  <span>{nombreMap.get(t.referenteClienteId) ?? 'Cliente'}</span>
                  <Badge variant="secondary">{t._count.referenteClienteId} referidos</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reglas de recompensa</CardTitle>
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
                    <p className="font-medium text-slate-900">{r.nombre}</p>
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
          <ReglaRecompensaForm />
        </CardContent>
      </Card>
    </div>
  )
}
