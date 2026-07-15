import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CompanyProfile } from '@/components/marketplace/CompanyProfile'
import {
  getCompanyPublic,
  getCompanyStats,
  getCompanyPlanesPublic,
  getCompanyPostsPublic,
  getPromotionsPublic,
} from '@/modules/marketplace/queries'
import { getRegionalPrefs } from '@/modules/empresas/regional'
import { getCompanyResenas } from '@/modules/resenas/queries'
import { SITE_NAME } from '@/lib/site'

interface CompanyDetailPageProps {
  params: Promise<{ companySlug: string }>
}

export const revalidate = 3600

// Fase separación · SEO del marketplace: metadata dinámica + canónico por
// empresa (para que al separar dominios el canónico apunte correctamente).
export async function generateMetadata({
  params,
}: CompanyDetailPageProps): Promise<Metadata> {
  const { companySlug } = await params
  const company = await getCompanyPublic(companySlug)
  if (!company) return { title: `Empresa · ${SITE_NAME}` }

  const ubicacion = [company.ciudad, company.provincia].filter(Boolean).join(', ')
  const title = company.name
  const description =
    company.description ||
    `Descubre las membresías y promociones de ${company.name}${ubicacion ? ` en ${ubicacion}` : ''} en ${SITE_NAME}.`
  const url = `/empresas/${company.slug}`

  return {
    title,
    description: description.slice(0, 200),
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      title: `${title} · ${SITE_NAME}`,
      description: description.slice(0, 200),
      url,
      ...(company.logoUrl ? { images: [{ url: company.logoUrl }] } : {}),
    },
    twitter: { card: 'summary_large_image', title, description: description.slice(0, 200) },
  }
}

export default async function CompanyDetailPage({
  params,
}: CompanyDetailPageProps) {
  const { companySlug } = await params

  const company = await getCompanyPublic(companySlug)
  if (!company) notFound()

  const [stats, planes, promotions, posts, prefs, resenas] = await Promise.all([
    getCompanyStats(companySlug),
    getCompanyPlanesPublic(company.id),
    getPromotionsPublic({ company: companySlug, limit: 12 }),
    getCompanyPostsPublic(company.id),
    getRegionalPrefs(company.id),
    getCompanyResenas(company.id),
  ])

  return (
    <CompanyProfile
      mode="public"
      company={company}
      stats={stats}
      planes={planes}
      promotions={promotions}
      posts={posts}
      prefs={prefs}
      resenas={resenas}
    />
  )
}
