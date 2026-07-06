import Link from 'next/link'
import { ADMIN_ROLES } from '@/types'
import { requireRole } from '@/lib/auth/guards'
import { companyFilter } from '@/modules/admin/queries'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DeletePromocionButton } from '@/components/admin/DeletePromocionButton'
import { Gift, Plus, Pencil } from 'lucide-react'

export const dynamic = 'force-dynamic'

function fmtDate(d: Date | null) {
  if (!d) return null
  return new Intl.DateTimeFormat('es-DO', { dateStyle: 'medium' }).format(d)
}

export default async function PromocionesPage() {
  const user = await requireRole(ADMIN_ROLES)
  const companyId = companyFilter(user)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let promociones: any[] = []
  try {
    promociones = await prisma.promocion.findMany({
      where: companyId ? { companyId } : {},
      include: { company: true },
      orderBy: { createdAt: 'desc' },
    })
  } catch (e) {
    console.error('[admin-promociones]', e)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Promociones</h1>
          <p className="text-slate-500">
            Publica ofertas para tus clientes. Se notifican automáticamente
            al crearlas.
          </p>
        </div>
        <Link href="/admin/promociones/nuevo">
          <Button className="bg-sky-500 hover:bg-sky-400">
            <Plus className="mr-2 h-4 w-4" />
            Nueva promoción
          </Button>
        </Link>
      </div>

      {promociones.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-slate-500">
            <Gift className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="font-medium">Sin promociones publicadas</p>
            <p className="text-sm">Crea tu primera promoción para tus clientes.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {promociones.map((p) => (
            <Card key={p.id} className={p.activo ? '' : 'opacity-60'}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-amber-100 p-2">
                      <Gift className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{p.titulo}</p>
                      {!companyId && (
                        <p className="text-xs text-slate-400">{p.company.name}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant={p.activo ? 'default' : 'secondary'}>
                    {p.activo ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>
                <p className="mt-3 text-sm text-slate-600">{p.descripcion}</p>
                {p.vigenciaHasta && (
                  <p className="mt-2 text-xs text-slate-400">
                    Vigente hasta {fmtDate(p.vigenciaHasta)}
                  </p>
                )}
                <div className="mt-4 flex justify-end gap-1">
                  <Link href={`/admin/promociones/${p.id}/editar`}>
                    <Button size="icon" variant="ghost">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </Link>
                  <DeletePromocionButton id={p.id} titulo={p.titulo} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
