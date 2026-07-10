import Link from 'next/link'
import Image from 'next/image'
import { SharePromocion } from '@/components/public/SharePromocion'
import type { PromotionPublic } from '@/modules/marketplace/types'

export interface PromotionDetailProps {
  /**
   * 'public' = detalle dentro de la Landing (CTA de registro).
   * 'app'    = detalle interno dentro de la aplicación autenticada; los enlaces
   *            a la empresa y de vuelta permanecen dentro del sistema.
   */
  mode: 'public' | 'app'
  promotion: PromotionPublic
}

export function PromotionDetail({ mode, promotion }: PromotionDetailProps) {
  const isApp = mode === 'app'
  const isExpired =
    promotion.vigenciaHasta && new Date(promotion.vigenciaHasta) < new Date()

  const backHref = isApp ? '/cliente/promociones' : '/promociones'
  const empresaHref = isApp
    ? `/cliente/empresas/${promotion.company.slug}`
    : `/empresas/${promotion.company.slug}`
  const registroHref = `/registro/${promotion.company.slug}`

  return (
    <div className={isApp ? 'bg-white' : 'min-h-screen bg-white'}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Link */}
        <Link href={backHref} className="text-blue-600 hover:underline flex items-center gap-2">
          ← Volver a promociones
        </Link>

        {/* Main Card */}
        <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200/80 shadow-premium">
          {/* Image */}
          {promotion.imagenUrl && (
            <div className="relative h-96 w-full overflow-hidden bg-slate-100">
              <Image
                src={promotion.imagenUrl}
                alt={promotion.titulo}
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-slate-900">
                  {promotion.titulo}
                </h1>

                {/* Company */}
                <div className="flex items-center gap-3 mt-4">
                  {promotion.company.logoUrl && (
                    <div className="relative h-10 w-10 overflow-hidden rounded-full bg-slate-100">
                      <Image
                        src={promotion.company.logoUrl}
                        alt={promotion.company.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-slate-900">
                      {promotion.company.name}
                    </p>
                    <Link
                      href={empresaHref}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Ver empresa
                    </Link>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              {isExpired && (
                <div className="bg-red-100 text-red-800 px-4 py-2 rounded-lg font-semibold">
                  Expirada
                </div>
              )}
              {promotion.isFeatured && (
                <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-semibold flex items-center gap-2">
                  ⭐ Destacada
                </div>
              )}
            </div>

            {/* Main Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-6 border-y border-slate-200">
              {/* Discount */}
              {promotion.descuento && (
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-red-600">
                    -{promotion.descuento}%
                  </div>
                  <div className="text-sm text-slate-600">Descuento</div>
                </div>
              )}

              {/* Code */}
              {promotion.codigo && (
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <code className="text-2xl font-bold text-blue-600">
                    {promotion.codigo}
                  </code>
                  <div className="text-sm text-slate-600">Código</div>
                </div>
              )}

              {/* Type */}
              <div className="rounded-xl bg-slate-50 p-4 text-center">
                <div className="text-lg font-bold text-slate-900 capitalize">
                  {promotion.tipo}
                </div>
                <div className="text-sm text-slate-600">Tipo</div>
              </div>
            </div>

            {/* Description */}
            {promotion.descripcion && (
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-3">
                  Descripción
                </h2>
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {promotion.descripcion}
                </p>
              </div>
            )}

            {/* Validity */}
            <div className="rounded-xl bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900 mb-2">Vigencia</h3>
              <div className="space-y-1 text-sm text-slate-700">
                {promotion.vigenciaDesde && (
                  <div>
                    <span className="font-semibold">Desde:</span>{' '}
                    {new Date(promotion.vigenciaDesde).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                )}
                {promotion.vigenciaHasta && (
                  <div className={isExpired ? 'text-red-600 font-semibold' : ''}>
                    <span className="font-semibold">Hasta:</span>{' '}
                    {new Date(promotion.vigenciaHasta).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                    {isExpired && ' (Expirada)'}
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            {promotion.tags && promotion.tags.length > 0 && (
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Categorías</h3>
                <div className="flex flex-wrap gap-2">
                  {promotion.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Stats + compartir */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex gap-4 text-sm text-slate-600">
                <span>{promotion.viewCount} vistas</span>
                <span>{promotion.shareCount} compartidas</span>
              </div>
              <SharePromocion
                promocionId={promotion.id}
                titulo={promotion.titulo}
                companyName={promotion.company.name}
              />
            </div>

            {/* CTA */}
            {!isExpired && (
              <div className="pt-4">
                {isApp ? (
                  <Link
                    href={empresaHref}
                    className="w-full block text-center bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 transition-colors font-bold text-lg"
                  >
                    Ver empresa y sus planes
                  </Link>
                ) : (
                  <Link
                    href={registroHref}
                    className="w-full block text-center bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 transition-colors font-bold text-lg"
                  >
                    Registrarse para acceder a esta promoción
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Related Company Info */}
        <div className="mt-12 rounded-2xl bg-slate-50 p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Más sobre {promotion.company.name}
          </h2>
          <p className="text-slate-700 mb-4">
            Descubre todas las promociones y beneficios que ofrece esta empresa
          </p>
          <Link
            href={empresaHref}
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ver empresa completa
          </Link>
        </div>
      </div>
    </div>
  )
}
