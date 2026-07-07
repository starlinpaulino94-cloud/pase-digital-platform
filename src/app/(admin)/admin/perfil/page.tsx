import Link from 'next/link'
import { ExternalLink, AlertCircle } from 'lucide-react'
import { ADMIN_ROLES } from '@/types'
import { requireRole } from '@/lib/auth/guards'
import { prisma } from '@/lib/prisma'
import {
  getActiveCategories,
  getCompanyCategoryIds,
} from '@/modules/empresas/queries'
import { PerfilPublicoForm } from '@/components/admin/PerfilPublicoForm'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function PerfilEmpresaPage() {
  const user = await requireRole(ADMIN_ROLES)
  const companyId = user.metadata.companyId

  if (!companyId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Perfil público</h1>
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-slate-300" />
            Esta vista es por empresa. Como superadmin, edita empresas desde{' '}
            <Link href="/superadmin/empresas" className="text-blue-600 underline">
              el panel de empresas
            </Link>
            .
          </CardContent>
        </Card>
      </div>
    )
  }

  let company: Awaited<ReturnType<typeof prisma.company.findUnique>> = null
  let categories: Awaited<ReturnType<typeof getActiveCategories>> = []
  let selectedCategoryIds: string[] = []
  try {
    ;[company, categories, selectedCategoryIds] = await Promise.all([
      prisma.company.findUnique({ where: { id: companyId } }),
      getActiveCategories(),
      getCompanyCategoryIds(companyId),
    ])
  } catch (e) {
    console.error('[admin-perfil]', e)
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Perfil público</h1>
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-destructive" />
            No pudimos cargar tu perfil en este momento. Intenta de nuevo.
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Perfil público</h1>
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-destructive" />
            No encontramos tu empresa. Contacta a soporte.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Perfil público</h1>
          <p className="text-slate-500">
            Así te ven los visitantes en el marketplace. Todo lo que edites
            aquí se refleja en tu página pública.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/empresas/${company.slug}`} target="_blank">
            Ver mi página pública <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <PerfilPublicoForm
        company={{
          id: company.id,
          name: company.name,
          description: company.description,
          horario: company.horario,
          logoUrl: company.logoUrl,
          bannerUrl: company.bannerUrl,
          galleryImages: company.galleryImages,
          direccion: company.direccion,
          ciudad: company.ciudad,
          provincia: company.provincia,
          pais: company.pais,
          telefono: company.telefono,
          whatsapp: company.whatsapp,
          email: company.email,
          website: company.website,
          instagram: company.instagram,
          facebook: company.facebook,
          tiktok: company.tiktok,
          googleMapsUrl: company.googleMapsUrl,
        }}
        categories={categories}
        selectedCategoryIds={selectedCategoryIds}
      />
    </div>
  )
}
