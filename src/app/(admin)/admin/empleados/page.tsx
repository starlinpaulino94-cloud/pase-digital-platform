import Link from 'next/link'
import { ADMIN_ROLES, FULL_ADMIN_ROLES } from '@/types'
import { Plus } from 'lucide-react'
import { requireRole } from '@/lib/auth/guards'
import { companyFilter } from '@/modules/admin/queries'
import { listInvitaciones } from '@/modules/admin/invitacionActions'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { EmpleadosTable, type EmpleadoRow } from '@/components/admin/EmpleadosTable'
import { InvitarEquipo } from '@/components/admin/InvitarEquipo'
import { CancelarInvitacionButton } from '@/components/admin/CancelarInvitacionButton'
import { roleLabel } from '@/components/layout/nav-config'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AppRole } from '@/types'

export const dynamic = 'force-dynamic'

export default async function EmpleadosPage() {
  const user = await requireRole(ADMIN_ROLES)
  const companyId = companyFilter(user)
  // Solo los administradores plenos con empresa pueden invitar equipo.
  const puedeInvitar = !!user.metadata.companyId && FULL_ADMIN_ROLES.includes(user.metadata.role)

  let empleados: EmpleadoRow[] = []
  let invitacionesPendientes: { id: string; email: string; rol: AppRole; expiraEn: Date }[] = []
  try {
    const [emp, invs] = await Promise.all([
      prisma.user.findMany({
        where: { role: 'EMPLEADO', ...(companyId ? { companyId } : {}) },
        orderBy: { createdAt: 'desc' },
        take: 200,
        select: { id: true, name: true, email: true, createdAt: true },
      }),
      user.metadata.companyId
        ? listInvitaciones(user.metadata.companyId).catch(() => [])
        : Promise.resolve([]),
    ])
    empleados = emp
    invitacionesPendientes = invs
      .filter((i) => i.estado === 'PENDIENTE')
      .map((i) => ({ id: i.id, email: i.email, rol: i.rol, expiraEn: i.expiraEn }))
  } catch (e) {
    console.error('[admin-empleados]', e)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Equipo</h1>
          <p className="text-slate-500">{empleados.length} empleados</p>
        </div>
        <Button asChild>
          <Link href="/admin/empleados/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo empleado
          </Link>
        </Button>
      </div>

      {/* Invitar al equipo (paso 7 del onboarding) */}
      {puedeInvitar && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Invitar al equipo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InvitarEquipo />

            {invitacionesPendientes.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Invitaciones pendientes
                </p>
                <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                  {invitacionesPendientes.map((inv) => (
                    <li
                      key={inv.id}
                      className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                    >
                      <span className="min-w-0 truncate">
                        <span className="font-medium text-slate-800">{inv.email}</span>
                        <span className="ml-2 text-slate-500">· {roleLabel(inv.rol)}</span>
                      </span>
                      <CancelarInvitacionButton id={inv.id} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <EmpleadosTable data={empleados} />
    </div>
  )
}
