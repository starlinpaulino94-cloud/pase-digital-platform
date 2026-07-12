import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Star, Gift, Users, ArrowUpRight } from 'lucide-react'
import type { CompanyPublic } from '@/modules/marketplace/types'

interface CompanyCardProps {
  company: CompanyPublic
  /**
   * Base de la ruta del perfil. Público = '/empresas' (Landing); dentro de la
   * app se pasa '/cliente/empresas' para no salir del contexto autenticado.
   */
  hrefBase?: string
}

const TIPO_LABEL: Record<string, string> = {
  carwash: 'Car Wash',
  restaurante: 'Restaurante',
  gimnasio: 'Gimnasio',
  salon: 'Salón',
}

export function CompanyCard({ company, hrefBase = '/empresas' }: CompanyCardProps) {
  const initials = company.name.slice(0, 2).toUpperCase()

  return (
    <Link href={`${hrefBase}/${company.slug}`} className="group block">
      <div className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-border/80 bg-card shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:border-info/30 hover:shadow-premium-lg">
        {/* Banner o gradiente de marca */}
        <div className="relative h-28 w-full overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-sky-500">
          {company.bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={company.bannerUrl}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-grid-light opacity-60" />
          )}

          {company.isFeatured && (
            <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-info shadow-sm backdrop-blur">
              <Star className="h-3 w-3 fill-blue-500 text-primary" /> Destacada
            </span>
          )}

          {/* Flecha que aparece al hover */}
          <span className="absolute left-3 top-3 flex h-8 w-8 translate-y-1 items-center justify-center rounded-full bg-white/90 text-primary opacity-0 shadow-sm backdrop-blur transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>

        {/* Logo flotante */}
        <div className="-mt-9 flex justify-center px-4">
          {company.logoUrl ? (
            <div className="relative h-[4.5rem] w-[4.5rem] overflow-hidden rounded-2xl border-4 border-white bg-card shadow-premium">
              <Image src={company.logoUrl} alt={company.name} fill className="object-cover" />
            </div>
          ) : (
            <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-blue-500 to-indigo-600 text-xl font-bold text-white shadow-premium">
              {initials}
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="flex flex-1 flex-col px-5 pb-5 pt-3 text-center">
          <h3 className="line-clamp-1 font-semibold tracking-tight text-foreground transition-colors group-hover:text-info">
            {company.name}
          </h3>

          <div className="mt-1.5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-muted px-2.5 py-0.5 font-medium">
              {TIPO_LABEL[company.type] ?? company.type}
            </span>
            {company.ciudad && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {company.ciudad}
              </span>
            )}
          </div>

          {company.description && (
            <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {company.description}
            </p>
          )}

          {/* Stats con datos reales (solo si aportan) */}
          <div className="mt-auto flex items-center justify-center gap-4 border-t border-border/60 pt-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Gift className="h-3.5 w-3.5 text-destructive" />
              {company.activePromotionsCount} promos
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-primary" />
              {company.totalMembersCount} miembros
            </span>
            {company.averageRating != null && (
              <span className="inline-flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-warning-foreground" />
                {Number(company.averageRating).toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
