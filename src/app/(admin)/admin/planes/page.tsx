import { Check, Infinity as InfinityIcon } from 'lucide-react'
import { ADMIN_ROLES } from '@/types'
import { requireRole } from '@/lib/auth/guards'
import { companyFilter } from '@/modules/admin/queries'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

export default async function PlanesPage() {
  const user = await requireRole(ADMIN_ROLES)
  const companyId = companyFilter(user)

  let planes: {
    id: string; nombre: string; precio: unknown; esIlimitado: boolean;
    lavadosIncluidos: number; activo: boolean; descripcion: string | null;
    beneficios: string[]; companyId: string;
    company: { name: string }; _count: { memberships: number }
  }[] = []

  try {
    planes = await prisma.plan.findMany({
      where: companyId ? { companyId } : {},
      select: {
        id: true, nombre: true, precio: true, esIlimitado: true,
        lavadosIncluidos: true, activo: true, descripcion: true,
        beneficios: true, companyId: true,
        company: { select: { name: true } },
        _count: { select: { memberships: true } },
      },
      orderBy: [{ companyId: 'asc' }, { precio: 'asc' }],
    })
  } catch (e) {
    console.error('[admin-planes]', e)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Planes</h1>
        <p className="text-slate-500">Planes ofrecidos a tus clientes.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {planes.map((plan) => (
          <Card key={plan.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{plan.nombre}</CardTitle>
                {plan.esIlimitado && (
                  <Badge className="bg-amber-100 text-amber-700">
                    <InfinityIcon className="mr-1 h-3 w-3" /> Ilimitado
                  </Badge>
                )}
              </div>
              {companyId === undefined && (
                <p className="text-sm text-slate-400">{plan.company.name}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-2xl font-bold">
                RD${new Intl.NumberFormat('es-DO').format(Number(plan.precio))}
                <span className="text-sm font-normal text-slate-500">/mes</span>
              </p>
              <ul className="space-y-1.5">
                {plan.beneficios.map((b) => (
                  <li
                    key={b}
                    className="flex items-start gap-2 text-sm text-slate-600"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
                    {b}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-slate-400">
                {plan._count.memberships} membresías
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
