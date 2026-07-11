import Link from 'next/link'
import { ADMIN_ROLES } from '@/types'
import { MapPin, Plus, Pencil, Phone, Navigation } from 'lucide-react'
import { requireRole } from '@/lib/auth/guards'
import { companyFilter } from '@/modules/admin/queries'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DeleteSucursalButton } from '@/components/admin/DeleteSucursalButton'

export const dynamic = 'force-dynamic'

export default async function SucursalesPage() {
  const user = await requireRole(ADMIN_ROLES)
  const companyId = companyFilter(user)

  let sucursales: {
    id: string; nombre: string; direccion: string | null; telefono: string | null;
    activa: boolean; companyId: string; createdAt: Date;
    company: { name: string }; _count: { visits: number }
  }[] = []
  try {
    sucursales = await prisma.sucursal.findMany({
      where: companyId ? { companyId } : {},
      include: {
        company: true,
        _count: { select: { visits: true } },
      },
      orderBy: { createdAt: 'asc' },
    })
  } catch (e) {
    console.error('[admin-sucursales]', e)
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Sucursales</h1>
          <p className="text-sm text-muted-foreground">
            Las sucursales activas aparecen en el escáner para que el empleado indique desde dónde registra la visita.
          </p>
        </div>
        <Link href="/admin/sucursales/nueva">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva sucursal
          </Button>
        </Link>
      </div>

      {sucursales.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center text-muted-foreground">
            <MapPin className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium">Sin sucursales configuradas</p>
            <p className="text-sm">
              Agrega sucursales para que el escáner pueda registrar desde qué ubicación se confirmó cada visita.
            </p>
            <Link href="/admin/sucursales/nueva" className="mt-4 block">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Agregar primera sucursal
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sucursales.map((s) => (
            <Card key={s.id} className={`border-border/60 shadow-card transition hover:shadow-card-hover ${!s.activa ? 'opacity-60' : ''}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-xl p-2.5 ring-1 ${s.activa ? 'bg-info/10 ring-info/20' : 'bg-muted ring-border'}`}>
                      <MapPin className={`h-5 w-5 ${s.activa ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{s.nombre}</p>
                      {user.metadata.role === 'SUPERADMIN' && (
                        <p className="text-xs text-muted-foreground">{s.company.name}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {!s.activa && (
                      <Badge variant="secondary" className="text-xs">Inactiva</Badge>
                    )}
                    <Link href={`/admin/sucursales/${s.id}/editar`}>
                      <Button size="icon" variant="ghost" aria-label="Editar" title="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <DeleteSucursalButton id={s.id} nombre={s.nombre} />
                  </div>
                </div>

                <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                  {s.direccion && (
                    <div className="flex items-start gap-2">
                      <Navigation className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <span>{s.direccion}</span>
                    </div>
                  )}
                  {s.telefono && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span>{s.telefono}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3">
                  <p className="text-xs text-muted-foreground">
                    {s._count.visits} visita{s._count.visits !== 1 ? 's' : ''} registradas
                  </p>
                  <Badge
                    variant="secondary"
                    className={s.activa ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}
                  >
                    {s.activa ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
