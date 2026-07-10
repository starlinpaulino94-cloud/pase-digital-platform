import Link from 'next/link'
import { ExternalLink, AlertCircle, Building2 } from 'lucide-react'
import { ADMIN_ROLES } from '@/types'
import { requireRole } from '@/lib/auth/guards'
import { prisma } from '@/lib/prisma'
import {
  getActiveCategories,
  getCompanyCategoryIds,
} from '@/modules/empresas/queries'
import { PerfilPublicoForm } from '@/components/admin/PerfilPublicoForm'
import { CompanyQRRegistro } from '@/components/admin/CompanyQRRegistro'
import { CompartirOfertaButton } from '@/components/admin/CompartirOfertaButton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getAppUrl } from '@/lib/site'

export const dynamic = 'force-dynamic'

export default async function PerfilEmpresaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const user = await requireRole(ADMIN_ROLES)
  const params = await searchParams
  const esSuper = user.metadata.role === 'SUPERADMIN'

  // El superadmin no usa la empresa de su sesión (puede no tener, o apuntar a
  // una empresa borrada): elige cuál editar con ?empresa=<id>.
  const companyId = esSuper
    ? (typeof params.empresa === 'string' ? params.empresa : null)
    : user.metadata.companyId

  if (!companyId) {
    if (esSuper) {
      const companies = await prisma.company
        .findMany({
          orderBy: { name: 'asc' },
          select: { id: true, name: true, slug: true, isPublished: true },
        })
        .catch(() => [])
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Perfil público</h1>
            <p className="text-slate-500">
              Elige la empresa cuyo perfil quieres editar.
            </p>
          </div>
          {companies.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-slate-500">
                <Building2 className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                Aún no hay empresas registradas.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {companies.map((c) => (
                <Link
                  key={c.id}
                  href={`/admin/perfil?empresa=${c.id}`}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:shadow-sm"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{c.name}</p>
                    <p className="text-xs text-slate-500">
                      {c.isPublished ? 'Publicada' : 'Sin publicar'}
                    </p>
                  </div>
                  <Building2 className="h-5 w-5 text-slate-300" />
                </Link>
              ))}
            </div>
          )}
        </div>
      )
    }
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Perfil público</h1>
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-slate-300" />
            Tu cuenta no tiene una empresa asignada. Contacta a soporte.
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
        <div className="flex items-center gap-2">
          <CompartirOfertaButton
            variant="full"
            label="Compartir página"
            path={`/empresas/${company.slug}`}
            titulo={company.name}
            texto={`Conoce ${company.name} en MembeGo: membresías, promociones y beneficios.`}
          />
          <Button asChild variant="outline">
            <Link href={`/empresas/${company.slug}`} target="_blank">
              Ver mi página pública <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
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
          codigoPostal: company.codigoPostal,
          razonSocial: company.razonSocial,
          zonaCobertura: company.zonaCobertura,
          latitud: company.latitud,
          longitud: company.longitud,
          telefono: company.telefono,
          whatsapp: company.whatsapp,
          email: company.email,
          website: company.website,
          instagram: company.instagram,
          facebook: company.facebook,
          tiktok: company.tiktok,
          googleMapsUrl: company.googleMapsUrl,
          moneda: company.moneda,
          zonaHoraria: company.zonaHoraria,
          idioma: company.idioma,
          colorPrimario: company.colorPrimario,
          politicaCancelacion: company.politicaCancelacion,
          politicaPrivacidad: company.politicaPrivacidad,
          terminosEmpresa: company.terminosEmpresa,
        }}
        categories={categories}
        selectedCategoryIds={selectedCategoryIds}
      />

      {/* O-14: QR de registro para imprimir/compartir en el local */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">QR de registro</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-slate-500">
            Imprime este código y colócalo en tu local. Tus clientes lo escanean
            y se registran directamente en tu empresa.
          </p>
          <CompanyQRRegistro
            url={`${getAppUrl()}/registro/${company.slug}`}
            companySlug={company.slug}
          />
        </CardContent>
      </Card>
    </div>
  )
}
