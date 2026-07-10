import Link from 'next/link'
import Image from 'next/image'
import type { PromotionPublic } from '@/modules/marketplace/types'

interface PromotionCardProps {
  promotion: PromotionPublic
  variant?: 'default' | 'compact'
  /**
   * Base de la ruta del detalle. Público = '/promocion' (Landing); dentro de la
   * app se pasa '/cliente/promociones' para no salir del contexto autenticado.
   */
  hrefBase?: string
}

export function PromotionCard({
  promotion,
  variant = 'default',
  hrefBase = '/promocion',
}: PromotionCardProps) {
  const isExpired = promotion.vigenciaHasta && new Date(promotion.vigenciaHasta) < new Date()

  if (variant === 'compact') {
    return (
      <Link href={`${hrefBase}/${promotion.id}`}>
        <div className="group overflow-hidden rounded-lg border border-neutral-200 bg-white transition-all duration-300 hover:shadow-md">
          {promotion.imagenUrl && (
            <div className="relative h-24 w-full overflow-hidden bg-neutral-100">
              <Image
                src={promotion.imagenUrl}
                alt={promotion.titulo}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          )}
          <div className="p-2">
            <p className="font-semibold text-neutral-900 text-sm line-clamp-1">
              {promotion.titulo}
            </p>
            {promotion.descuento && (
              <p className="text-xs text-blue-600 font-bold">
                -{promotion.descuento}%
              </p>
            )}
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link href={`${hrefBase}/${promotion.id}`}>
      <div className="group relative overflow-hidden rounded-lg border border-neutral-200 bg-white transition-all duration-300 hover:shadow-lg">
        {/* Image */}
        {promotion.imagenUrl && (
          <div className="relative h-48 w-full overflow-hidden bg-neutral-100">
            <Image
              src={promotion.imagenUrl}
              alt={promotion.titulo}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}

        {/* Content */}
        <div className="p-4 space-y-2">
          {/* Company */}
          <div className="flex items-center gap-2">
            {promotion.company.logoUrl && (
              <div className="relative h-6 w-6 overflow-hidden rounded-full bg-neutral-100">
                <Image
                  src={promotion.company.logoUrl}
                  alt={promotion.company.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <span className="text-xs text-neutral-600 font-medium">
              {promotion.company.name}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-neutral-900 line-clamp-2">
            {promotion.titulo}
          </h3>

          {/* Description */}
          {promotion.descripcion && (
            <p className="text-sm text-neutral-600 line-clamp-2">
              {promotion.descripcion}
            </p>
          )}

          {/* Discount Badge */}
          {promotion.descuento && (
            <div className="inline-block rounded-full bg-red-100 text-red-700 px-3 py-1 text-sm font-bold">
              -{promotion.descuento}%
            </div>
          )}

          {/* Code */}
          {promotion.codigo && (
            <div className="flex items-center gap-2 rounded-lg bg-neutral-50 p-2">
              <span className="text-xs text-neutral-600">Código:</span>
              <code className="font-mono font-bold text-neutral-900 text-sm">
                {promotion.codigo}
              </code>
            </div>
          )}

          {/* Validity */}
          <div className="text-xs text-neutral-500 space-y-1">
            {promotion.vigenciaDesde && (
              <div>
                Desde: {new Date(promotion.vigenciaDesde).toLocaleDateString('es-ES')}
              </div>
            )}
            {promotion.vigenciaHasta && (
              <div className={isExpired ? 'text-red-600 font-semibold' : ''}>
                Hasta: {new Date(promotion.vigenciaHasta).toLocaleDateString('es-ES')}
                {isExpired && ' (Expirada)'}
              </div>
            )}
          </div>

          {/* Tags */}
          {promotion.tags && promotion.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {promotion.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-block rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-xs"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="flex justify-between border-t border-neutral-100 pt-2 text-xs text-neutral-500">
            <span>👁 {promotion.viewCount}</span>
            <span>📤 {promotion.shareCount}</span>
          </div>
        </div>

        {/* Featured Badge */}
        {promotion.isFeatured && (
          <div className="absolute top-2 right-2 rounded-full bg-blue-500 text-white px-2 py-1 text-xs font-semibold">
            Destacada
          </div>
        )}

        {/* Expired Overlay */}
        {isExpired && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="text-white font-bold text-lg">Expirada</div>
          </div>
        )}
      </div>
    </Link>
  )
}
