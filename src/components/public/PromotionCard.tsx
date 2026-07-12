import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Clock, Gift } from 'lucide-react'
import type { PromotionPublic } from '@/modules/marketplace/types'
import { formatDescuento } from '@/lib/promociones'

interface PromotionCardProps {
  promotion: PromotionPublic
  variant?: 'default' | 'compact'
  /**
   * Base de la ruta del detalle. Público = '/promocion' (Landing); dentro de la
   * app se pasa '/cliente/promociones' para no salir del contexto autenticado.
   */
  hrefBase?: string
}

function fechaCorta(d: string | Date) {
  return new Intl.DateTimeFormat('es-DO', { timeZone: 'America/Santo_Domingo', day: 'numeric', month: 'short' }).format(
    new Date(d)
  )
}

export function PromotionCard({
  promotion,
  variant = 'default',
  hrefBase = '/promocion',
}: PromotionCardProps) {
  const isExpired =
    promotion.vigenciaHasta && new Date(promotion.vigenciaHasta) < new Date()

  if (variant === 'compact') {
    return (
      <Link href={`${hrefBase}/${promotion.id}`} className="group block">
        <div className="card-interactive overflow-hidden rounded-2xl border border-border/60 bg-card">
          <div className="relative h-24 w-full overflow-hidden bg-gradient-to-br from-blue-600 to-sky-500">
            {promotion.imagenUrl ? (
              <Image
                src={promotion.imagenUrl}
                alt={promotion.titulo}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Gift className="h-6 w-6 text-white/60" />
              </div>
            )}
            {promotion.descuento && (
              <span className="absolute right-2 top-2 rounded-full bg-white/95 px-2 py-0.5 text-xs font-bold text-info shadow-sm">
                {formatDescuento(promotion.descuento, promotion.tipo)}
              </span>
            )}
          </div>
          <div className="p-3">
            <p className="line-clamp-1 text-small font-semibold text-foreground">
              {promotion.titulo}
            </p>
            <p className="mt-0.5 line-clamp-1 text-caption">{promotion.company.name}</p>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link href={`${hrefBase}/${promotion.id}`} className="group block h-full">
      <div className="card-interactive relative flex h-full flex-col overflow-hidden rounded-3xl border border-border/60 bg-card">
        {/* Imagen protagonista */}
        <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-sky-500">
          {promotion.imagenUrl ? (
            <Image
              src={promotion.imagenUrl}
              alt={promotion.titulo}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <>
              <div className="absolute inset-0 bg-grid-light opacity-50" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Gift className="h-10 w-10 text-white/50" />
              </div>
            </>
          )}

          {/* Empresa: chip glass sobre la imagen */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-white/90 py-1 pl-1 pr-3 shadow-sm backdrop-blur">
            {promotion.company.logoUrl ? (
              <span className="relative block h-5 w-5 overflow-hidden rounded-full">
                <Image
                  src={promotion.company.logoUrl}
                  alt=""
                  fill
                  className="object-cover"
                />
              </span>
            ) : (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
                {promotion.company.name.slice(0, 1).toUpperCase()}
              </span>
            )}
            <span className="max-w-36 truncate text-xs font-medium text-foreground">
              {promotion.company.name}
            </span>
          </div>

          {/* Descuento / destacada */}
          <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
            {promotion.descuento && (
              <span className="rounded-full bg-white/95 px-2.5 py-1 text-sm font-bold text-info shadow-sm">
                {formatDescuento(promotion.descuento, promotion.tipo)}
              </span>
            )}
            {promotion.isFeatured && !isExpired && (
              <span className="rounded-full bg-primary/90 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
                Destacada
              </span>
            )}
          </div>

          {/* Expirada */}
          {isExpired && (
            <div className="absolute inset-0 flex items-center justify-center bg-foreground/55 backdrop-blur-[2px]">
              <span className="rounded-full border border-white/30 px-4 py-1.5 text-sm font-semibold text-white">
                Expirada
              </span>
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="flex flex-1 flex-col p-5">
          <h3 className="text-h3 line-clamp-2 text-foreground transition-colors group-hover:text-info">
            {promotion.titulo}
          </h3>

          {promotion.descripcion && (
            <p className="mt-1.5 line-clamp-2 text-small text-muted-foreground">
              {promotion.descripcion}
            </p>
          )}

          {promotion.codigo && (
            <div className="mt-3 inline-flex w-fit items-center gap-2 rounded-lg border border-dashed border-border bg-muted/50 px-2.5 py-1">
              <span className="text-caption">Código</span>
              <code className="font-mono text-xs font-bold text-foreground">
                {promotion.codigo}
              </code>
            </div>
          )}

          {promotion.tags && promotion.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {promotion.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-primary/8 px-2 py-0.5 text-xs font-medium text-info"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Pie: vigencia + CTA */}
          <div className="mt-auto flex items-center justify-between pt-4">
            {promotion.vigenciaHasta ? (
              <span
                className={`inline-flex items-center gap-1.5 text-xs ${
                  isExpired ? 'font-medium text-destructive' : 'text-muted-foreground'
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                {isExpired ? 'Expiró' : 'Hasta'} el {fechaCorta(promotion.vigenciaHasta)}
              </span>
            ) : (
              <span />
            )}
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              Adquirir promoción <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
