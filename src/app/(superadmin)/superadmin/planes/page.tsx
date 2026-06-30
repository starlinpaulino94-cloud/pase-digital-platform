export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { requireRole } from '@/lib/auth/guards'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check, Infinity as InfinityIcon, Plus, Pencil } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DeletePlanButton } from '@/components/admin/DeletePlanButton'

export default async function SuperadminPlanesPage() {
  await requireRole('SUPERADMIN')

  const [planes, companies] = await Promise.all([
    prisma.plan.findMany({
      include: {
        company: true,
        _count: { select: { memberships: true } },
      },
      orderBy: [{ companyId: 'asc' }, { precio: 'asc' }],
    }),
    prisma.company.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
  ])

  const byCompany = companies.map((c) => ({
    ...c,
    planes: planes.filter((p) => p.companyId === c.id),
  }))

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Planes / Promociones</h1>
          <p className="text-slate-500">Gestión global de planes por empresa.</p>
        </div>
        <Button asChild>
          <Link href="/superadmin/planes/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo plan
          </Link>
        </Button>
      </div>

      {byCompany.map((company) => (
        <section key={company.id} className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-700 border-b pb-2">{company.name}</h2>
          {company.planes.length === 0 && (
            <p className="text-sm text-slate-400">Sin planes configurados.</p>
          )}
          <div className="grid gap-4 md:grid-cols-3">
            {company.planes.map((plan) => (
              <Card key={plan.id} className={!plan.activo ? 'opacity-60' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{plan.nombre}</CardTitle>
                    <div className="flex gap-1">
                      {plan.esIlimitado && (
                        <Badge className="bg-amber-100 text-amber-700 text-xs">
                          <InfinityIcon className="mr-1 h-3 w-3" />Ilimitado
                        </Badge>
                      )}
                      {!plan.activo && (
                        <Badge variant="secondary" className="text-xs">Inactivo</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-2xl font-bold text-slate-900">
                    RD${new Intl.NumberFormat('es-DO').format(Number(plan.precio))}
                    <span className="text-sm font-normal text-slate-500">/mes</span>
                  </p>
                  {!plan.esIlimitado && (
                    <p className="text-xs text-slate-500">{plan.lavadosIncluidos} lavados incluidos</p>
                  )}
                  {plan.descripcion && (
                    <p className="text-sm text-slate-600">{plan.descripcion}</p>
                  )}
                  <ul className="space-y-1">
                    {plan.beneficios.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-sm text-slate-600">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-500" />
                        {b}
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-slate-400">{plan._count.memberships} membresías</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/superadmin/planes/${plan.id}/editar`}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <DeletePlanButton planId={plan.id} memberships={plan._count.memberships} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
