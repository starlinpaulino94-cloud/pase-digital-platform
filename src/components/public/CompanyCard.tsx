import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Star, Gift, Users } from 'lucide-react'
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
      <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg">
        {/* Banner o gradiente de marca */}
        <div className="relative h-24 w-full overflow-hidden bg-gradient-to-br from-blue-600 to-sky-500">
          {company.bannerUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={company.bannerUrl}
              alt=""
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          )}
          {company.isFeatured && (
            <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-blue-700">
              <Star className="h-3 w-3 fill-blue-500 text-blue-500" /> Destacada
            </span>
          )}
        </div>

        {/* Logo */}
        <div className="-mt-8 flex justify-center px-4">
          {company.logoUrl ? (
            <div className="relative h-16 w-16 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-md">
              <Image src={company.logoUrl} alt={company.name} fill className="object-cover" />
            </div>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-blue-500 to-indigo-600 text-lg font-bold text-white shadow-md">
              {initials}
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="flex flex-1 flex-col px-4 pb-4 pt-3 text-center">
          <h3 className="line-clamp-1 font-semibold text-slate-900">{company.name}</h3>

          <div className="mt-1 flex items-center justify-center gap-2 text-xs text-slate-500">
            <span className="rounded-full bg-slate-100 px-2 py-0.5">
              {TIPO_LABEL[company.type] ?? company.type}
            </span>
            {company.ciudad && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {company.ciudad}
              </span>
            )}
          </div>

          {company.description && (
            <p className="mt-2 line-clamp-2 text-xs text-slate-600">{company.description}</p>
          )}

          {/* Stats con datos reales (solo si aportan) */}
          <div className="mt-auto flex items-center justify-center gap-4 border-t border-slate-100 pt-3 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1">
              <Gift className="h-3.5 w-3.5 text-rose-500" />
              {company.activePromotionsCount} promos
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-blue-500" />
              {company.totalMembersCount} miembros
            </span>
            {company.averageRating != null && (
              <span className="inline-flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {Number(company.averageRating).toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
