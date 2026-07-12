import Link from 'next/link'
import { ADMIN_ROLES } from '@/types'
import { requireRole } from '@/lib/auth/guards'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DeleteCampanaButton } from '@/components/admin/DeleteCampanaButton'
import {
  Flag,
  Plus,
  Pencil,
  Gift,
  Newspaper,
  Eye,
  Share2,
  Heart,
  AlertCircle,
  CalendarDays,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

function fmtFecha(d: Date | null) {
  if (!d) return null
  return new Intl.DateTimeFormat('es-DO', { timeZone: 'America/Santo_Domingo', dateStyle: 'medium' }).format(new Date(d))
}

export default async function CampanasPage() {
  const user = await requireRole(ADMIN_ROLES)
  const companyId = user.metadata.companyId

  if (!companyId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Campañas</h1>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
            Esta vista es por empresa. Inicia sesión con una cuenta de empresa.
          </CardContent>
        </Card>
      </div>
    )
  }

  let campanas: Awaited<ReturnType<typeof query>> = []
  async function query() {
    return prisma.campana.findMany({
      where: { companyId: companyId! },
      include: {
        promociones: {
          select: {
            viewCount: true,
            shareCount: true,
            _count: { select: { guardadaPor: true } },
          },
        },
        _count: { select: { promociones: true, posts: true } },
      },
      orderBy: [{ activo: 'desc' }, { createdAt: 'desc' }],
    })
  }
  try {
    campanas = await query()
  } catch (e) {
    console.error('[admin-campanas]', e)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Campañas</h1>
          <p className="text-muted-foreground">
            Agrupa promociones y publicaciones bajo una misma campaña y mide su
            rendimiento en conjunto.
          </p>
        </div>
        <Link href="/admin/campanas/nueva">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva campaña
          </Button>
        </Link>
      </div>

      {campanas.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Flag className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium">Sin campañas</p>
            <p className="text-sm">
              Crea una campaña (ej. &quot;Black Friday&quot;) y asígnale
              promociones y publicaciones desde sus formularios.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {campanas.map((c) => {
            const vistas = c.promociones.reduce((s, p) => s + p.viewCount, 0)
            const compartidas = c.promociones.reduce((s, p) => s + p.shareCount, 0)
            const guardadas = c.promociones.reduce(
              (s, p) => s + p._count.guardadaPor,
              0
            )
            return (
              <Card key={c.id} className={c.activo ? '' : 'opacity-60'}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Flag className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{c.nombre}</p>
                        {(c.fechaInicio || c.fechaFin) && (
                          <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <CalendarDays className="h-3 w-3" />
                            {fmtFecha(c.fechaInicio) ?? '—'} → {fmtFecha(c.fechaFin) ?? 'sin fin'}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant={c.activo ? 'default' : 'secondary'}>
                      {c.activo ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </div>

                  {c.descripcion && (
                    <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                      {c.descripcion}
                    </p>
                  )}

                  {/* Contenido de la campaña */}
                  <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Gift className="h-3.5 w-3.5 text-warning-foreground" />
                      {c._count.promociones} promociones
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Newspaper className="h-3.5 w-3.5 text-primary" />
                      {c._count.posts} publicaciones
                    </span>
                  </div>

                  {/* Métricas conjuntas */}
                  <div className="mt-3 flex gap-4 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" /> {vistas}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Share2 className="h-3.5 w-3.5" /> {compartidas}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Heart className="h-3.5 w-3.5" /> {guardadas}
                    </span>

                    <div className="ml-auto flex items-center gap-1">
                      <Link href={`/admin/campanas/${c.id}/editar`}>
                        <Button size="icon" variant="ghost" title="Editar" aria-label="Editar">
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </Link>
                      <DeleteCampanaButton id={c.id} nombre={c.nombre} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
