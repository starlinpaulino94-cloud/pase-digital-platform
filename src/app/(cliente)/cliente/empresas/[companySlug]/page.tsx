import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/guards'
import { CompanyProfile } from '@/components/marketplace/CompanyProfile'
import {
  getCompanyPublic,
  getCompanyStats,
  getCompanyPlanesPublic,
  getCompanyPostsPublic,
  getPromotionsPublic,
} from '@/modules/marketplace/queries'
import { getRegionalPrefs } from '@/modules/empresas/regional'

export const dynamic = 'force-dynamic'

interface ClienteEmpresaPageProps {
  params: Promise<{ companySlug: string }>
}

/**
 * Perfil de empresa INTERNO. Misma información que el perfil público pero
 * renderizado dentro del AppShell: el cliente autenticado nunca sale a la
 * Landing. Reutiliza <CompanyProfile mode="app" />.
 */
export default async function ClienteEmpresaPage({
  params,
}: ClienteEmpresaPageProps) {
  const user = await requireRole('CLIENTE')
  const { companySlug } = await params

  const company = await getCompanyPublic(companySlug)
  if (!company) notFound()

  const [stats, planes, promotions, posts, prefs] = await Promise.all([
    getCompanyStats(companySlug),
    getCompanyPlanesPublic(company.id),
    getPromotionsPublic({ company: companySlug, limit: 12 }),
    getCompanyPostsPublic(company.id),
    getRegionalPrefs(company.id),
  ])

  // Solo si es la empresa activa del cliente puede elegir/cambiar plan desde
  // aquí (la pantalla de planes está acotada a esa empresa). Para el resto, el
  // perfil es informativo + seguir; no se envía a la Landing de registro.
  const planesHref =
    company.id === user.metadata.companyId ? '/cliente/planes' : null

  return (
    <CompanyProfile
      mode="app"
      company={company}
      stats={stats}
      planes={planes}
      promotions={promotions}
      posts={posts}
      prefs={prefs}
      planesHref={planesHref}
    />
  )
}
