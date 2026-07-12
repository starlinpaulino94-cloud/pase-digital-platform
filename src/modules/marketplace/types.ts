// Public marketplace types - Deconstructed for security (no sensitive fields)

export interface CompanyPublic {
  id: string
  name: string
  slug: string
  type: string
  description: string | null
  logoUrl: string | null
  bannerUrl: string | null
  galleryImages: string[]
  ciudad: string | null
  provincia: string | null
  pais: string | null
  telefono: string | null
  whatsapp: string | null
  email: string | null
  website: string | null
  instagram: string | null
  facebook: string | null
  tiktok: string | null
  googleMapsUrl: string | null
  horario: string | null
  totalMembersCount: number
  activePromotionsCount: number
  averageRating: number | null
  isFeatured: boolean
  categories: string[] // slugs
  createdAt: Date
}

export interface PromotionPublic {
  id: string
  titulo: string
  slug: string | null
  descripcion: string
  imagenUrl: string | null
  tipo: string
  descuento: number | null
  codigo: string | null
  vigenciaDesde: Date
  vigenciaHasta: Date | null
  viewCount: number
  shareCount: number
  tags: string[]
  isFeatured: boolean
  company: {
    id: string
    name: string
    slug: string
    logoUrl: string | null
  }
  createdAt: Date
  /** Fase E5: datos de venta directa (solo si la promoción es comprable). */
  venta?: {
    precio: number
    usosPorCompra: number
    agotada: boolean
    beneficioVigenciaDias: number | null
    beneficioVigenciaHasta: Date | null
  } | null
}

export interface CategoryPublic {
  id: string
  name: string
  slug: string
  icon: string | null
  description: string | null
  order: number
  companyCount: number
}

export interface CompanyStats {
  totalMembers: number
  activePromotions: number
  averageRating: number | null
  totalRatings: number
}

export interface MarketplaceFilters {
  search?: string
  category?: string
  city?: string
  country?: string
  type?: string
  featured?: boolean
  limit?: number
  offset?: number
}

export interface PromotionFilters {
  search?: string
  company?: string
  type?: string
  tag?: string
  limit?: number
  offset?: number
}
