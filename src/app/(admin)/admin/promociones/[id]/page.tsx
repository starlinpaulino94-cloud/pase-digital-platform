export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireSuperAdmin } from '@/lib/auth/guards'
import { getPromotionById } from '@/modules/promociones/queries'
import { PromotionStatusBadge } from '@/components/promotions/PromotionStatusBadge'
import { PromotionTypeBadge } from '@/components/promotions/PromotionTypeBadge'
import { PromotionActions } from '@/components/promotions/PromotionActions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export default async function PromocionAdminDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireSuperAdmin()
  const { id } = await params

  const promotion = await getPromotionById(id)
  if (!promotion) notFound()

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{promotion.name}</h1>
            <PromotionStatusBadge status={promotion.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            Empresa: {promotion.company?.name ?? ''} · Tipo: <PromotionTypeBadge type={promotion.type} />
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/promociones/${promotion.id}/editar`}>Editar</Link>
        </Button>
      </div>

      <PromotionActions
        promotionId={promotion.id}
        status={promotion.status}
        redirectAfterDelete="/admin/promociones"
        redirectAfterDuplicate="/admin/promociones"
      />

      <Separator />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Descripción</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm">{promotion.description || <span className="text-muted-foreground">Sin descripción</span>}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Usos</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            <p className="text-2xl font-bold">{promotion.usedCount}</p>
            <p className="text-xs text-muted-foreground">
              de {promotion.maxUses != null ? promotion.maxUses : '∞'} máximos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Fechas</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Inicio</span>
              <span>{promotion.startsAt ? new Date(promotion.startsAt).toLocaleDateString('es-DO') : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expiración</span>
              <span>{promotion.expiresAt ? new Date(promotion.expiresAt).toLocaleDateString('es-DO') : '—'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Asignaciones</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{promotion._count?.assignments ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="text-xs text-muted-foreground space-y-1">
        <p>Creado por: {promotion.createdBy?.name ?? ''}</p>
        <p>Creado: {new Date(promotion.createdAt).toLocaleString('es-DO')}</p>
        <p>Actualizado: {new Date(promotion.updatedAt).toLocaleString('es-DO')}</p>
      </div>

      <div className="pt-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/promociones">← Volver a promociones</Link>
        </Button>
      </div>
    </div>
  )
}
