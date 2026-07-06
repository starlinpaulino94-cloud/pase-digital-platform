import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { StatsBar } from '@/components/public/StatsBar'
import { PromotionGrid } from '@/components/public/PromotionGrid'
import {
  getCompanyPublic,
  getCompanyStats,
  getPromotionsPublic,
} from '@/modules/marketplace/queries'

interface CompanyDetailPageProps {
  params: Promise<{ companySlug: string }>
}

export const revalidate = 3600

export default async function CompanyDetailPage({
  params,
}: CompanyDetailPageProps) {
  const { companySlug } = await params

  const [company, stats, promotions] = await Promise.all([
    getCompanyPublic(companySlug),
    getCompanyStats(companySlug),
    getPromotionsPublic({ company: companySlug, limit: 12 }),
  ])

  if (!company || !stats) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Banner */}
      {company.bannerUrl && (
        <div className="relative h-64 w-full overflow-hidden bg-neutral-100">
          <Image
            src={company.bannerUrl}
            alt={company.name}
            fill
            className="object-cover"
          />
        </div>
      )}

      {/* Company Info Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header with Logo */}
        <div className="flex flex-col sm:flex-row gap-6 items-start mb-8">
          {company.logoUrl && (
            <div className="relative h-32 w-32 overflow-hidden rounded-lg border-4 border-neutral-200 bg-white shadow-md flex-shrink-0">
              <Image
                src={company.logoUrl}
                alt={company.name}
                fill
                className="object-cover"
              />
            </div>
          )}

          <div className="flex-1">
            <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900">
              {company.name}
            </h1>

            {company.description && (
              <p className="text-neutral-600 mt-3 text-lg">
                {company.description}
              </p>
            )}

            {/* Location */}
            {company.ciudad && (
              <p className="text-neutral-600 mt-2 flex items-center gap-2">
                📍 {company.ciudad}
                {company.provincia && `, ${company.provincia}`}
                {company.pais && `, ${company.pais}`}
              </p>
            )}

            {/* Contact Info */}
            <div className="flex flex-wrap gap-4 mt-4">
              {company.email && (
                <a
                  href={`mailto:${company.email}`}
                  className="text-blue-600 hover:underline text-sm"
                >
                  📧 {company.email}
                </a>
              )}
              {company.telefono && (
                <a
                  href={`tel:${company.telefono}`}
                  className="text-blue-600 hover:underline text-sm"
                >
                  ☎️ {company.telefono}
                </a>
              )}
              {company.whatsapp && (
                <a
                  href={`https://wa.me/${company.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:underline text-sm"
                >
                  💬 WhatsApp
                </a>
              )}
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  🌐 Sitio Web
                </a>
              )}
            </div>

            {/* Social Media */}
            {(company.instagram ||
              company.facebook ||
              company.tiktok) && (
              <div className="flex gap-3 mt-4">
                {company.instagram && (
                  <a
                    href={company.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-600 hover:opacity-75"
                  >
                    📷 Instagram
                  </a>
                )}
                {company.facebook && (
                  <a
                    href={company.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:opacity-75"
                  >
                    f Facebook
                  </a>
                )}
                {company.tiktok && (
                  <a
                    href={company.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-900 hover:opacity-75"
                  >
                    🎵 TikTok
                  </a>
                )}
              </div>
            )}
          </div>

          {/* CTA */}
          <Link
            href={`/registro/${company.slug}`}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap font-semibold"
          >
            Registrarse
          </Link>
        </div>

        {/* Gallery */}
        {company.galleryImages && company.galleryImages.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">
              Galería
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {company.galleryImages.map((image, idx) => (
                <div
                  key={idx}
                  className="relative h-48 w-full overflow-hidden rounded-lg bg-neutral-100"
                >
                  <Image
                    src={image}
                    alt={`${company.name} - ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Stats */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">
            Estadísticas
          </h2>
          <StatsBar stats={stats} />
        </section>

        {/* Promotions */}
        {promotions && promotions.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">
              Promociones Vigentes
            </h2>
            <PromotionGrid
              promotions={promotions}
              isLoading={false}
              variant="default"
            />
          </section>
        )}

        {/* Google Maps */}
        {company.googleMapsUrl && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">
              Ubicación
            </h2>
            <a
              href={company.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline flex items-center gap-2"
            >
              📍 Ver en Google Maps
            </a>
          </section>
        )}
      </div>

      {/* Related Companies CTA */}
      <section className="bg-neutral-50 py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-neutral-900">
            ¿Buscas más beneficios?
          </h2>
          <p className="text-neutral-600 mt-2">
            Explora otras empresas y sus promociones exclusivas
          </p>
          <Link
            href="/empresas"
            className="inline-block mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ver todas las empresas
          </Link>
        </div>
      </section>
    </div>
  )
}
