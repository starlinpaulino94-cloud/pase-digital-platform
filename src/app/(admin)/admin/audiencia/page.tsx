import Link from 'next/link'
import { ADMIN_ROLES } from '@/types'
import { requireRole } from '@/lib/auth/guards'
import { getAudienciaEmpresa, type AudienciaStats } from '@/modules/social/queries'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { StatusBanner } from '@/components/ui/status-banner'
import { StatCard } from '@/components/ui/stat-card'
import {
  Users,
  UserPlus,
  Star,
  Eye,
  Share2,
  Heart,
  Percent,
  Handshake,
  AlertCircle,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

const fmt = (n: number) => new Intl.NumberFormat('es-DO').format(n)

export default async function AudienciaPage() {
  const user = await requireRole(ADMIN_ROLES)
  const companyId = user.metadata.companyId

  if (!companyId) {
    return (
      <div className="space-y-6">
        <PageHeader title="Audiencia" />
        <EmptyState
          icon={<AlertCircle className="h-6 w-6" />}
          title="Esta vista es por empresa"
          description="Inicia sesión con una cuenta de empresa para ver tu audiencia."
        />
      </div>
    )
  }

  let stats: AudienciaStats | null = null
  try {
    stats = await getAudienciaEmpresa(companyId)
  } catch (e) {
    console.error('[admin-audiencia]', e)
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <PageHeader title="Audiencia" />
        <StatusBanner variant="destructive" title="No pudimos cargar las métricas">
          Recarga la página para intentarlo de nuevo.
        </StatusBanner>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Audiencia"
        description="Tus seguidores y el rendimiento de tus promociones en el marketplace."
      />

      {/* Seguidores */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          accent="sky"
          label="Seguidores"
          value={fmt(stats.seguidores)}
        />
        <StatCard
          icon={UserPlus}
          accent="green"
          label="Nuevos seguidores"
          sub="Últimos 30 días"
          value={fmt(stats.nuevosSeguidores30d)}
        />
        <StatCard
          icon={Star}
          accent="amber"
          label="Te marcaron favorita"
          value={fmt(stats.favoritos)}
        />
        <StatCard
          icon={Handshake}
          accent="violet"
          label="Clientes obtenidos"
          sub="Últimos 30 días"
          value={fmt(stats.clientesNuevos30d)}
        />
      </div>

      {/* Engagement de promociones */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Eye}
          accent="sky"
          label="Vistas de promociones"
          value={fmt(stats.vistasTotales)}
        />
        <StatCard
          icon={Share2}
          accent="indigo"
          label="Compartidas"
          value={fmt(stats.compartidasTotales)}
        />
        <StatCard
          icon={Heart}
          accent="red"
          label="Guardadas"
          value={fmt(stats.guardadasTotales)}
        />
        <StatCard
          icon={Percent}
          accent="violet"
          label="Interacción (CTR)"
          sub="Compartidas + guardadas / vistas"
          value={`${stats.ctr.toFixed(1)}%`}
        />
      </div>

      {/* Detalle por promoción */}
      <Card>
        <CardContent className="p-0">
          <div className="border-b border-border p-5">
            <h2 className="font-semibold text-foreground">
              Rendimiento por promoción
            </h2>
          </div>
          {stats.promos.length === 0 ? (
            <EmptyState
              icon={<Eye className="h-6 w-6" />}
              title="Aún no has publicado promociones"
              description="Publica tu primera promoción para ver aquí su rendimiento."
              action={
                <Button asChild>
                  <Link href="/admin/promociones">Crear promoción</Link>
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground/70">
                    <th className="px-5 py-3 font-medium">Promoción</th>
                    <th className="px-5 py-3 text-right font-medium">Vistas</th>
                    <th className="px-5 py-3 text-right font-medium">Compartidas</th>
                    <th className="px-5 py-3 text-right font-medium">Guardadas</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.promos.map((p) => (
                    <tr key={p.id} className="border-b border-border/50">
                      <td className="px-5 py-3">
                        <span className="font-medium text-foreground">{p.titulo}</span>{' '}
                        {!p.activo && (
                          <Badge variant="secondary" className="ml-1">
                            Inactiva
                          </Badge>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums">{fmt(p.vistas)}</td>
                      <td className="px-5 py-3 text-right tabular-nums">{fmt(p.compartidas)}</td>
                      <td className="px-5 py-3 text-right tabular-nums">{fmt(p.guardadas)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
